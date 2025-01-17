/* Pinterest Product Catalog Feed Export Job */
'use strict';

var Status = require('dw/system/Status');
var Locale = require('dw/util/Locale');
var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');
var configCountries = require('*/cartridge/config/countries.json');
var PinterestLogger = require('*/cartridge/scripts/helpers/pinterest/pinterestLogger');
var pinterestLoggingHelper = new PinterestLogger();
var AllCatalogData;
var AllCatalogDataIterator;
var chunks = 0;
var processedAll = true;
var DEFAULT_PINTEREST_LOCALE = 'en_US';

/**
 * Executed Before Processing of Chunk and Validates all required fields can claims the catalog via API call
 */
exports.beforeStep = function () {
    var pinterestInventoryModel = require('*/cartridge/models/pinterest/inventory');
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
    var siteCurrent = Site.getCurrent();
    var siteLocales = siteCurrent.getAllowedLocales().toArray();
    var localeData = new Array();
    var pinterestLocale;
    var currentLocale;
    var currency;

    try {
        //handle each locale
        for (var i = 0; i < siteLocales.length; i++) {
            if (siteLocales.length == 1 || (siteLocales[i] && siteLocales[i] !== 'default')) {
                pinterestLocale = siteLocales[i];

                try {
                    var configCountry = configCountries.filter(function(locale){return locale.id === siteLocales[i]});
                    currency = dw.util.Currency.getCurrency(configCountry && configCountry.length? configCountry.pop().currencyCode : siteCurrent.defaultCurrency);
                } catch (e) {
                    currency = dw.util.Currency.getCurrency(siteCurrent.defaultCurrency);
                }

                //set the locale so data in loop is locale specific
                request.setLocale(siteLocales[i]);

                //set the right currency for the locale
                session.setCurrency(currency);

                if (pinterestLocale === 'default') {
                    pinterestLocale = DEFAULT_PINTEREST_LOCALE;
                }

                //the locale reported to pinterest, never 'default'
                currentLocale = Locale.getLocale(pinterestLocale);

                if (pinterestHelpers.isConnected()) {
                    var requestData = {
                        operation: 'UPDATE',
                        country: currentLocale.country.toUpperCase(),
                        language: currentLocale.language.toUpperCase(),
                        items: pinterestInventoryModel.getAPIPayload(siteLocales[i])
                    };

                    if (requestData.items && requestData.items.length) {
                        localeData.push(requestData);
                    }
                } else {
                    throw new Error('Pinterest Error: Job can not run, Pinterest App connection is disabled for site: ' + siteCurrent.ID);
                }
            }
        }

        AllCatalogData = new ArrayList(localeData);
        AllCatalogDataIterator = AllCatalogData.iterator();
    } catch (e) {
        pinterestLoggingHelper.logError(e || 'Pinterest Error: Job cannot run, unknown error');
        pinterestLoggingHelper.flushLogCache();
        throw e;
    }
};

/**
 * Executed Before Processing of Chunk and Return total catalogs processed
 * @returns {number} products count
 */
exports.getTotalCount = function () {
    return AllCatalogData.length;
};

/**
 * Returns a single catalog to processed
 * @returns {dw.catalog.Product} product - Product
 */
exports.read = function () {
    if (AllCatalogDataIterator.hasNext()) {
        return AllCatalogDataIterator.next();
    }
};

/**
 * Process locale array, checks that it is valid
 * @param {Array} localeData - Product, locale and file
 * @returns {Object} localeData
 */
exports.process = function (localeData) {
    if (localeData.items && localeData.items.length) {
        return localeData;
    }
};

/**
 * Writes a single catalog XML file per locale line
 * @param {dw.util.List} lines to write
 */
exports.write = function (lines) {
    if (lines.length) {
        var pinterestCatalogService = require('*/cartridge/scripts/services/pinterestCatalog');
        var data = lines[0];
        var result = pinterestCatalogService.call(data);

        if (!result.ok) {
            pinterestLoggingHelper.logErrorFromAPIResponse('pinterestCatalogService', result);
            processedAll = false;
        }
    }
};

/**
 * Executes after processing of every chunk
 */
exports.afterChunk = function () {
    chunks++;
    pinterestLoggingHelper.logInfo('Chunk ' + chunks + ' processed successfully');
};

/**
 * Executes after processing all the chunk and returns the status
 * @returns {Object} OK || ERROR
 */
exports.afterStep = function () {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');

    if (processedAll && pinterestHelpers.resetProductIDsWithInventoryStatusChange()) {
        pinterestLoggingHelper.logInfo('Export of products was successful');
        pinterestLoggingHelper.flushLogCache();
        return new Status(Status.OK, 'OK', 'Export of products was successful');
    }
    pinterestLoggingHelper.logError('Pinterest Error: Could not process all the catalog items');
    pinterestLoggingHelper.flushLogCache();
    throw new Error('Pinterest Error: Could not process all the catalog items');
};
