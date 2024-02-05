'use strict';

/**
 * Creates an object of the visible attributes for a product
 * @return {Object|null} an object containing the visible attributes for a product.
 */
function getAttributes(object, apiProduct) {
    var property = require('dw/system/Site').getCurrent().getName();
    var category;
    var categorizedProduct = apiProduct;

    // if variant, get its master which as the categories defined on it
    if (apiProduct.isVariant()) {
        categorizedProduct = apiProduct.getVariationModel().getMaster();
    }

    // first try to get the default category
    var primaryCategory = categorizedProduct.getPrimaryCategory();
    if (primaryCategory) {
        category = primaryCategory.getID();
    }

    // if no default category then try to get a list of all categories assigned to and grab the first one
    if (!category && !primaryCategory) {
        var allCategoryAssignments = categorizedProduct.getAllCategories();
        if (allCategoryAssignments && allCategoryAssignments.getLength()) {
            category = allCategoryAssignments.iterator().next().getID();
        }
    }

    return {
        category: category? category : null,
        property: property? property : null
    }
}

module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'pinterest', {
        enumerable: true,
        value: getAttributes(object, apiProduct)
    });
};
