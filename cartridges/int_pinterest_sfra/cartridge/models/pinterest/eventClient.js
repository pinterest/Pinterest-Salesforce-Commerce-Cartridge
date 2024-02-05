'use strict';

// Event Code API Documentation: https://help.pinterest.com/en/business/article/add-event-codes

/**
 * @param {Object} pdict - current request data
 * @param {String} pagetype - pinterest page type category
 * @returns {Object} an object of containing tag data
 */
function getEvent(pdict, pagetype) {
    var eventData = {
        'track': pagetype,
        'data': {}
    };

    module.exports.methods.getNP(eventData.data, pdict);
    module.exports.methods.getCurrency(eventData.data, pdict);
    module.exports.methods.getProperty(eventData.data, pdict);
    module.exports.methods.getEventID(eventData.data, pdict);
    module.exports.methods.getProductLineItems(eventData.data, pdict);
    module.exports.methods.getSearchQuery(eventData.data, pdict);
    module.exports.methods.getValue(eventData.data, pdict);
    module.exports.methods.getOrderID(eventData.data, pdict);

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getNP(eventData, pdict) {  // eslint-disable-line no-unused-vars
    Object.defineProperty(eventData, 'np', {
        enumerable: true,
        value: 'salesforce'
    });

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getCurrency(eventData, pdict) {    // eslint-disable-line no-unused-vars
    Object.defineProperty(eventData, 'currency', {
        enumerable: true,
        value: require('dw/system/Site').getCurrent().getDefaultCurrency()
    });

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getEventID(eventData, pdict) {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
    var eventID = pinterestHelpers.getEventID(pdict);

    if (eventID) {
        Object.defineProperty(eventData, 'event_id', {
            enumerable: true,
            value: eventID
        });
    }

    return eventData;
}


/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductID(eventData, product) {
    if (product.id) {
        Object.defineProperty(eventData, 'product_id', {
            enumerable: true,
            value: product.id
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductName(eventData, product) {
    if (product.productName) {
        Object.defineProperty(eventData, 'product_name', {
            enumerable: true,
            value: product.productName
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductPrice(eventData, product) {
    var price;

    //normalize price
    if (product.price && product.price.sales && product.price.sales.decimalPrice) {
        price = product.price.sales.decimalPrice;
    } else if (product.priceTotal && product.priceTotal.decimalPrice) {
        price = product.priceTotal.decimalPrice;
    }

    if (price) {
        Object.defineProperty(eventData, 'product_price', {
            enumerable: true,
            value: price
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductBrand(eventData, product) {
    if (product.brand) {
        Object.defineProperty(eventData, 'product_brand', {
            enumerable: true,
            value: product.brand
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductCategory(eventData, product) {
    if (product.pinterest && product.pinterest.category) {
        Object.defineProperty(eventData, 'product_category', {
            enumerable: true,
            value: product.pinterest.category
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} product - current product
 * @returns {Object} an object of containing tag data
 */
function getProductQuantity(eventData, product) {
    if (product.quantity) {
        Object.defineProperty(eventData, 'product_quantity', {
            enumerable: true,
            value: product.quantity
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getProductLineItems(eventData, pdict) {

    var items;
    var lineItems = [];

    //normalize items array
    if (pdict.items && pdict.items.length) {
        items = pdict.items.toArray();
    } else if (pdict.order && pdict.order.items && pdict.order.items.items) {
        items = pdict.order.items.items;
    } else if (pdict.product) {
        items = [pdict.product];
    } else if (pdict.productSearch && pdict.productSearch.isCategorySearch) {
        items = [];
        pdict.productSearch.productIds.forEach(function (result) {
            if (result.productSearchHit) {
                var productData = {};
                productData['id'] = result.productSearchHit.productID;
                productData['productName'] = result.productSearchHit.product.name;
                productData['brand'] = result.productSearchHit.product.brand;
                productData['pinterest'] = {
                    category: pdict.productSearch.category.id
                };
                productData['quantity'] = 1;
                items.push(productData);
            }
        });
    }

    if (items) {
        items.forEach(function(product) {
            var productData = {};

            module.exports.methods.getProductID(productData, product);
            module.exports.methods.getProductName(productData, product);
            module.exports.methods.getProductPrice(productData, product);
            module.exports.methods.getProductBrand(productData, product);
            module.exports.methods.getProductCategory(productData, product);
            module.exports.methods.getProductQuantity(productData, product);

            lineItems.push(productData);
        });

        Object.defineProperty(eventData, 'line_items', {
            enumerable: true,
            value: lineItems
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getProperty(eventData, pdict) {    // eslint-disable-line no-unused-vars
    Object.defineProperty(eventData, 'property', {
        enumerable: true,
        value: require('dw/system/Site').getCurrent().getName()
    });

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getSearchQuery(eventData, pdict) {
    if (pdict.productSearch && pdict.productSearch.searchKeywords) {
        Object.defineProperty(eventData, 'search_query', {
            enumerable: true,
            value: pdict.productSearch.searchKeywords
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getValue(eventData, pdict) {

    var grandTotal;

    if (pdict.totals && pdict.totals.grandTotal) {
        grandTotal = pdict.totals.grandTotal;
    } else if (pdict.order && pdict.order.totals && pdict.order.totals.grandTotal) {
        grandTotal = pdict.order.totals.grandTotal;
    }

    if (grandTotal) {
        Object.defineProperty(eventData, 'value', {
            enumerable: true,
            value: Number(grandTotal.replace(/[^0-9.-]+/g,""))
        });
    }

    return eventData;
}

/**
 * @param {Object} eventData - event data object to extend
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getOrderID(eventData, pdict) {
    if (pdict.order && pdict.order.orderNumber) {
        Object.defineProperty(eventData, 'order_id', {
            enumerable: true,
            value: pdict.order.orderNumber
        });
    }

    return eventData;
}


module.exports = {
    getEvent: getEvent,
    methods: {
        getNP: getNP,
        getCurrency: getCurrency,
        getEventID: getEventID,
        getProductID: getProductID,
        getProductName: getProductName,
        getProductPrice: getProductPrice,
        getProductBrand: getProductBrand,
        getProductCategory: getProductCategory,
        getProductQuantity: getProductQuantity,
        getProductLineItems: getProductLineItems,
        getProperty: getProperty,
        getSearchQuery: getSearchQuery,
        getValue: getValue,
        getOrderID: getOrderID
    }
};
