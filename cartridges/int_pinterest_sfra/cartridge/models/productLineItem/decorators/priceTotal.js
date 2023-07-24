'use strict';

var base = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, lineItem) {
    base(object, lineItem);

    if (object.priceTotal) {
        var price = lineItem.adjustedPrice;

        // The platform does not include prices for selected option values in a line item product's
        // price by default.  So, we must add the option price to get the correct line item total price.
        collections.forEach(lineItem.optionProductLineItems, function (item) {
            price = price.add(item.adjustedPrice);
        });

        if (price && price.decimalValue) {
            Object.defineProperty(object.priceTotal, 'decimalPrice', {
                enumerable: true,
                value: price.decimalValue.valueOf().toFixed(2)
            });
        }
    }
};
