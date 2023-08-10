var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');

/**
 * Check for Existing Valid Pinterest Connection
 * @returns {dw.object} - businessAccountConfig
 */
function isConnected(businessAccountConfig) {
    var isConnected = false;

    if (!businessAccountConfig) {
        var businessAccountConfig = module.exports.getBusinessAccountConfig();
    }

    if (
        businessAccountConfig
        && businessAccountConfig.tokenData
        && businessAccountConfig.tokenData.access_token
        && businessAccountConfig.info
        && businessAccountConfig.info.advertiser_id
        && businessAccountConfig.info.merchant_id
        && businessAccountConfig.info.tag_id
    ) {
        isConnected = true;
    }

    return isConnected;
}

/**
 * Get Pinterest Account Config
 * @returns {dw.object.CustomObject} - config
 */
function getBusinessAccountConfig() {
    var Transaction = require('dw/system/Transaction');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var data = {};

    // custom pref pinterestAppID required to be defined
    if (pinterestAppID) {
        var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

        if (!pinterestConfiguration) {
            Transaction.wrap(function(){
                pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
            });
        }

        if (pinterestConfiguration.custom.data && pinterestConfiguration.custom.data !== '') {
            data = JSON.parse(pinterestConfiguration.custom.data);
        }

        if (
            data.tokenData
            && pinterestConfiguration.custom.accessToken
            && pinterestConfiguration.custom.refreshToken
        ) {
            data.tokenData.access_token = pinterestConfiguration.custom.accessToken;
            data.tokenData.refresh_token = pinterestConfiguration.custom.refreshToken;
        }

        return data;
    } else {
        return data;
    }
}

/**
 * Save Pinterest Account Config
 * @param {Object} pinterestConfigurationData - url param data
 * @returns {Boolean} - success or fail result saving custom object
 */
function setBusinessAccountConfig(pinterestAppID, pinterestConfigurationData) {
    var accessToken = null;
    var refreshToken = null;

    try {
        // get if it exists
        var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

        // if does not exist create it
        if (!pinterestConfiguration) {
            Transaction.wrap(function(){
                pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
            });
        }

        // we don't want to save the tokens as clear text in the object so splitting them out
        if (pinterestConfigurationData.tokenData) {
            accessToken = pinterestConfigurationData.tokenData.access_token;
            refreshToken = pinterestConfigurationData.tokenData.refresh_token;

            delete pinterestConfigurationData.tokenData.access_token;
            delete pinterestConfigurationData.tokenData.refresh_token;
        }

        // save the JSON object as a string
        Transaction.wrap(function() {
            pinterestConfiguration.custom.data = JSON.stringify(pinterestConfigurationData);
            pinterestConfiguration.custom.accessToken = accessToken;
            pinterestConfiguration.custom.refreshToken = refreshToken;
            pinterestConfiguration.custom.catalogOutOfStock = JSON.stringify({});
        });

        return true;
    } catch (e) {
        pinterestLogger.error('Account configuration save failed: ' + ((e && e.message)? e.message : 'unknown error'));

        return false;
    }
}

/**
 * Get site/env unique id
 * @param {String} advertiserID
 * @param {dw.system.Site} siteCurrent
 * @returns {String} - unique id
 */
function getExternalBusinessID(advertiserID, siteCurrent) {
    if (advertiserID && siteCurrent.ID && siteCurrent.httpsHostName) {
        return ('SFCC_PBCP_' + advertiserID + '-' + siteCurrent.ID + '-' + siteCurrent.httpsHostName);
    } else {
        return null;
    }
}

module.exports = {
    isConnected: isConnected,
    getExternalBusinessID: getExternalBusinessID,
    getBusinessAccountConfig: getBusinessAccountConfig,
    setBusinessAccountConfig: setBusinessAccountConfig
};
