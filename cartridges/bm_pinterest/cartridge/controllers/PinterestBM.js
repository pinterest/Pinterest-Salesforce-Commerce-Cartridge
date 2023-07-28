'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var UUIDUtils = require('dw/util/UUIDUtils');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');
var System = require('dw/system/System');
var FileReader = require('dw/io/FileReader');
var pinterestBMHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestBMHelpers');
var pinterestUserWebsitesModel = require('*/cartridge/models/pinterest/userWebsites');
var pinterestUserWebsitesService = require('*/cartridge/scripts/services/pinterestUserWebsites');
var packageJSON = require('../../package.json');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');
var siteCurrent = Site.getCurrent();
var pinterestAppID = siteCurrent.getCustomPreferenceValue('pinterestAppID');
var businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
var languageMapping = {  
    'en': 'en_US', // English (United States)  
    'es': 'es_ES', // Spanish (Spain)  
    'fr': 'fr_FR', // French (France)  
    'de': 'de_DE', // German (Germany)  
    'it': 'it_IT', // Italian (Italy)  
    'ja': 'ja_JP', // Japanese (Japan)  
    'ko': 'ko_KR', // Korean (South Korea)  
    'pt': 'pt_BR', // Portuguese (Brazil)  
    'ru': 'ru_RU', // Russian (Russia)  
    'zh': 'zh_CN', // Chinese Simplified (China)  
    'ar': 'ar_SA', // Arabic (Saudi Arabia)  
    'nl': 'nl_NL', // Dutch (Netherlands)  
    'sv': 'sv_SE', // Swedish (Sweden)  
    'pl': 'pl_PL', // Polish (Poland)  
    'no': 'no_NO', // Norwegian (Norway)  
    'fi': 'fi_FI', // Finnish (Finland)  
    'da': 'da_DK', // Danish (Denmark)  
    // Further codes can be added as per requirements  
}

function verifyAllDomains() {
    var allSites = pinterestUserWebsitesModel.getAllSites().allSitesData;
    var result = {
        success: true,
        failedWebsites: []
    }

    for (var i = 0; i < allSites.length; i++) {
        if (!allSites[i].isVerified) {
            var resultWebsites = pinterestUserWebsitesService.call({
                action: 'verify',
                website: allSites[i].urlPart
            });

            if (!resultWebsites.ok) {
                pinterestLogger.error('Pinterest error: Domain Claiming ' + resultWebsites.msg + ' - ' + resultWebsites.errorMessage);
                result.success = false;
                result.failedWebsites.push(allSites[i].urlPart);
            }
        }
    }

    return result;
};

/**
 * Handle Pinterest App Linking Callback
 * @param {dw.web.HttpParameterMap} httpParameterMap - url param data
 * @returns {Object} - params for template
 */
function handleConnectionCallback(httpParameterMap) {
    var paramInfo = httpParameterMap.info.value;
    var paramTokenData = httpParameterMap.token_data.value;
    var paramState = httpParameterMap.state.value;
    var pinterestConfigurationData = {};
    var viewData = {
        error: false,
        errorID: '',
        errorMessage: '',
        warn: false,
        warnIDs: [],
        warnMessages: [],
        warnWebsites: []
    };

    try {
        //decode url data
        if (
            paramInfo
            && paramTokenData
            && paramState
            && session.custom.pinterestBMCallbackState
            && paramState === session.custom.pinterestBMCallbackState
        ) {
            var nowSeconds = (Math.floor(new Date().getTime()/1000));

            paramInfo = dw.crypto.Encoding.fromBase64(paramInfo);
            paramInfo = dw.crypto.Encoding.fromURI(paramInfo);
            paramInfo = JSON.parse(paramInfo);
            paramTokenData = dw.crypto.Encoding.fromBase64(paramTokenData);
            paramTokenData = dw.crypto.Encoding.fromURI(paramTokenData);
            paramTokenData = JSON.parse(paramTokenData);
        } else {
            viewData.error = true;
            viewData.errorID = 'GENERIC';
            viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
            pinterestLogger.error('Pinterest error: Account configuration callback failed, unexpected data returned from callback before parsing.');
        }

        // save the url data to custom preferences
        // if this fails error out
        if (
            !viewData.error
            && paramInfo.merchant_id
            && paramInfo.tag_id
            && paramTokenData.access_token
            && paramTokenData.refresh_token
            && paramTokenData.expires_in
            && paramTokenData.refresh_token_expires_in
        ) {
            var pinterestIntegrationService = require('*/cartridge/scripts/services/pinterestIntegration');
            var pinterestVerificationService = require('*/cartridge/scripts/services/pinterestVerification');
            var pinterestAccessTokenExpiration = (paramTokenData.expires_in + nowSeconds);
            var pinterestRefreshAccessTokenExpiration = (paramTokenData.refresh_token_expires_in + nowSeconds);
            var pinterestTokenLastRefresh = (Math.floor(new Date().getTime()/1000));

            pinterestConfigurationData.tokenData = paramTokenData;
            pinterestConfigurationData.info = paramInfo;
            pinterestConfigurationData.accessTokenExpiration = pinterestAccessTokenExpiration;
            pinterestConfigurationData.refreshAccessTokenExpiration = pinterestRefreshAccessTokenExpiration;
            pinterestConfigurationData.tokenLastRefresh = pinterestTokenLastRefresh;
        } else {
            viewData.error = true;
            viewData.errorID = 'GENERIC';
            viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
            pinterestLogger.error('Pinterest error: Account configuration callback failed, unexpected data returned from callback after parsing.');
        }

        // save custom object data
        // if this fails error out
        if (!viewData.error) {
            var setBusinessAccountConfigResult = pinterestBMHelpers.setBusinessAccountConfig(pinterestAppID, pinterestConfigurationData);

            if (!setBusinessAccountConfigResult) {
                viewData.error = true;
                viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
            } else {
                businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
            }
        }

        //link the integration
        // if this fails error out
        if (!viewData.error) {
            var resultIntegration = pinterestIntegrationService.call({
                action: 'add',
                connected_merchant_id: businessAccountConfig.info.merchant_id,
                connected_advertiser_id: businessAccountConfig.info.advertiser_id,
                connected_tag_id: businessAccountConfig.info.tag_id,
                partner_access_token: businessAccountConfig.tokenData.access_token,
                external_business_id: pinterestBMHelpers.getExternalBusinessID(businessAccountConfig.info.advertiser_id, siteCurrent)
            });

            if (!resultIntegration.ok) {
                viewData.error = true;
                viewData.errorID = 'GENERIC';
                viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
                pinterestLogger.error('Pinterest error: ' + resultIntegration.msg + ' - ' + resultIntegration.errorMessage);
            }
        }

        //get the meta tag verification code
        // if this fails just warn
        if (!viewData.error) {
            var resultVerification = pinterestVerificationService.call(businessAccountConfig);

            if (!resultVerification.ok) {
                viewData.warn = true;
                viewData.warnIDs.push('ERROR_DOMAIN_CLAIMING');
                viewData.warnMessages.push(Resource.msg('error.domainverificationfailedkey', 'pinterestbm', null));
                pinterestLogger.error('Pinterest error: ' + resultVerification.msg + ' - ' + resultVerification.errorMessage);
            } else {
                var resultVerificationObject = JSON.parse(resultVerification.object);

                if (resultVerificationObject['verification_code']) {
                    businessAccountConfig.verificationCode = resultVerificationObject['verification_code'];
                }
            }
        }

        //save custom object data again now that we have verification data
        // if this fails error out
        if (!viewData.error) {
            var setBusinessAccountConfigResult = pinterestBMHelpers.setBusinessAccountConfig(pinterestAppID, businessAccountConfig);

            if (!setBusinessAccountConfigResult) {
                viewData.error = true;
                viewData.errorID = 'GENERIC';
                viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
            }
        }

        //verify all the domains
        // if this fails just warn
        if (!viewData.error) {
            var verifyAllDomainsResult = verifyAllDomains();

            if (!verifyAllDomainsResult.success) {
                viewData.warn = true;
                viewData.warnIDs.push('ERROR_DOMAIN_CLAIMING');
                viewData.warnWebsites.push(verifyAllDomainsResult.failedWebsites);
                viewData.warnMessages.push(Resource.msg('error.domainverificationfailed', 'pinterestbm', null));
            }
        }
    } catch (e) {
        viewData.error = true;
        viewData.errorID = 'GENERIC';
        viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
        pinterestLogger.error('Pinterest error: Account configuration callback failed, ' + ((e && e.message)? e.message : 'unknown error'));
    }

    viewData.pinterestBaseUrl = siteCurrent.getCustomPreferenceValue('pinterestIntegrationBaseURL');

    return viewData;
};

/**
 * Handle Pinterest App Disconnect
 * @returns {Object} - view data
 */
function handleDisconnection() {
    var viewData = {
        error: false,
        errorID: '',
        errorMessage: '',
        success: false,
        successMessage: ''
    };

    var pinterestUserWebsitesService = require('*/cartridge/scripts/services/pinterestUserWebsites');
    var pinterestCatalogFeedsService = require('*/cartridge/scripts/services/pinterestCatalogFeeds');
    var pinterestUserWebsitesModel = require('*/cartridge/models/pinterest/userWebsites');
    var pinterestCatalogFeedsModel = require('*/cartridge/models/pinterest/catalogFeeds');

    try {
        //remove catalogs
        pinterestCatalogFeedsModel.getCatalogIDs().forEach(function (id) {
            var resultCatalog = pinterestCatalogFeedsService.call({
                action: 'delete',
                feed_id: id
            });

            //error check
            if (!resultCatalog.ok) {
                viewData.error = true;
                viewData.errorID = 'ERROR_DISCONNECT';
                viewData.errorMessage = Resource.msg('error.disconnectfailure', 'pinterestbm', null);
                pinterestLogger.error('Pinterest error: Disconnect Failed, Catalog Feeds,' + resultCatalog.msg + ' - ' + resultCatalog.errorMessage);
            }
        });

        //disconnect integration
        if (!viewData.error) {
            var pinterestIntegrationService = require('*/cartridge/scripts/services/pinterestIntegration');
            var resultIntegration = pinterestIntegrationService.call({
                action: 'delete',
                external_business_id: pinterestBMHelpers.getExternalBusinessID(businessAccountConfig.info.advertiser_id, siteCurrent)
            });

            if (!resultIntegration.ok) {
                viewData.error = true;
                viewData.errorID = 'ERROR_DISCONNECT';
                viewData.errorMessage = Resource.msg('error.callback', 'pinterestbm', null);
                pinterestLogger.error('Pinterest error: ' + resultIntegration.msg + ' - ' + resultIntegration.errorMessage);
            }
        }

        //remove stored data
        pinterestBMHelpers.setBusinessAccountConfig(pinterestAppID, {});
        if (!viewData.error) {
            viewData.success = true;
            viewData.successMessage = Resource.msg('success.disconnectsuccess', 'pinterestbm', null);
        }
    } catch (e) {
        viewData.error = true;
        viewData.errorID = 'ERROR_DISCONNECT';
        viewData.errorMessage = Resource.msg('error.disconnectfailure', 'pinterestbm', null);
        pinterestLogger.error('Pinterest error: Account disconnect failed, ' + ((e && e.message)? e.message : 'unknown error'));
    }

    return viewData;
};

server.get('Start', server.middleware.https, function (req, res, next) {
    var httpParameterMap = request.getHttpParameterMap();

    //used to verify callback is origin
    if (!session.custom.pinterestBMCallbackState) {
        session.custom.pinterestBMCallbackState = UUIDUtils.createUUID();
    }

    //connection callback
    if (
        httpParameterMap
        && httpParameterMap.info
        && httpParameterMap.info.value
        && httpParameterMap.token_data
        && httpParameterMap.token_data.value
        && httpParameterMap.state
        && httpParameterMap.state.value
    ) {
        var viewData = handleConnectionCallback(httpParameterMap);

        res.render('/pinterest/callback', viewData);
    } else {
        var viewData = {
            error: false,
            errorID: '',
            errorMessage: '',
            success: false,
            successMessage: ''
        };

        //disconnect
        if (
            httpParameterMap
            && httpParameterMap.disconnectPinterest
            && httpParameterMap.disconnectPinterest.booleanValue === true
            && pinterestBMHelpers.isConnected(businessAccountConfig)
        ) {
            viewData = handleDisconnection();
            businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
        }



        //render
        viewData.locale = req.locale.id.length == 2 ? languageMapping[req.locale.id] : req.locale.id;
        if (pinterestBMHelpers.isConnected(businessAccountConfig)) {
            viewData.clientID = siteCurrent.getCustomPreferenceValue('pinterestAppID');
            viewData.accessToken = businessAccountConfig.tokenData.access_token;
            viewData.advertiserId = businessAccountConfig.info.advertiser_id;
            viewData.merchantId = businessAccountConfig.info.merchant_id;
            viewData.tagId = businessAccountConfig.info.tag_id;
            viewData.pinterestBaseUrl = siteCurrent.getCustomPreferenceValue('pinterestIntegrationBaseURL');
            viewData.partnerMetadataSFCCCompatibilityModeVersion = System.getCompatibilityMode();
            viewData.partnerMetadataPluginVersion = packageJSON.version;
            viewData.partnerMetadataBaseURL = URLUtils.httpsHome().toString();
            viewData.isConnected = true;
        } else {
            viewData.clientID = siteCurrent.getCustomPreferenceValue('pinterestAppID');
            viewData.redirectURI = URLUtils.https('PinterestBM-Start').toString();
            viewData.state = session.custom.pinterestBMCallbackState;
            viewData.pinterestBaseUrl = siteCurrent.getCustomPreferenceValue('pinterestIntegrationBaseURL');
            viewData.useMiddleware = true;
            viewData.partnerMetadataSFCCCompatibilityModeVersion = System.getCompatibilityMode();
            viewData.partnerMetadataPluginVersion = packageJSON.version;
            viewData.partnerMetadataBaseURL = URLUtils.httpsHome().toString();
            viewData.isConnected = false;

            if (!viewData.clientID || viewData.clientID === '') {
                viewData.error = true;
                viewData.errorID = 'GENERIC';
                viewData.errorMessage = Resource.msg('error.missingdata', 'pinterestbm', null);
            }
        }

        res.render('/pinterest/connect', viewData);
    }

    return next();
});

server.get('Domain', server.middleware.https, function (req, res, next) {
    var httpParameterMap = request.getHttpParameterMap();
    var viewData = {
        error: false,
        errorID: '',
        errorMessage: '',
        success: false,
        successMessage: '',
        data: {}
    };

    try {
        if (pinterestBMHelpers.isConnected(businessAccountConfig)) {
            viewData.isConnected = true;

            //verify 1 domain
            if (httpParameterMap.verifyDomain.value) {
                var resultWebsites = pinterestUserWebsitesService.call({
                    action: 'verify',
                    website: httpParameterMap.verifyDomain.value
                });

                if (!resultWebsites.ok) {
                    viewData.error = true;
                    viewData.errorID = 'GENERIC';
                    viewData.errorMessage = Resource.msg('error.domainverificationfailed', 'pinterestbm', null);
                    pinterestLogger.error('Pinterest error: Domain Claiming, ' + resultWebsites.msg + ' - ' + resultWebsites.errorMessage);
                }
            //unverify 1 domain
            } else if (httpParameterMap.unverifyDomain.value) {
                var resultWebsites = pinterestUserWebsitesService.call({
                    action: 'unverify',
                    website: httpParameterMap.unverifyDomain.value
                });

                if (!resultWebsites.ok) {
                    viewData.error = true;
                    viewData.errorMessage = Resource.msg('error.domainverificationfailed', 'pinterestbm', null);
                    pinterestLogger.error('Pinterest error: Domain Claiming, ' + resultWebsites.msg + ' - ' + resultWebsites.errorMessage);
                }
            //verify all domains
            } else if (httpParameterMap.verifyAll.value && httpParameterMap.verifyAll.booleanValue === true) {
                var verifyAllDomainsResult = verifyAllDomains();

                if (!verifyAllDomainsResult.success) {
                    viewData.error = true;
                    viewData.errorID = 'GENERIC';
                    viewData.errorMessage = Resource.msg('error.domainverificationfailed', 'pinterestbm', null);
                }
            }

            viewData.data = pinterestUserWebsitesModel.getAllSites();
        } else {
            viewData.isConnected = false;
            viewData.error = true;
            viewData.errorID = 'GENERIC';
            viewData.errorMessage = Resource.msg('text.domainverificationdisabled', 'pinterestbm', null);
            pinterestLogger.error('Pinterest error: Domain Claiming failed, missing app connection');
        }
    } catch (e) {
        viewData.error = true;
        viewData.errorID = 'GENERIC';
        viewData.errorMessage = Resource.msg('error.domainverificationfailed', 'pinterestbm', null);
        pinterestLogger.error('Pinterest error: Domain verification failed, ' + ((e && e.message)? e.message : 'unknown error'));
    }

    res.render('/pinterest/domains', viewData);

    return next();
});

module.exports = server.exports();
