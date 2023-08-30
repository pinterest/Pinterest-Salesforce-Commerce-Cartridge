'use strict';

var page = module.superModule;
var server = require('server');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');

server.extend(page);

server.append('PlaceOrder', function (req, res, next) {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var siteCurrent = Site.getCurrent();
    var pinterestAppID = siteCurrent.getCustomPreferenceValue('pinterestAppID');

    try {
        if (
            pinterestHelpers.isConnected()
            && siteCurrent.getCustomPreferenceValue('pinterestEnabledCatalogIngestion')
            && siteCurrent.getCustomPreferenceValue('pinterestEnabledRealtimeCatalogCalls')
            && res.viewData
            && res.viewData.orderID
            && res.viewData.orderToken
            && res.viewData.error === false
        ) {
            var order = require('dw/order/OrderMgr').getOrder(res.viewData.orderID, res.viewData.orderToken);
            var orderProductLineItems = order.getAllProductLineItems();
            var orderProductLineItemsIterator = orderProductLineItems.iterator();
            var inventoryModel = require('*/cartridge/models/pinterest/inventory');
            var productData = inventoryModel.getData(orderProductLineItemsIterator);

            // if we have products that are not in stock then send them to the API
            if (productData.items && productData.items.length) {
                // get if it exists
                var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

                if (pinterestConfiguration) {
                    var catalogOutOfStock = JSON.parse(pinterestConfiguration.custom.catalogOutOfStock);
                    if (!catalogOutOfStock[res.viewData.locale]) {
                        catalogOutOfStock[res.viewData.locale] = {
                            "PREORDER": [],
                            "OUT_OF_STOCK": [],
                            "IN_STOCK": []
                        };
                    }

                    for (var i = 0; i < productData.items.length; i++) {
                        if (productData.items[i].attributes.availability === 'OUT_OF_STOCK') {
                            if (catalogOutOfStock[res.viewData.locale].OUT_OF_STOCK.indexOf(productData.items[i].item_id) === -1) {
                                catalogOutOfStock[res.viewData.locale].OUT_OF_STOCK.push(productData.items[i].item_id);
                            }
                        } else if (productData.items[i].attributes.availability === 'PREORDER') {
                            if (catalogOutOfStock[res.viewData.locale].PREORDER.indexOf(productData.items[i].item_id) === -1) {
                                catalogOutOfStock[res.viewData.locale].PREORDER.push(productData.items[i].item_id);
                            }
                        }
                    }

                    // save the JSON out of stock as string
                    Transaction.wrap(function() {
                        pinterestConfiguration.custom.catalogOutOfStock = JSON.stringify(catalogOutOfStock);
                    });
                } else {
                    pinterestLogger.error('Pinterest error: Pinterest configuration not defined during PlaceOrder');
                }
            }
        }
    } catch (e) {
        pinterestLogger.error('Pinterest error: PlaceOrder, ' + ((e && e.message)? e.message : 'unknown error'));
    }

    next();
});

module.exports = server.exports();
