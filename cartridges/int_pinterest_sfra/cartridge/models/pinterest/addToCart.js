'use strict';

var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');

/**
 * Decorate product with product information
 * @param {Object} object - add to cart controller view data
 * @param {String} pid - product id added to cart
 * @param {String} quantity - product quantity added to cart
 *
 * @returns {Object} - Decorated view data model
 */
module.exports = function(object, pid, quantity, gdprConsent) {
    Object.defineProperty(object, 'pinterest', {
        enumerable: true,
        value: {
            pid: pid,
            quantity: quantity,
            gdprConsent: gdprConsent,
            requestID: pinterestHelpers.getEventID(object)
        }
    });

    return object;
};
