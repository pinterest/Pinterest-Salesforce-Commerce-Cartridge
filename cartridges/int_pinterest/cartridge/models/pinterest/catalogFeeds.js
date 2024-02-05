var Site = require('dw/system/Site');
var PinterestLogger = require('*/cartridge/scripts/helpers/pinterest/pinterestLogger');
var pinterestLogger = new PinterestLogger();

function getCatalogIDs() {
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var siteCurrent = Site.getCurrent();
    var allCatalogIDs = [];
    var resultCatalogFeeds = pinterestCatalogFeedsService.call();

    if (resultCatalogFeeds.ok) {
        JSON.parse(resultCatalogFeeds.object).items.forEach(function(catalog){
            //only grab active catalogs matching this site
            if (
                catalog.status === 'ACTIVE'
                && catalog.location.indexOf(siteCurrent.httpsHostName) !== -1
                && catalog.name.indexOf('SFCC_PBCP_' + siteCurrent.ID + ' ') === 0
            ) {
                allCatalogIDs.push(catalog.id);
            }
        });
    } else {
        pinterestLogger.logErrorFromAPIResponse('catalog feed', resultCatalogFeeds);
    }

    return allCatalogIDs;
}

function getCatalogs() {
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var siteCurrent = Site.getCurrent();
    var allCatalogLocales = {};
    var resultCatalogFeeds = pinterestCatalogFeedsService.call();

    if (resultCatalogFeeds.ok) {
        JSON.parse(resultCatalogFeeds.object).items.forEach(function(catalog){
            //only grab active catalogs matching this site
            if (
                catalog.status === 'ACTIVE'
                && catalog.location.indexOf(siteCurrent.httpsHostName) !== -1
                && catalog.name.indexOf('SFCC_PBCP_' + siteCurrent.ID + ' ') === 0
            ) {
                allCatalogLocales[catalog.default_locale] = catalog;
            }
        });
    } else {
        pinterestLogger.logErrorFromAPIResponse('catalog feed', resultCatalogFeeds);
    }

    return allCatalogLocales;
}

module.exports = {
    getCatalogIDs: getCatalogIDs,
    getCatalogs: getCatalogs
};
