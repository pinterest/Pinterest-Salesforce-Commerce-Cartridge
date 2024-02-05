/* Pinterest Product Metadata Update Job */
'use strict';

var Status = require('dw/system/Status');
var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');
var PinterestLogger = require('*/cartridge/scripts/helpers/pinterest/pinterestLogger');
var pinterestLoggingHelper = new PinterestLogger();
var AllPinterestMetadataPayload;
var AllPinterestMetadataPayloadIterator;
var chunks = 0;
var processedAll = true;

/**
 * Executed Before Processing of Chunk and Validates that the user is logged in
 */
exports.beforeStep = function () {
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
    var siteCurrent = Site.getCurrent();

    if (!pinterestHelpers.isConnected()) {
        pinterestLoggingHelper.logError('Pinterest Error: Job can not run, Pinterest App connection is disabled for site: ' + siteCurrent.ID);

        throw new Error('Pinterest Error: Job can not run, Pinterest App connection is disabled for site: ' + siteCurrent.ID);
    }

    var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig()
    var pinterestMetadata = new Array();
    var payload = {
        action: 'update',
        external_business_id: pinterestHelpers.getExternalBusinessID(businessAccountConfig.info.advertiser_id, siteCurrent),
        partner_metadata: JSON.stringify({
            iframe_version: businessAccountConfig.info.iframe_version,
            feature_flags: {
                catalog: siteCurrent.getCustomPreferenceValue('pinterestEnabledCatalogIngestion'),
                tags: siteCurrent.getCustomPreferenceValue('pinterestEnabledConversionClientsideCalls'),
                CAPI: siteCurrent.getCustomPreferenceValue('pinterestEnabledConversionServersideCalls'),
                GDPR: siteCurrent.getCustomPreferenceValue('pinterestEnabledGDPR'),
                LDP: siteCurrent.getCustomPreferenceValue('pinterestEnabledLDP'),
                logging: siteCurrent.getCustomPreferenceValue('pinterestLoggingFlag')
            }
        })
    }
    pinterestMetadata.push(payload)

    AllPinterestMetadataPayload = new ArrayList(pinterestMetadata);
    AllPinterestMetadataPayloadIterator = AllPinterestMetadataPayload.iterator();
};

/**
 * Executed Before Processing of Chunk and Return total catalogs processed
 * @returns {number} products count
 */
exports.getTotalCount = function () {
    return AllPinterestMetadataPayload.length;
};

/**
 * Returns a single catalog to processed
 * @returns {dw.catalog.Product} product - Product
 */
exports.read = function () {
    if (AllPinterestMetadataPayloadIterator.hasNext()) {
        return AllPinterestMetadataPayloadIterator.next();
    }
};

/**
 * Process locale array, checks that it is valid
 * @param {Array} localeData - Product, locale and file
 * @returns {Object} localeData
 */
exports.process = function (localeData) {
    if (localeData && localeData.partner_metadata) {
        return localeData;
    }
};

/**
 * Writes a single catalog XML file per locale line
 * @param {dw.util.List} lines to write
 */
exports.write = function (lines) {
    if (lines.length) {
    var pinterestIntegrationService = require('~/cartridge/scripts/services/pinterestIntegration');
        var data = lines[0];
        var result = pinterestIntegrationService.call(data);

        if (!result.ok) {
            pinterestLoggingHelper.logErrorFromAPIResponse('pinterestIntegrationService', result);
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
    if (processedAll) {
        pinterestLoggingHelper.logInfo('Pinterest metadata was updated');
        return new Status(Status.OK, 'OK', 'Pinterest metadata was updated');
    }
    throw new Error('Pinterest Error: Could not sync metadata');
};
