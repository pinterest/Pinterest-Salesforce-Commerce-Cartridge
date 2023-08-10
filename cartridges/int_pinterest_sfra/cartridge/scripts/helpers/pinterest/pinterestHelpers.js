'use strict';

var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');
var Transaction = require('dw/system/Transaction');

/**
 * @param {Object} pdict - current request data
 * @returns {Object} Object containing customer data
 */
function getDataCustomerEmail(pdict) {
    var customerData = {
        email: '',
        emailHashed: ''
    };

    if (pdict.CurrentCustomer && pdict.CurrentCustomer.profile && pdict.CurrentCustomer.profile.email) {
        customerData.email = pdict.CurrentCustomer.profile.email.toLowerCase();
        customerData.emailHashed = module.exports.getHashedData(customerData.email);
    } else if (pdict.order && pdict.order.orderEmail) {
        customerData.email = pdict.order.orderEmail.toLowerCase();
        customerData.emailHashed = module.exports.getHashedData(customerData.email);
    }

    return customerData;
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getClientEventPageVisit(pdict) {
    var eventClientDataModel = require('*/cartridge/models/pinterest/eventClient');

    return eventClientDataModel.getEvent(pdict, 'pagevisit');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getClientEventSearch(pdict) {
    var eventClientDataModel = require('*/cartridge/models/pinterest/eventClient');

    return eventClientDataModel.getEvent(pdict, 'search');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getClientEventViewCategory(pdict) {
    var eventClientDataModel = require('*/cartridge/models/pinterest/eventClient');

    return eventClientDataModel.getEvent(pdict, 'viewcategory');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getClientEventCheckout(pdict) {
    var eventClientDataModel = require('*/cartridge/models/pinterest/eventClient');

    return eventClientDataModel.getEvent(pdict, 'checkout');
}

/**
 * @param {Object} pdict - current route response object
 * @returns {Object} Object containing event data
 */
function getClientEvent(pdict) {
    switch (pdict.action) {
        case 'Search-Show':
            if (pdict.productSearch && pdict.productSearch.isCategorySearch) {
                return module.exports.methods.getClientEventViewCategory(pdict);
            }
            return module.exports.methods.getClientEventSearch(pdict);
        case 'Order-Confirm':
            return module.exports.methods.getClientEventCheckout(pdict);
        case 'Product-Show':
        case 'Product-ShowCategory':
            return module.exports.methods.getClientEventPageVisit(pdict);
        default:
            return false;
    }
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getServerEventAddToCart(pdict) {
    var eventServerDataModel = require('*/cartridge/models/pinterest/eventServer');

    return eventServerDataModel.getEvent(pdict, 'add_to_cart');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getServerEventCheckout(pdict) {
    var eventServerDataModel = require('*/cartridge/models/pinterest/eventServer');

    return eventServerDataModel.getEvent(pdict, 'checkout');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getServerEventPageVisit(pdict) {
    var eventServerDataModel = require('*/cartridge/models/pinterest/eventServer');

    return eventServerDataModel.getEvent(pdict, 'page_visit');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getServerEventSearch(pdict) {
    var eventServerDataModel = require('*/cartridge/models/pinterest/eventServer');

    return eventServerDataModel.getEvent(pdict, 'search');
}

/**
 * @param {Object} pdict - current request data
 * @returns {Object} an object of containing tag data
 */
function getServerEventViewCategory(pdict) {
    var eventServerDataModel = require('*/cartridge/models/pinterest/eventServer');

    return eventServerDataModel.getEvent(pdict, 'view_category');
}

/**
 * @param {Object} pdict - current route response object
 * @returns {Object} Object containing event data
 */
function getServerEvent(pdict) {
    switch (pdict.action) {
        case 'Cart-AddProduct':
            return module.exports.methods.getServerEventAddToCart(pdict);
        case 'Search-Show':
            if (pdict.productSearch && pdict.productSearch.isCategorySearch) {
                return module.exports.methods.getServerEventViewCategory(pdict);
            }
            return module.exports.methods.getServerEventSearch(pdict);
        case 'Order-Confirm':
            return module.exports.methods.getServerEventCheckout(pdict);
        case 'Product-Show':
        case 'Product-ShowCategory':
            return module.exports.methods.getServerEventPageVisit(pdict);
        default:
            return false;
    }
}

/**
 * @returns {String} filename for catalog based on current site
 */
function getCatalogFileName(localeID, isTempFile) {
    var currentSite = require('dw/system/Site').getCurrent();

    if (!localeID || localeID === 'default') {
        localeID = currentSite.getDefaultLocale();
    }

    return ('pinterest-catalog-feed-' + currentSite.getID() + '-' + localeID + '-' + currentSite.getHttpsHostName() + (isTempFile? '.tmp' : '') + '.xml')
        .replace(' ', '-')
        .replace('_', '-')
        .toLowerCase();
}

function getHashedData(text) {
    return dw.crypto.Encoding.toHex(new dw.crypto.MessageDigest('SHA-256').digestBytes(new dw.util.Bytes(text)));
}

function getEventID(pdict) {
    if (request.requestID) {
        return request.requestID;
    }
}

/**
 * Remove HTML Tags
 * @param {String} text - mixed text with HTML tags
 *
 * @returns {Object} - text without HTML tags
 */
function stripHTML(text) {
    if (typeof text === 'string') {
        return text.replace( /(<([^>]+)>)/ig, '');
    } else {
        return text;
    }
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var variables = module.exports.methods.getProductConfigNormalizedSelectedAttributes(apiProduct, params);
    var variationModel = module.exports.methods.getProductConfigVariationModel(apiProduct, variables);
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct;
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = module.exports.methods.getProductConfigCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: module.exports.methods.getProductConfigProductType(apiProduct)
    };

    return options;
}

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function getProductConfigNormalizedSelectedAttributes(apiProduct, params) {
    if (!apiProduct.master) {
        return params.variables;
    }

    var variables = params.variables || {};
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            if (allValues.length === 1) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Normalize product and return Product variation model
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to
 *                                     target product variation group
 * @return {dw.catalog.ProductVarationModel} Normalized variation model
 */
function getProductConfigVariationModel(product, productVariables) {
    var variationModel = product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                // eslint-disable-next-line es5/no-es6-methods
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });

                // eslint-disable-next-line es5/no-es6-methods
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });
                if (dwAttr && dwAttrValue) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                }
            }
        });
    }
    return variationModel;
}

/**
 * @typedef SelectedOption
 * @type Object
 * @property {string} optionId - Product option ID
 * @property {string} productId - Product ID
 * @property {string} selectedValueId - Selected product option value ID
 */

/**
 * Provides a current option model by setting selected option values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {SelectedOption[]} selectedOptions - Options selected in UI
 * @return {dw.catalog.ProductOptionModel} - Option model updated with selected options
 */
function getProductConfigCurrentOptionModel(optionModel, selectedOptions) {
    var productOptions = optionModel.options;
    var selectedValue;
    var selectedValueId;

    if (selectedOptions && selectedOptions.length) {
        collections.forEach(productOptions, function (option) {
            selectedValueId = selectedOptions.filter(function (selectedOption) {
                return selectedOption.optionId === option.ID;
            })[0].selectedValueId;
            selectedValue = optionModel.getOptionValue(option, selectedValueId);
            optionModel.setSelectedOptionValue(option, selectedValue);
        });
    }

    return optionModel;
}

/**
 * Return type of the current product
 * @param  {dw.catalog.ProductVariationModel} product - Current product
 * @return {string} type of the current product
 */
function getProductConfigProductType(product) {
    var result;
    if (product.master) {
        result = 'master';
    } else if (product.variant) {
        result = 'variant';
    } else if (product.variationGroup) {
        result = 'variationGroup';
    } else if (product.productSet) {
        result = 'set';
    } else if (product.bundle) {
        result = 'bundle';
    } else if (product.optionProduct) {
        result = 'optionProduct';
    } else {
        result = 'standard';
    }
    return result;
}

/**
 * Get Pinterest Account Config
 * @returns {dw.object.CustomObject} - config
 */
function getBusinessAccountConfig() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var data = {};

    // custom pref pinterestAppID required to be defined
    if (pinterestAppID) {
        var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

        if (!pinterestConfiguration) {
            Transaction.wrap(function(){
                pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
            });
        }

        if (pinterestConfiguration.custom.data && pinterestConfiguration.custom.data !== '') {
            data = JSON.parse(pinterestConfiguration.custom.data);
        }

        if (
            data.tokenData
            && pinterestConfiguration.custom.accessToken
            && pinterestConfiguration.custom.refreshToken
        ) {
            data.tokenData.access_token = pinterestConfiguration.custom.accessToken;
            data.tokenData.refresh_token = pinterestConfiguration.custom.refreshToken;
        }

        return data;
    } else {
        return data;
    }
}

/**
 * Check for Existing Valid Pinterest Connection
 * @returns {dw.object} - businessAccountConfig
 */
function isConnected(businessAccountConfig) {
    var isConnected = false;

    if (!businessAccountConfig) {
        var businessAccountConfig = module.exports.getBusinessAccountConfig();
    }

    if (
        businessAccountConfig
        && businessAccountConfig.tokenData
        && businessAccountConfig.tokenData.access_token
        && businessAccountConfig.info
        && businessAccountConfig.info.advertiser_id
        && businessAccountConfig.info.merchant_id
        && businessAccountConfig.info.tag_id
    ) {
        isConnected = true;
    }

    return isConnected;
}

/**
 * Refresh Pinterest Access Token
 * @returns {Boolean} - success or fail result updating custom object with updated access token
 */
function refreshAccessToken(businessAccountConfig) {
    try {
        var pinterestOAuthService = require('*/cartridge/scripts/services/pinterestOAuth');
        var nowSeconds = (Math.floor(new Date().getTime()/1000));
        var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
        var bufferSeconds = Site.getCurrent().getCustomPreferenceValue('pinterestRefreshTokenExpirationBuffer') * 86400;

        if (!businessAccountConfig) {
            pinterestConfiguration = module.exports.getBusinessAccountConfig();
        }

        // check if we are in range of both token expirations
        if (
            !businessAccountConfig.tokenLastRefresh
            || (businessAccountConfig.tokenLastRefresh + bufferSeconds) < nowSeconds
        ) {
            var result = pinterestOAuthService.call({
                grant_type: 'refresh_token',
                refresh_token: businessAccountConfig.tokenData.refresh_token
            });

            if (result.ok) {
                var resultObject = JSON.parse(result.object);
                businessAccountConfig.tokenData.access_token = resultObject.access_token;
                businessAccountConfig.accessTokenExpiration = (resultObject.expires_in + nowSeconds);
                businessAccountConfig.tokenData.refresh_token = resultObject.refresh_token;
                businessAccountConfig.refreshAccessTokenExpiration = (resultObject.refresh_token_expires_in + nowSeconds);
                businessAccountConfig.tokenLastRefresh = (Math.floor(new Date().getTime()/1000));

                module.exports.setBusinessAccountConfig(pinterestAppID, businessAccountConfig);

                return businessAccountConfig;
            } else {
                pinterestLogger.error('Pinterest error: OAuth - ' + result.msg + ' - ' + result.errorMessage);

                return false;
            }
        } else {
            return businessAccountConfig;
        }
    } catch(e) {
        pinterestLogger.error('Pinterest error: OAuth failed, ' + ((e && e.message)? e.message : 'unknown error'));

        return false;
    }
}

/**
 * Get product ids of products that are newly out of stock for 'realtime' inventory call to Pinterest
 * @returns {dw.object.CustomObject} - config
 */
function getProductIDsWithInventoryStatusChange() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var data = {};

    // custom pref pinterestAppID required to be defined
    if (pinterestAppID) {
        var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

        if (pinterestConfiguration && pinterestConfiguration.custom.catalogOutOfStock && pinterestConfiguration.custom.catalogOutOfStock !== '') {
            data = JSON.parse(pinterestConfiguration.custom.catalogOutOfStock);
        }

        return data;
    } else {
        return data;
    }
}

/**
 * Get product ids of products that are newly out of stock for 'realtime' inventory call to Pinterest
 * @returns {dw.object.CustomObject} - config
 */
function resetProductIDsWithInventoryStatusChange() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var data = {};

    try {
        // custom pref pinterestAppID required to be defined
        if (pinterestAppID) {
            var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

            // save the JSON object as a string
            Transaction.wrap(function() {
                pinterestConfiguration.custom.catalogOutOfStock = JSON.stringify({});
            });

            return true;
        } else {
            return false;
        }
    } catch (e) {
        pinterestLogger.error('Pinterest reset catalog out of stock failed: ' + ((e && e.message)? e.message : 'unknown error'));

        return false;
    }
}

/**
 * Save Pinterest Account Config
 * @param {Object} pinterestConfigurationData - url param data
 * @returns {Boolean} - success or fail result saving custom object
 */
function setBusinessAccountConfig(pinterestAppID, pinterestConfigurationData) {
    var accessToken = null;
    var refreshToken = null;

    try {
        // get if it exists
        var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

        // if does not exist create it
        if (!pinterestConfiguration) {
            Transaction.wrap(function(){
                pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
            });
        }

        // we don't want to save the tokens as clear text in the object so splitting them out
        if (pinterestConfigurationData.tokenData) {
            accessToken = pinterestConfigurationData.tokenData.access_token;
            refreshToken = pinterestConfigurationData.tokenData.refresh_token;

            delete pinterestConfigurationData.tokenData.access_token;
            delete pinterestConfigurationData.tokenData.refresh_token;
        }

        // save the JSON object as a string
        Transaction.wrap(function() {
            pinterestConfiguration.custom.data = JSON.stringify(pinterestConfigurationData);
            pinterestConfiguration.custom.accessToken = accessToken;
            pinterestConfiguration.custom.refreshToken = refreshToken;
            pinterestConfiguration.custom.catalogOutOfStock = JSON.stringify({});
        });

        return true;
    } catch (e) {
        pinterestLogger.error('Pinterest account configuration save failed: ' + ((e && e.message)? e.message : 'unknown error'));

        return false;
    }
}

module.exports = {
    getCatalogFileName: getCatalogFileName,
    getDataCustomerEmail: getDataCustomerEmail,
    getClientEvent: getClientEvent,
    getServerEvent: getServerEvent,
    getHashedData: getHashedData,
    getEventID: getEventID,
    getConfig: getConfig,
    getBusinessAccountConfig: getBusinessAccountConfig,
    setBusinessAccountConfig: setBusinessAccountConfig,
    getProductIDsWithInventoryStatusChange: getProductIDsWithInventoryStatusChange,
    resetProductIDsWithInventoryStatusChange: resetProductIDsWithInventoryStatusChange,
    isConnected: isConnected,
    refreshAccessToken: refreshAccessToken,
    stripHTML: stripHTML,
    methods: {
        getClientEventCheckout: getClientEventCheckout,
        getClientEventPageVisit: getClientEventPageVisit,
        getClientEventSearch: getClientEventSearch,
        getClientEventViewCategory: getClientEventViewCategory,
        getServerEventAddToCart: getServerEventAddToCart,
        getServerEventCheckout: getServerEventCheckout,
        getServerEventPageVisit: getServerEventPageVisit,
        getServerEventSearch: getServerEventSearch,
        getServerEventViewCategory: getServerEventViewCategory,
        getProductConfigProductType: getProductConfigProductType,
        getProductConfigCurrentOptionModel: getProductConfigCurrentOptionModel,
        getProductConfigVariationModel: getProductConfigVariationModel,
        getProductConfigNormalizedSelectedAttributes: getProductConfigNormalizedSelectedAttributes
    }
};
