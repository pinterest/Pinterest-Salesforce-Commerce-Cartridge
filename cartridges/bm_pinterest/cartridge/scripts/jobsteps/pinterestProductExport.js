/* Pinterest Product Catalog Feed Export Job */
'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var URLUtils = require('dw/web/URLUtils');
var ArrayList = require('dw/util/ArrayList');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Site = require('dw/system/Site');
var configCountries = require('*/cartridge/config/countries.json');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');
var AllCatalogXMLData;
var AllCatalogXMLDataIterator;
var chunks = 0;
var processedAll = true;
var PINTEREST_IMPEX_DIRECTORY = 'src/pinterest';
var DEFAULT_PINTEREST_LOCALE = 'en_US';

/**
 * Executed Before Processing of Chunk and Validates all required fields can claims the catalog via API call
 */
exports.beforeStep = function () {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var siteCurrent = Site.getCurrent();
    var siteLocales = siteCurrent.getAllowedLocales().toArray();
    var targetFolder = [File.IMPEX, PINTEREST_IMPEX_DIRECTORY].join(File.SEPARATOR);
    var folderFile = new File(targetFolder);
    var localeData = new Array();
    var localeCurrencyCode;

    //claim the catalog
    if (!pinterestHelpers.isConnected()) {
        pinterestLogger.error('Pinterest Error: Job can not run, Pinterest App connection is disabled for site: ' + siteCurrent.ID);

        throw new Error('Pinterest Error: Job can not run, Pinterest App connection is disabled for site: ' + siteCurrent.ID);
    }

    //create the directory if needed
    if (
        !folderFile.exists()
        && !folderFile.mkdirs()
    ) {
        pinterestLogger.error('Pinterest Error: Cannot create folders {0}', targetFolder);
        throw new Error('Pinterest Error: Cannot create folders.');
    }

    //handle each locale
    for (var i = 0; i < siteLocales.length; i++) {
        if (siteLocales.length === 1 || (siteLocales[i] && siteLocales[i] !== 'default')) {

            try {
                var configCountry = configCountries.filter(function(locale){return locale.id === siteLocales[i]});
                localeCurrencyCode = configCountry && configCountry.length? configCountry.pop().currencyCode : siteCurrent.defaultCurrency;
            } catch (e) {
                localeCurrencyCode = siteCurrent.defaultCurrency;
            }

            //set the locale so data in loop is locale specific
            request.setLocale(siteLocales[i]);

            localeData.push({
                locale: siteLocales[i],
                products: ProductMgr.queryAllSiteProducts(),
                folderFile: folderFile,
                currencyCode: localeCurrencyCode
            });
        }
    }

    AllCatalogXMLData = new ArrayList(localeData);
    AllCatalogXMLDataIterator = AllCatalogXMLData.iterator();
};

/**
 * Executed Before Processing of Chunk and Return total catalogs processed
 * @returns {number} products count
 */
exports.getTotalCount = function () {
    return AllCatalogXMLData.length;
};

/**
 * Returns a single catalog to processed
 * @returns {dw.catalog.Product} product - Product
 */
exports.read = function () {
    if (AllCatalogXMLDataIterator.hasNext()) {
        return AllCatalogXMLDataIterator.next();
    }
};

/**
 * Process locale array, checks that it is valid
 * @param {Array} localeData - Product, locale and file
 * @returns {Object} localeData
 */
exports.process = function (localeData) {
    if (
        localeData
        && localeData.locale
        && localeData.products
        && localeData.folderFile
    ) {
        return localeData;
    }
};

/**
 * Writes a single catalog XML file per locale line
 * @param {dw.util.List} lines to write
 */
exports.write = function (lines) {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var catalogModel = require('*/cartridge/models/pinterest/catalog');

    try {
        for (var i = 0; i < lines.size(); i++) {
            var productIterator = lines[i].products;
            var file = new File(lines[i].folderFile.fullPath + File.SEPARATOR + pinterestHelpers.getCatalogFileName(lines[i].locale, true));
            var fileWriter = new FileWriter(file, 'UTF-8');
            var xmlWriter = new XMLStreamWriter(fileWriter);

            var currency = dw.util.Currency.getCurrency(lines[i].currencyCode);
            session.setCurrency(currency);

            //start catalog xml file
            xmlWriter.writeStartDocument();
            xmlWriter.writeStartElement('rss');
            xmlWriter.writeAttribute('version', '2.0');
            xmlWriter.writeStartElement('channel');

            //set the locale again so the product data output matches locale
            request.setLocale(lines[i].locale);

            //loop the products
            while (productIterator.hasNext()) {
                var apiProduct = productIterator.next();

                //check to see if product should be in xml
                if (
                    apiProduct
                    && apiProduct.isOnline()
                    && !apiProduct.isMaster()
                ) {
                    var product = {};
                    var options = pinterestHelpers.getConfig(apiProduct, {});

                    //build the product data needed for the catalog
                    catalogModel.getProduct(product, apiProduct, options);

                    //check it make sure product has all the required data
                    if (
                        product.id
                        && product.title
                        && product.description
                        && product.link
                        && product.image_link
                        && product.price
                        && product.availability
                    ) {
                        //start writing the product xml nodes
                        xmlWriter.writeStartElement('item');

                        for (var property in product) {
                            if (typeof product[property] === 'object') {
                                if (
                                    product[property] !== null
                                    && product[property].length
                                ) {
                                    for (var ii = 0; ii < product[property].length; ii++) {
                                        if (product[property][ii] !== null) {
                                            xmlWriter.writeStartElement(property);
                                            xmlWriter.writeCharacters(product[property][ii]);
                                            xmlWriter.writeEndElement();
                                        }
                                    }
                                }
                            } else if (product[property] !== null) {
                                xmlWriter.writeStartElement(property);
                                xmlWriter.writeCharacters(product[property]);
                                xmlWriter.writeEndElement();
                            }
                        }

                        //end product xml nodes
                        xmlWriter.writeEndElement();
                    } else {
                        pinterestLogger.warn('Pinterest Warning: Product ' + product.id + ' skipped during Pinterest catalog xml export. Missing required data. (id, title, description, link, image_link, price, availability)');
                    }
                }
            }

            //end catalog xml document
            xmlWriter.writeEndElement();
            xmlWriter.writeEndElement();
            xmlWriter.writeEndDocument();
            productIterator.close();
            fileWriter.flush();
            xmlWriter.close();
            fileWriter.close();

            //overwrite old .xml file with newly created .tmp.xml since there were no errors
            file.renameTo(new File(lines[i].folderFile.fullPath + File.SEPARATOR + pinterestHelpers.getCatalogFileName(lines[i].locale, false)));
        }
    } catch (e) {
        processedAll = false;
        pinterestLogger.warn('Pinterest Warning: catalog processing error, ' + ((e && e.message)? e.message : 'unknown error'));
    }
};

/**
 * Executes after processing of every chunk
 */
exports.afterChunk = function () {
    chunks++;
    pinterestLogger.info('Chunk {0} processed successfully', chunks);
};

/**
 * Executes after processing all the chunk and returns the status
 * @returns {Object} OK || ERROR
 */
exports.afterStep = function () {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var pinterestCatalogFeedsModel = require('*/cartridge/models/pinterest/catalogFeeds');
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var siteCurrent = Site.getCurrent();
    var siteLocales = siteCurrent.getAllowedLocales().toArray();
    var apiLocales = pinterestCatalogFeedsModel.getCatalogs();

    if (processedAll && siteLocales.length) {
        //add catalogs to API, handle each locale
        for (var i = 0; i < siteLocales.length; i++) {
            if (siteLocales.length === 1 || (siteLocales[i] && siteLocales[i] !== 'default')) {
                var localeCurrency;
                var pinterestLocale = siteLocales[i];

                if (pinterestLocale === 'default') {
                    pinterestLocale = DEFAULT_PINTEREST_LOCALE;
                }

                //set the locale so data in loop is locale specific
                request.setLocale(siteLocales[i]);

                try {
                    var configCountry = configCountries.filter(function(locale){return locale.id === siteLocales[i]});
                    localeCurrency = configCountry && configCountry.length? configCountry.pop().currencyCode : siteCurrent.defaultCurrency;
                } catch (e) {
                    localeCurrency = siteCurrent.defaultCurrency;
                }

                //if catalog doesn't already exist on pinterest add it
                if (!apiLocales[pinterestLocale]) {
                    var data = {
                        action: 'add',
                        name: 'SFCC_PBCP_' + siteCurrent.ID + ' ' + pinterestLocale + ' (' + siteCurrent.httpsHostName + ')',
                        format: 'XML',
                        location: 'https://' + siteCurrent.httpsHostName + '/on/demandware.servlet/webdav/Sites/' + [File.IMPEX, PINTEREST_IMPEX_DIRECTORY].join(File.SEPARATOR) + File.SEPARATOR + pinterestHelpers.getCatalogFileName(siteLocales[i], false),
                        default_locale: pinterestLocale,
                        default_country: pinterestLocale.split('_')[1],
                        default_currency: localeCurrency,
                        credentials: {
                            username: siteCurrent.getCustomPreferenceValue('pinterestWebDAVUser'),
                            password: siteCurrent.getCustomPreferenceValue('pinterestWebDAVPassword')
                        }
                    };
                    var resultCatalogFeeds = pinterestCatalogFeedsService.call(data);

                    //error check
                    if (!resultCatalogFeeds.ok) {
                        processedAll = false;
                        pinterestLogger.error('Pinterest error: catalog feed, ' + pinterestLocale + ', ' + resultCatalogFeeds.msg + ' - ' + resultCatalogFeeds.errorMessage);
                    }
                } else {
                    var data = {
                        action: 'update',
                        feed_id: apiLocales[pinterestLocale].id,
                        format: 'XML',
                        location: 'https://' + siteCurrent.httpsHostName + '/on/demandware.servlet/webdav/Sites/' + [File.IMPEX, PINTEREST_IMPEX_DIRECTORY].join(File.SEPARATOR) + File.SEPARATOR + pinterestHelpers.getCatalogFileName(siteLocales[i], false),
                        credentials: {
                            username: siteCurrent.getCustomPreferenceValue('pinterestWebDAVUser'),
                            password: siteCurrent.getCustomPreferenceValue('pinterestWebDAVPassword')
                        }
                    };
                    var resultCatalogFeeds = pinterestCatalogFeedsService.call(data);

                    //error check
                    if (!resultCatalogFeeds.ok) {
                        processedAll = false;
                        pinterestLogger.error('Pinterest error: catalog feed, ' + pinterestLocale + ', ' + resultCatalogFeeds.msg + ' - ' + resultCatalogFeeds.errorMessage);
                    }

                    //remove it from the array so we know what catalogs need removed later
                    delete apiLocales[pinterestLocale];
                }
            }
        }
    }

    //if any catalogs left in the array then we need to delete them from Pinterest
    if (processedAll && apiLocales) {
        var apiLeftoverLocaleKeys = Object.keys(apiLocales);

        //loop leftover catalogs in the array
        for (var ii = 0; ii < apiLeftoverLocaleKeys.length; ii++) {
            if (apiLocales[apiLeftoverLocaleKeys[ii]] && apiLocales[apiLeftoverLocaleKeys[ii]].id) {

                //delete catalog api call
                var resultCatalogDelete = pinterestCatalogFeedsService.call({
                    action: 'delete',
                    feed_id: apiLocales[apiLeftoverLocaleKeys[ii]].id
                });

                //error check
                if (!resultCatalogDelete.ok) {
                    processedAll = false;
                    pinterestLogger.error('Pinterest Error: Disconnect Failed, Catalog Feeds,' + resultCatalogDelete.msg + ' - ' + resultCatalogDelete.errorMessage);
                }
            }
        }
    }

    if (processedAll) {
        pinterestLogger.info('Pinterest: Export of product xml files was successful');

        return new Status(Status.OK, 'OK', 'Export of product xml files was successful');
    }

    throw new Error('Pinterest Error: Could not process all the catalog xml files');
};
