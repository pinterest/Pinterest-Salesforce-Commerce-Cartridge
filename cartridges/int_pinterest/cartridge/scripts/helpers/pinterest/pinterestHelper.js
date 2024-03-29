'use strict';

var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

/**
 * Get Pinterest Account Config
 * @returns {dw.object.CustomObject} - config
 */
function getBusinessAccountConfig() {
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
 */
function setBusinessAccountConfig(pinterestAppID, pinterestConfigurationData) {
    var accessToken = null;
    var refreshToken = null;
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
}


/**
 * set empty errors array in Pinterest Config
 */
function clearErrorsPinterestConfig() {

    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

    Transaction.wrap(function(){
        if (!pinterestConfiguration) {
            pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
        }
        pinterestConfiguration.custom.errors = new Array();
    });
}


/**
 * add an error in Pinterest Config
 * @param {String} errorId
 * @param {Object} errorData
 */
function addErrorPinterestConfig(errorId, errorData) {
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);

    Transaction.wrap(function(){
        if (!pinterestConfiguration) {
            pinterestConfiguration = CustomObjectMgr.createCustomObject('pinterestConfiguration', pinterestAppID);
            pinterestConfiguration.custom.errors = new Array();
        }

        var errors = [];
        for (var i = 0; i < pinterestConfiguration.custom.errors.length; i++) {
            errors.push(pinterestConfiguration.custom.errors[i]);
        }

        var data = {
            'integration_error_id': errorId,
            'data': errorData
        };
        errors.push(JSON.stringify(data));
        pinterestConfiguration.custom.errors = errors;
    });
}

/**
 * Get Errors in Pinterest Config
 * @returns {String} - errors from Pinterest Config
 */
function getErrorsPinterestConfig() {
    var pinterestAppID = Site.getCurrent().getCustomPreferenceValue('pinterestAppID');
    var pinterestConfiguration = CustomObjectMgr.getCustomObject('pinterestConfiguration', pinterestAppID);
    if (!pinterestConfiguration) {
        return [];
    }

    var errors = [];
    for (var i = 0; i < pinterestConfiguration.custom.errors.length; i++) {
        errors.push(JSON.parse(pinterestConfiguration.custom.errors[i]));
    }
    return errors;
}

/**
 * Check for Existing Valid Pinterest Connection
 * @returns {dw.object} - businessAccountConfig
 */
function isConnected(businessAccountConfig) {
    var isConnected = false;

    if (!businessAccountConfig) {
        businessAccountConfig = module.exports.getBusinessAccountConfig();
    }

    if (
        businessAccountConfig
        && businessAccountConfig.tokenData
        && businessAccountConfig.tokenData.access_token
        && businessAccountConfig.info
        && businessAccountConfig.info.advertiser_id
        && businessAccountConfig.info.merchant_id
    ) {
        isConnected = true;
    }

    return isConnected;
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
    setBusinessAccountConfig: setBusinessAccountConfig,
    addErrorPinterestConfig: addErrorPinterestConfig,
    clearErrorsPinterestConfig: clearErrorsPinterestConfig,
    getErrorsPinterestConfig: getErrorsPinterestConfig
};
