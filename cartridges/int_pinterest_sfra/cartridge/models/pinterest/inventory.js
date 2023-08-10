'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');

/**
 * Decorate event data with order product information
 * @param {dw.order.ProductLineItem} orderProductLineItems - product in order
 *
 * @returns {Object} - Decorated event data model
 */
function getData(orderProductLineItems) {
    var data = {
        items: []
    };

    while (orderProductLineItems.hasNext()) {
        var productLineItem = orderProductLineItems.next();
        var apiProduct = productLineItem.getProduct();

        if (apiProduct && !apiProduct.master) {
            var product = {
                attributes: {}
            };
            var options = pinterestHelpers.getConfig(apiProduct, {});

            module.exports.methods.getProductItemID(product, apiProduct, options);
            module.exports.methods.getProductAvailability(product.attributes, apiProduct, options);

            data.items.push(product);
        }
    }

    return data;
}

/**
 * Decorate event data with order product information
 * @param {dw.order.ProductLineItem} orderProductLineItems - product in order
 *
 * @returns {Object} - Decorated event data model
 */
function getAPIPayload(locale) {
    var data = [];

    var productIDs = pinterestHelpers.getProductIDsWithInventoryStatusChange();

    if (productIDs[locale]) {
        for (var inventoryStatus in productIDs[locale]) {
            for (var i = 0; i < productIDs[locale][inventoryStatus].length; i++) {
                var apiProduct = ProductMgr.getProduct(productIDs[locale][inventoryStatus][i]);

                if (apiProduct && !apiProduct.master) {
                    var product = {
                        attributes: {}
                    };
                    var options = pinterestHelpers.getConfig(apiProduct, {});

                    module.exports.methods.getProductItemID(product, apiProduct, options);
                    module.exports.methods.getProductTitle(product.attributes, apiProduct, options);
                    module.exports.methods.getProductDescription(product.attributes, apiProduct, options);
                    module.exports.methods.getProductAvailability(product.attributes, apiProduct, options);
                    module.exports.methods.getProductPrice(product.attributes, apiProduct, options);

                    data.push(product);
                }
            }
        }
    }

    return data;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductItemID(product, apiProduct, options) {
    if (apiProduct.ID) {
        Object.defineProperty(product, 'item_id', {
            enumerable: true,
            value: apiProduct.ID
        });
    }

    return product;
}

/**
 * Decorate product Attributes with product information
 * @param {Object} productAttributes - Product Attributes Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product attributes model
 */
function getProductTitle(productAttributes, apiProduct, options) {
    if (apiProduct.name) {
        Object.defineProperty(productAttributes, 'title', {
            enumerable: true,
            value: apiProduct.name
        });
    }

    return productAttributes;
}

/**
 * Decorate product Attributes with product information
 * @param {Object} productAttributes - Product Attributes Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product attributes model
 */
function getProductDescription(productAttributes, apiProduct, options) {
    if (apiProduct.shortDescription && apiProduct.shortDescription.source) {
        var shortDescription = pinterestHelpers.stripHTML(apiProduct.shortDescription.source);

        Object.defineProperty(productAttributes, 'description', {
            enumerable: true,
            value: shortDescription
        });
    }

    return productAttributes;
}

/**
 * Decorate product Attributes with product information
 * @param {Object} productAttributes - Product Attributes Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product attributes model
 */
function getProductAvailability(productAttributes, apiProduct, options) {
    var quantity = options.quantity;
    var minOrderQuantity = apiProduct.minOrderQuantity.value;
    var availabilityModel = apiProduct.availabilityModel;
    var productQuantity = quantity ? parseInt(quantity, 10) : minOrderQuantity;
    var availabilityModelLevels = availabilityModel.getAvailabilityLevels(productQuantity);
    var availability = 'OUT_OF_STOCK';

    if (
        availabilityModelLevels
        && availabilityModelLevels.inStock
        && availabilityModelLevels.inStock.value
        && availabilityModelLevels.inStock.value > 0
    ) {
        availability = 'IN_STOCK';
    } else if (
        availabilityModelLevels
        && availabilityModelLevels.preorder
        && availabilityModelLevels.preorder.value
        && availabilityModelLevels.preorder.value > 0
    ) {
        availability = 'PREORDER';
    }

    Object.defineProperty(productAttributes, 'availability', {
        enumerable: true,
        value: availability
    });

    return productAttributes;
}

/**
 * Decorate product Attributes with product information
 * @param {Object} productAttributes - Product Attributes Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product attributes model
 */
function getProductPrice(productAttributes, apiProduct, options) {
    var promotions = options.promotions;
    var useSimplePrice = false;
    var currentOptions = options.optionModel;
    var productObj = require('*/cartridge/scripts/factories/price').getPrice(apiProduct, null, useSimplePrice, promotions, currentOptions);
    var price = null;

    if (productObj && productObj.sales && productObj.sales.decimalPrice && productObj.sales.currency) {
        price = productObj.sales.decimalPrice + ' ' + productObj.sales.currency;
    } else if (productObj && productObj.list && productObj.list.decimalPrice && productObj.list.currency) {
        price = productObj.list.decimalPrice + ' ' + productObj.list.currency;
    }

    if (price !== null) {
        Object.defineProperty(productAttributes, 'price', {
            enumerable: true,
            value: price
        });
    }

    return productAttributes;
}

module.exports = {
    getData: getData,
    getAPIPayload: getAPIPayload,
    methods: {
        getProductItemID: getProductItemID,
        getProductTitle: getProductTitle,
        getProductDescription: getProductDescription,
        getProductAvailability: getProductAvailability,
        getProductPrice: getProductPrice
    }
};
