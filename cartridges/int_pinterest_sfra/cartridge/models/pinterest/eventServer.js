'use strict';

// https://developers.pinterest.com/docs/api/v5/#operation/events/create

var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event user data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getEvent(pdict, eventName) {
    var profile;

    if (pdict.CurrentCustomer && pdict.CurrentCustomer.profile) {
        profile = pdict.CurrentCustomer.profile;
    } else if (session.customer && session.customer.profile) {
        profile = session.customer.profile;
    } else if (pdict.order) {
        if (
            pdict.order.shipping
            && pdict.order.shipping[0]
            && pdict.order.shipping[0].shippingAddress
        ) {
            profile = pdict.order.shipping[0].shippingAddress;
            profile.phoneHome = profile.phone;
        } else {
            profile = {};
        }

        if (pdict.order.orderEmail) {
            profile.email = pdict.order.orderEmail;
        }
    }

    var eventData = {
        'event_name': eventName,
        'custom_data': {},
        'user_data': {}
    };

    module.exports.methods.getEventID(eventData, pdict);
    module.exports.methods.getOptOut(eventData, pdict);
    module.exports.methods.getLanguage(eventData, pdict);
    module.exports.methods.getActionSource(eventData, pdict);
    module.exports.methods.getEventTime(eventData, pdict);
    module.exports.methods.getEventSourceURL(eventData, pdict);
    module.exports.methods.getPartnerName(eventData, pdict);
    module.exports.methods.getNP(eventData['custom_data'], pdict);
    module.exports.methods.getSearchString(eventData['custom_data'], pdict);
    module.exports.methods.getValue(eventData['custom_data'], pdict);
    module.exports.methods.getOrderID(eventData['custom_data'], pdict);

    var products;
    if (pdict.items && pdict.items.length) {
        products = pdict.items.toArray();
    } else if (pdict.cart && pdict.cart.items) {
        products = pdict.cart.items;
    } else if (pdict.order && pdict.order.items && pdict.order.items.items) {
        products = pdict.order.items.items;
    } else if (pdict.product) {
        products = [pdict.product];
    }

    if (products && products.length) {
        module.exports.methods.getContentIDs(eventData['custom_data'], products);
        module.exports.methods.getContents(eventData['custom_data'], products);
        module.exports.methods.getNumItems(eventData['custom_data'], products);
        module.exports.methods.getCurrency(eventData['custom_data'], products[0]);
    }

    module.exports.methods.getUserAgent(eventData['user_data'], pdict);
    module.exports.methods.getClientIPAddress(eventData['user_data'], pdict);
    module.exports.methods.getPinterestCookies(eventData['user_data'], pdict);

    if (profile) {
        var profileAddressBook;
        var preferredAddress;

        if (profile.addressBook) {
            profileAddressBook = profile.getAddressBook();
        }

        if (profileAddressBook) {
            preferredAddress = profileAddressBook.getPreferredAddress();
        } else if (pdict.order) {
            preferredAddress = profile;
        }

        module.exports.methods.getExternalID(eventData['user_data'], profile);
        module.exports.methods.getEmail(eventData['user_data'], profile);
        module.exports.methods.getFirstName(eventData['user_data'], profile);
        module.exports.methods.getLastName(eventData['user_data'], profile);
        module.exports.methods.getGender(eventData['user_data'], profile);
        module.exports.methods.getBirthday(eventData['user_data'], profile);
        module.exports.methods.getPhone(eventData['user_data'], profile);
        module.exports.methods.getCity(eventData['user_data'], preferredAddress);
        module.exports.methods.getState(eventData['user_data'], preferredAddress);
        module.exports.methods.getZip(eventData['user_data'], preferredAddress);
        module.exports.methods.getCountry(eventData['user_data'], preferredAddress);
    }

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getEventID(eventData, pdict) {
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
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getActionSource(eventData, pdict) {
    Object.defineProperty(eventData, 'action_source', {
        enumerable: true,
        value: 'web'
    });

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} userData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getEventTime(eventData, pdict) {
    Object.defineProperty(eventData, 'event_time', {
        enumerable: true,
        value: Math.round(new Date() / 1000)
    });

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getEventSourceURL(eventData, pdict) {
    if (pdict.CurrentRequest) {
        Object.defineProperty(eventData, 'event_source_url', {
            enumerable: true,
            value: pdict.CurrentRequest.getHttpURL().toString()
        });
    }

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getPartnerName(eventData, pdict) {
    Object.defineProperty(eventData, 'partner_name', {
        enumerable: true,
        value: 'ss-salesforce'
    });

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getOptOut(eventData, pdict) {
    Object.defineProperty(eventData, 'opt_out', {
        enumerable: true,
        value: false
    });

    return eventData;
}

/**
 * Decorate event data with pdict information
 * @param {Object} eventData - event data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event data model
 */
function getLanguage(eventData, pdict) {
    if (pdict.locale) {
        var localeModel = require('dw/util/Locale').getLocale(pdict.locale);
        Object.defineProperty(eventData, 'language', {
            enumerable: true,
            value: localeModel.language
        });
    }

    return eventData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event user data model
 */
function getUserAgent(userData, pdict) {
    if (request && request.httpUserAgent) {
        Object.defineProperty(userData, 'client_user_agent', {
            enumerable: true,
            value: request.httpUserAgent
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event user data model
 */
function getClientIPAddress(userData, pdict) {
    if (request && request.httpRemoteAddress) {
        Object.defineProperty(userData, 'client_ip_address', {
            enumerable: true,
            value: request.httpRemoteAddress
        });
    }

    return userData;
}

/**
 * Decorate event user data with external id and click id information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - pdict
 *
 * @returns {Object} - Decorated event user data model
 */
function getPinterestCookies(userData, pdict) {
    if (pdict && pdict.CurrentRequest && pdict.CurrentRequest.httpCookies) {
        var cookieCount = pdict.CurrentRequest.httpCookies.getCookieCount();
        for (var i = 0; i < cookieCount; i++) {
            var cookie = pdict.CurrentRequest.httpCookies[i];
            if (cookie.getName() === '_pin_unauth' && cookie.getValue() !== null) {
                Object.defineProperty(userData, 'external_id', {
                    enumerable: true,
                    value: [pinterestHelpers.getHashedData(cookie.getValue())]
                });
            }
            if (cookie.getName() === '_epik' && cookie.getValue() !== null) {
                Object.defineProperty(userData, 'click_id', {
                    enumerable: true,
                    value: cookie.getValue()
                });
            }
        }
    }
    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getEmail(userData, profile) {
    if (profile.email) {
        Object.defineProperty(userData, 'em', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.email.toLowerCase())]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getFirstName(userData, profile) {
    if (profile.firstName) {
        Object.defineProperty(userData, 'fn', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.firstName.toLowerCase())]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getLastName(userData, profile) {
    if (profile.lastName) {
        Object.defineProperty(userData, 'ln', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.lastName.toLowerCase())]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getGender(userData, profile) {
    if (profile.gender && profile.gender.value === 1) {
        Object.defineProperty(userData, 'ge', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData('m')]
        });
    } else if (profile.gender && profile.gender.value === 2) {
        Object.defineProperty(userData, 'ge', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData('g')]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getBirthday(userData, profile) {
    if (profile.birthday) {
        Object.defineProperty(userData, 'db', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData((
                profile.birthday.getFullYear()
                + ', '+ (profile.birthday.getMonth() + 1)
                + ', ' + profile.birthday.getDate()
            ))]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getPhone(userData, profile) {
    if (profile.phoneHome) {
        Object.defineProperty(userData, 'ph', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.phoneHome)]
        });
    } else if (!profile.phoneHome && profile.phoneMobile) {
        Object.defineProperty(userData, 'ph', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.phoneMobile)]
        });
    } else if (!profile.phoneHome && !profile.phoneMobile && profile.phoneBusiness) {
        Object.defineProperty(userData, 'ph', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(profile.phoneBusiness)]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.Profile} profile - customer profile
 *
 * @returns {Object} - Decorated event user data model
 */
function getExternalID(userData, profile) {
    if (profile.customerNo) {
        var externalId = userData["external_id"] || [];
        externalId.push(pinterestHelpers.getHashedData(profile.customerNo));
        Object.defineProperty(userData, 'external_id', {
            enumerable: true,
            value: externalId,
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile address information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.AddressBook} preferredAddress - customer preferred address
 *
 * @returns {Object} - Decorated event user data model
 */
function getCity(userData, preferredAddress) {
    if (preferredAddress && preferredAddress.city) {
        Object.defineProperty(userData, 'ct', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(preferredAddress.city.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " ").toLowerCase())]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile address information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.AddressBook} preferredAddress - customer preferred address
 *
 * @returns {Object} - Decorated event user data model
 */
function getState(userData, preferredAddress) {
    if (preferredAddress && preferredAddress.stateCode) {
        Object.defineProperty(userData, 'st', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(preferredAddress.stateCode.toLowerCase())]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile address information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.AddressBook} preferredAddress - customer preferred address
 *
 * @returns {Object} - Decorated event user data model
 */
function getZip(userData, preferredAddress) {
    if (preferredAddress && preferredAddress.postalCode) {
        Object.defineProperty(userData, 'zp', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(preferredAddress.postalCode.replace(/[^\w\s\']|_/g, "").replace(/\s+/g, " "))]
        });
    }

    return userData;
}

/**
 * Decorate event user data with profile address information
 * @param {Object} userData - event user data object to be decorated
 * @param {dw.customer.AddressBook} preferredAddress - customer preferred address
 *
 * @returns {Object} - Decorated event user data model
 */
function getCountry(userData, preferredAddress) {
    if (preferredAddress && preferredAddress.countryCode && preferredAddress.countryCode.value) {
        Object.defineProperty(userData, 'country', {
            enumerable: true,
            value: [pinterestHelpers.getHashedData(preferredAddress.countryCode.value)]
        });
    }

    return userData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event custom data model
 */
function getNP(customData, pdict) {
    Object.defineProperty(customData, 'np', {
        enumerable: true,
        value: 'ss-salesforce'
    });

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event custom data model
 */
function getSearchString(customData, pdict) {
    if (pdict.productSearch && pdict.productSearch.searchKeywords) {
        Object.defineProperty(customData, 'search_string', {
            enumerable: true,
            value: pdict.productSearch.searchKeywords
        });
    }

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event custom data model
 */
function getValue(customData, pdict) {
    var grandTotal;

    if (pdict.totals && pdict.totals.grandTotal) {
        grandTotal = pdict.totals.grandTotal;
    } else if (pdict.order && pdict.order.totals && pdict.order.totals.grandTotal) {
        grandTotal = pdict.order.totals.grandTotal;
    }

    if (grandTotal) {
        Object.defineProperty(customData, 'value', {
            enumerable: true,
            value: Number(grandTotal.replace(/[^0-9.-]+/g,"")).toString()
        });
    }

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {Object} products - array of products
 *
 * @returns {Object} - Decorated event custom data model
 */
function getContentIDs(customData, products) {
    var contentIDs = [];

    for (var i = 0; i < products.length; i++) {
        if (products[i].id) {
            contentIDs.push(products[i].id);
        }
    }

    if (contentIDs.length) {
        Object.defineProperty(customData, 'content_ids', {
            enumerable: true,
            value: contentIDs
        });
    }

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {Object} product - array of products
 *
 * @returns {Object} - Decorated event custom data model
 */
function getCurrency(customData, product) {
    if (product.price && product.price.sales && product.price.sales.currency) {
        Object.defineProperty(customData, 'currency', {
            enumerable: true,
            value: product.price.sales.currency
        });
    }

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {Object} products - array of products
 *
 * @returns {Object} - Decorated event custom data model
 */
function getContents(customData, products) {
    var dataContents = [];

    for (var i = 0; i < products.length; i++) {

        var productData = {};

        if (products[i] && products[i].quantity) {
            productData.quantity = products[i].quantity;
        }

        //normalize price
        if (products[i] && products[i].price && products[i].price.sales && products[i].price.sales.decimalPrice) {
            productData['item_price'] = products[i].price.sales.decimalPrice;
        } else if (products[i] && products[i].priceTotal && products[i].priceTotal.decimalPrice) {
            productData['item_price'] = products[i].priceTotal.decimalPrice;
        }

        if (productData['item_price'] || productData.quantity) {
            dataContents.push(productData);
        }
    }

    if (dataContents.length) {
        Object.defineProperty(customData, 'contents', {
            enumerable: true,
            value: dataContents
        });
    }

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {Object} products - array of products
 *
 * @returns {Object} - Decorated event custom data model
 */
function getNumItems(customData, products) {
    if (products.length) {
        var productQuantityCount = 0;

        for (var i = 0; i < products.length; i++) {
            if (products[i] && products[i].quantity) {
                productQuantityCount = productQuantityCount + products[i].quantity;
            } else {
                productQuantityCount = productQuantityCount + 1;
            }
        }
    }

    Object.defineProperty(customData, 'num_items', {
        enumerable: true,
        value: productQuantityCount
    });

    return customData;
}

/**
 * Decorate event custom data with profile address information
 * @param {Object} customData - event custom data object to be decorated
 * @param {dw.system.PipelineDictionary} pdict - page view pdict
 *
 * @returns {Object} - Decorated event custom data model
 */
function getOrderID(customData, pdict) {
    if (pdict.order && pdict.order.orderNumber) {
        Object.defineProperty(customData, 'order_id', {
            enumerable: true,
            value: pdict.order.orderNumber
        });
    }

    return customData;
}

module.exports = {
    getEvent: getEvent,
    methods: {
        getActionSource: getActionSource,
        getEventID: getEventID,
        getEventTime: getEventTime,
        getEventSourceURL: getEventSourceURL,
        getPartnerName: getPartnerName,
        getExternalID: getExternalID,
        getFirstName: getFirstName,
        getLastName: getLastName,
        getGender: getGender,
        getBirthday: getBirthday,
        getPhone: getPhone,
        getCity: getCity,
        getState: getState,
        getZip: getZip,
        getCountry: getCountry,
        getEmail: getEmail,
        getNP: getNP,
        getSearchString: getSearchString,
        getContentIDs: getContentIDs,
        getContents: getContents,
        getCurrency: getCurrency,
        getNumItems: getNumItems,
        getValue: getValue,
        getOrderID: getOrderID,
        getUserAgent: getUserAgent,
        getClientIPAddress: getClientIPAddress,
        getPinterestCookies: getPinterestCookies,
        getOptOut: getOptOut,
        getLanguage: getLanguage
    }
};
