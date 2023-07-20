var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');

function getCatalogIDs() {
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var siteCurrent = Site.getCurrent();
    var siteAllowedLocales = siteCurrent.getAllowedLocales().toArray();
    var allCatalogIDs = [];
    var resultCatalogFeeds = pinterestCatalogFeedsService.call();

    if (resultCatalogFeeds.ok) {
        JSON.parse(resultCatalogFeeds.object).items.forEach(catalog => {
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
        pinterestLogger.error('Pinterest error: catalog feed, ' + resultCatalogFeeds.msg + ' - ' + resultCatalogFeeds.errorMessage);
    }

    return allCatalogIDs;
};

function getCatalogs() {
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var siteCurrent = Site.getCurrent();
    var siteAllowedLocales = siteCurrent.getAllowedLocales().toArray();
    var allCatalogLocales = {};
    var resultCatalogFeeds = pinterestCatalogFeedsService.call();

    if (resultCatalogFeeds.ok) {
        JSON.parse(resultCatalogFeeds.object).items.forEach(catalog => {
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
        pinterestLogger.error('Pinterest error: catalog feed, ' + resultCatalogFeeds.msg + ' - ' + resultCatalogFeeds.errorMessage);
    }

    return allCatalogLocales;
};

module.exports = {
    getCatalogIDs: getCatalogIDs,
    getCatalogs: getCatalogs
};
