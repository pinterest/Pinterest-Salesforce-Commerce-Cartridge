'use strict';

var Site = require('dw/system/Site');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Logger = require('dw/system/Logger');
var decorators = require('*/cartridge/models/product/decorators/index');
var URLUtils = require('dw/web/URLUtils');
var priceFactory = require('*/cartridge/scripts/factories/price');
var ImageModel = require('*/cartridge/models/product/productImages');
var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProduct(product, apiProduct, options) {
    module.exports.methods.getProductID(product, apiProduct, options);
    module.exports.methods.getProductTitle(product, apiProduct, options);
    module.exports.methods.getProductBrand(product, apiProduct, options);
    module.exports.methods.getProductPrice(product, apiProduct, options);
    module.exports.methods.getProductDescription(product, apiProduct, options);
    module.exports.methods.getProductDescriptionHTML(product, apiProduct, options);
    module.exports.methods.getProductImages(product, apiProduct, options);
    module.exports.methods.getProductAvailability(product, apiProduct, options);
    module.exports.methods.getProductLink(product, apiProduct, options);
    module.exports.methods.getProductMobileLink(product, apiProduct, options);
    module.exports.methods.getProductAverageReviewRating(product, apiProduct, options);
    module.exports.methods.getProductNumberOfRatings(product, apiProduct, options);
    module.exports.methods.getProductNumberOfReviews(product, apiProduct, options);
    module.exports.methods.getProductType(product, apiProduct, options);
    module.exports.methods.getProductGTIN(product, apiProduct, options);
    module.exports.methods.getProductItemGroupID(product, apiProduct, options);
    module.exports.methods.getProductMPN(product, apiProduct, options);
    module.exports.methods.getProductAgeGroup(product, apiProduct, options);
    module.exports.methods.getProductAltText(product, apiProduct, options);
    module.exports.methods.getProductColor(product, apiProduct, options);
    module.exports.methods.getProductGender(product, apiProduct, options);
    module.exports.methods.getProductMaterial(product, apiProduct, options);
    module.exports.methods.getProductPattern(product, apiProduct, options);
    module.exports.methods.getProductSize(product, apiProduct, options);
    module.exports.methods.getProductSizeSystem(product, apiProduct, options);
    module.exports.methods.getProductSizeType(product, apiProduct, options);
    module.exports.methods.getProductVariantNamesValues(product, apiProduct, options);
    module.exports.methods.getProductFreeShippingLabel(product, apiProduct, options);
    module.exports.methods.getProductFreeShippingLimit(product, apiProduct, options);
    module.exports.methods.getProductShipping(product, apiProduct, options);
    module.exports.methods.getProductShippingHeight(product, apiProduct, options);
    module.exports.methods.getProductShippingWeight(product, apiProduct, options);
    module.exports.methods.getProductShippingWidth(product, apiProduct, options);
    module.exports.methods.getProductTax(product, apiProduct, options);
    module.exports.methods.getProductAdult(product, apiProduct, options);
    module.exports.methods.getProductCheckoutEnabled(product, apiProduct, options);
    module.exports.methods.getProductCustomLabel0(product, apiProduct, options);
    module.exports.methods.getProductCustomLabel1(product, apiProduct, options);
    module.exports.methods.getProductCustomLabel2(product, apiProduct, options);
    module.exports.methods.getProductCustomLabel3(product, apiProduct, options);
    module.exports.methods.getProductCustomLabel4(product, apiProduct, options);
    module.exports.methods.getProductAdLink(product, apiProduct, options);
    module.exports.methods.getProductCondition(product, apiProduct, options);
    module.exports.methods.getProductGoogleProductCategory(product, apiProduct, options);

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductTitle(product, apiProduct, options) {
    Object.defineProperty(product, 'title', {
        enumerable: true,
        value: apiProduct.name
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductBrand(product, apiProduct, options) {
    Object.defineProperty(product, 'brand', {
        enumerable: true,
        value: apiProduct.brand
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductID(product, apiProduct, options) {
    Object.defineProperty(product, 'id', {
        enumerable: true,
        value: apiProduct.ID
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductPrice(product, apiProduct, options) {
    var promotions = options.promotions;
    var useSimplePrice = false;
    var currentOptions = options.optionModel;
    var productObj = priceFactory.getPrice(apiProduct, null, useSimplePrice, promotions, currentOptions);
    var price = null;
    var salePrice = null;

    if (productObj && productObj.list) {
        price = (productObj.list && productObj.list.decimalPrice && productObj.list.currency)? (productObj.list.decimalPrice + ' ' + productObj.list.currency) : null;

        if (price) {
            salePrice = (productObj.sales && productObj.sales.decimalPrice && productObj.sales.currency)? (productObj.sales.decimalPrice + ' ' + productObj.sales.currency) : null;
        }
    } else if (productObj) {
        price = (productObj.sales && productObj.sales.decimalPrice && productObj.sales.currency)? (productObj.sales.decimalPrice + ' ' + productObj.sales.currency) : null;
    }

    if (price !== null) {
        Object.defineProperty(product, 'price', {
            enumerable: true,
            value: price
        });
    }

    if (salePrice !== null) {
        Object.defineProperty(product, 'sale_price', {
            enumerable: true,
            value: salePrice
        });
    }

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductDescription(product, apiProduct, options) {
    Object.defineProperty(product, 'description', {
        enumerable: true,
        value: (apiProduct.shortDescription && apiProduct.shortDescription.source) ? pinterestHelpers.stripHTML(apiProduct.shortDescription.source) : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductDescriptionHTML(product, apiProduct, options) {
    Object.defineProperty(product, 'description_html', {
        enumerable: true,
        value: apiProduct.longDescription ? apiProduct.longDescription.markup : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductImages(product, apiProduct, options) {
    //The max product image size for the Pinterest catalog feed is an area of 89478485 pixels, or 9450 width x 9450 height.
    var ImageModel = require('*/cartridge/models/product/productImages');
    var pinterestCatalogFeedProductImageSize = Site.getCurrent().getCustomPreferenceValue('pinterestCatalogFeedProductImageSize');
    var imageConfig = { types: [pinterestCatalogFeedProductImageSize], quantity: 'all' };
    var productImages;
    var imageLink = null;
    var additionalImageLink = [];

    if (options.variationModel) {
        productImages = new ImageModel(options.variationModel, imageConfig)
    } else {
        productImages = new ImageModel(apiProduct, imageConfig)
    }

    //check for image results
    if (
        productImages
        && productImages[pinterestCatalogFeedProductImageSize]
        && productImages[pinterestCatalogFeedProductImageSize].length
    ) {
        for (var i = 0; i < productImages[pinterestCatalogFeedProductImageSize].length; i++) {
            if (i === 0 && productImages[pinterestCatalogFeedProductImageSize][i].absURL) {
                imageLink = productImages[pinterestCatalogFeedProductImageSize][i].absURL;
            } else if (productImages[pinterestCatalogFeedProductImageSize][i].absURL) {
                additionalImageLink.push(productImages[pinterestCatalogFeedProductImageSize][i].absURL);
            }
        }
    }

    if (imageLink !== null) {
        Object.defineProperty(product, 'image_link', {
            enumerable: true,
            value: imageLink
        });
    }

    if (additionalImageLink !== null) {
        Object.defineProperty(product, 'additional_image_link', {
            enumerable: true,
            value: additionalImageLink
        });
    }

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAvailability(product, apiProduct, options) {
    var quantity = options.quantity;
    var minOrderQuantity = apiProduct.minOrderQuantity.value || 1;
    var availabilityModel = apiProduct.availabilityModel;
    var productQuantity = quantity ? parseInt(quantity, 10) : minOrderQuantity;
    var availabilityModelLevels = availabilityModel.getAvailabilityLevels(productQuantity);
    var availability = 'out of stock';

    if (
        availabilityModelLevels
        && availabilityModelLevels.inStock
        && availabilityModelLevels.inStock.value
        && availabilityModelLevels.inStock.value > 0
    ) {
        availability = 'in stock';
    } else if (
        availabilityModelLevels
        && availabilityModelLevels.preorder
        && availabilityModelLevels.preorder.value
        && availabilityModelLevels.preorder.value > 0
    ) {
        availability = 'preorder';
    }

    Object.defineProperty(product, 'availability', {
        enumerable: true,
        value: availability
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductLink(product, apiProduct, options) {
    var link;

    if (product.id) {
        link = URLUtils.abs('Product-Show', 'pid', product.id);
    }

    Object.defineProperty(product, 'link', {
        enumerable: true,
        value: link ? link.toString() : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductMobileLink(product, apiProduct, options) {
    var mobileLink;

    if (product.id) {
        mobileLink = URLUtils.abs('Product-Show', 'pid', product.id);
    }

    Object.defineProperty(product, 'mobile_link', {
        enumerable: true,
        value: mobileLink ? mobileLink.toString() : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAverageReviewRating(product, apiProduct, options) {
    Object.defineProperty(product, 'average_review_rating', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductNumberOfRatings(product, apiProduct, options) {
    Object.defineProperty(product, 'number_of_ratings', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductNumberOfReviews(product, apiProduct, options) {
    Object.defineProperty(product, 'number_of_reviews', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductType(product, apiProduct, options) {
    Object.defineProperty(product, 'product_type', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductGTIN(product, apiProduct, options) {
    Object.defineProperty(product, 'GTIN', {
        enumerable: true,
        value: apiProduct.UPC ? apiProduct.UPC : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductItemGroupID(product, apiProduct, options) {
    var itemGroupID = null;

    if (apiProduct.variant && apiProduct.masterProduct && apiProduct.masterProduct.ID) {
        itemGroupID = apiProduct.masterProduct.ID;
    } else if (apiProduct.ID) {
        itemGroupID = 'sfcc_' + apiProduct.ID;
    }

    Object.defineProperty(product, 'item_group_id', {
        enumerable: true,
        value: itemGroupID
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductMPN(product, apiProduct, options) {
    Object.defineProperty(product, 'mpn', {
        enumerable: true,
        value: apiProduct.manufacturerSKU ? apiProduct.manufacturerSKU : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAgeGroup(product, apiProduct, options) {
    Object.defineProperty(product, 'age_group', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAltText(product, apiProduct, options) {
    Object.defineProperty(product, 'alt_text', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductColor(product, apiProduct, options) {
    var color = null;

    if (apiProduct.custom && apiProduct.custom.refinementColor && apiProduct.custom.refinementColor.displayValue) {
        color = apiProduct.custom.refinementColor.displayValue;
    } else if (apiProduct.custom && apiProduct.custom.color) {
        color = apiProduct.custom.color;
    }

    Object.defineProperty(product, 'color', {
        enumerable: true,
        value: color
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductGender(product, apiProduct, options) {
    Object.defineProperty(product, 'gender', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductMaterial(product, apiProduct, options) {
    Object.defineProperty(product, 'material', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductPattern(product, apiProduct, options) {
    Object.defineProperty(product, 'pattern', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductSize(product, apiProduct, options) {
    Object.defineProperty(product, 'size', {
        enumerable: true,
        value: (apiProduct.custom && apiProduct.custom.size)? apiProduct.custom.size : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductSizeSystem(product, apiProduct, options) {
    Object.defineProperty(product, 'size_system', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductSizeType(product, apiProduct, options) {
    Object.defineProperty(product, 'size_type', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductVariantNamesValues(product, apiProduct, options) {
    var enabledVariantIDs = ['size', 'color'];
    var variantNames = [];
    var variantValues = [];
    var variantNamesString = '';
    var variantValuesString = '';

    if (apiProduct.custom && apiProduct.variationModel && apiProduct.variationModel.productVariationAttributes) {
        for (var i = 0; i < apiProduct.variationModel.productVariationAttributes.length; i++) {
            if (
                apiProduct.variationModel.productVariationAttributes[i].displayName
                && apiProduct.variationModel.productVariationAttributes[i].ID
                && enabledVariantIDs.indexOf(apiProduct.variationModel.productVariationAttributes[i].ID) !== -1
                && apiProduct.custom[apiProduct.variationModel.productVariationAttributes[i].ID]

            ) {
                variantNames.push(apiProduct.variationModel.productVariationAttributes[i].displayName);

                if (
                    apiProduct.variationModel.productVariationAttributes[i].ID === 'color'
                    && apiProduct.custom.refinementColor
                    && apiProduct.custom.refinementColor.displayValue
                ) {
                    variantValues.push(apiProduct.custom.refinementColor.displayValue)
                } else {
                    variantValues.push(apiProduct.custom[apiProduct.variationModel.productVariationAttributes[i].ID])
                }

            }
        }
    }

    variantNamesString = variantNames.join(',');
    variantValuesString = variantValues.join(',');

    //standardize 'Colour' to 'Color'
    variantNamesString = variantNamesString.replace('colour', 'color').replace('Colour', 'Color');

    Object.defineProperty(product, 'variant_names', {
        enumerable: true,
        value: (variantNamesString !== '') ? variantNamesString : null
    });

    Object.defineProperty(product, 'variant_values', {
        enumerable: true,
        value: (variantValuesString !== '') ? variantValuesString : null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductFreeShippingLabel(product, apiProduct, options) {
    Object.defineProperty(product, 'free_shipping_label', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductFreeShippingLimit(product, apiProduct, options) {
    Object.defineProperty(product, 'free_shipping_limit', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductShipping(product, apiProduct, options) {
    Object.defineProperty(product, 'shipping', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductShippingHeight(product, apiProduct, options) {
    Object.defineProperty(product, 'shipping_height', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductShippingWeight(product, apiProduct, options) {
    Object.defineProperty(product, 'shipping_weight', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductShippingWidth(product, apiProduct, options) {
    Object.defineProperty(product, 'shipping_width', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductTax(product, apiProduct, options) {
    Object.defineProperty(product, 'tax', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAdult(product, apiProduct, options) {
    Object.defineProperty(product, 'adult', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCheckoutEnabled(product, apiProduct, options) {
    Object.defineProperty(product, 'checkout_enabled', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCustomLabel0(product, apiProduct, options) {
    Object.defineProperty(product, 'custom_label_0', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCustomLabel1(product, apiProduct, options) {
    Object.defineProperty(product, 'custom_label_1', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCustomLabel2(product, apiProduct, options) {
    Object.defineProperty(product, 'custom_label_2', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCustomLabel3(product, apiProduct, options) {
    Object.defineProperty(product, 'custom_label_3', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCustomLabel4(product, apiProduct, options) {
    Object.defineProperty(product, 'custom_label_4', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductAdLink(product, apiProduct, options) {
    Object.defineProperty(product, 'ad_link', {
        enumerable: true,
        value: null
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductCondition(product, apiProduct, options) {
    Object.defineProperty(product, 'condition', {
        enumerable: true,
        value: 'new'
    });

    return product;
}

/**
 * Decorate product with product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 *
 * @returns {Object} - Decorated product model
 */
function getProductGoogleProductCategory(product, apiProduct, options) {
    Object.defineProperty(product, 'google_product_category', {
        enumerable: true,
        value: null
    });

    return product;
}

module.exports = {
    getProduct: getProduct,
    methods: {
        getProductID: getProductID,
        getProductTitle: getProductTitle,
        getProductBrand: getProductBrand,
        getProductPrice: getProductPrice,
        getProductDescription: getProductDescription,
        getProductDescriptionHTML: getProductDescriptionHTML,
        getProductLink: getProductLink,
        getProductMobileLink: getProductMobileLink,
        getProductImages: getProductImages,
        getProductAvailability: getProductAvailability,
        getProductAverageReviewRating: getProductAverageReviewRating,
        getProductNumberOfRatings: getProductNumberOfRatings,
        getProductNumberOfReviews: getProductNumberOfReviews,
        getProductType: getProductType,
        getProductGTIN: getProductGTIN,
        getProductItemGroupID: getProductItemGroupID,
        getProductMPN: getProductMPN,
        getProductAgeGroup: getProductAgeGroup,
        getProductAltText: getProductAltText,
        getProductColor: getProductColor,
        getProductGender: getProductGender,
        getProductMaterial: getProductMaterial,
        getProductPattern: getProductPattern,
        getProductSize: getProductSize,
        getProductSizeSystem: getProductSizeSystem,
        getProductSizeType: getProductSizeType,
        getProductVariantNamesValues: getProductVariantNamesValues,
        getProductFreeShippingLabel: getProductFreeShippingLabel,
        getProductFreeShippingLimit: getProductFreeShippingLimit,
        getProductShipping: getProductShipping,
        getProductShippingHeight: getProductShippingHeight,
        getProductShippingWeight: getProductShippingWeight,
        getProductShippingWidth: getProductShippingWidth,
        getProductTax: getProductTax,
        getProductAdult: getProductAdult,
        getProductCheckoutEnabled: getProductCheckoutEnabled,
        getProductCustomLabel0: getProductCustomLabel0,
        getProductCustomLabel1: getProductCustomLabel1,
        getProductCustomLabel2: getProductCustomLabel2,
        getProductCustomLabel3: getProductCustomLabel3,
        getProductCustomLabel4: getProductCustomLabel4,
        getProductAdLink: getProductAdLink,
        getProductCondition: getProductCondition,
        getProductGoogleProductCategory: getProductGoogleProductCategory
    }
};
