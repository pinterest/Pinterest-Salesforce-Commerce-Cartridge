'use strict';

var cacheManager = require('dw/system/CacheMgr');
var samplingCache = cacheManager.getCache('PinterestLogSamplingCache');
var pinterestHelper = require('~/cartridge/scripts/helpers/pinterest/pinterestHelper');
var Logger = require('dw/system/Logger');
var pinterestFileLogger = Logger.getLogger('pinterest', 'pinterest');
var Site = require('dw/system/Site');
var siteCurrent = Site.getCurrent();
var pinterestLoggingService = require('*/cartridge/scripts/services/pinterestLoggingService');
var packageJSON = require('*/package.json');
var System = require('dw/system/System');

function PinterestLogger() {
    this.logCache = [];
    this.CACHE_MAX_SIZE = 1000;
    this.CACHE_MAX_HOLD_SECONDS = 3;
    this.CACHE_AGE = Date.now();
    this.app_version_number = packageJSON.version;
    this.platform_version_number =  System.getCompatibilityMode().toString();
}

/**
 * Format a single log for usage in request payload
 * @param {string} message
 * @param {string} log_level
 * @returns
 */
PinterestLogger.prototype.formatLog = function (message, log_level, additionalPayload) {
    var loggingMsgMaxLen = 2000;    // integration logging API has max 1024 length limit for message field

    var formattedLog = {
        "client_timestamp": Date.now(),
        "event_type": 'APP',
        "log_level": log_level,
        "message": typeof message === 'string' ? message.slice(0, loggingMsgMaxLen) : message,
        "app_version_number": this.app_version_number,
        "platform_version_number": this.platform_version_number
    };

    if(additionalPayload instanceof Error) {
        formattedLog.error = {
            name: additionalPayload.name,
            message: additionalPayload.message,
            stack_trace: additionalPayload.stack
        };
    }

    return formattedLog;
}
/**
 * Create payload of logs to send to API
 * @param {array} logs
 * @returns
 */
PinterestLogger.prototype.getRequestPayload = function (logs) {
    var payload = {
        "logs": logs
    }
    return payload;
}

/**
 * Check if logging is enabled
 * @returns {boolean} isLoggingEnabled
 */
PinterestLogger.prototype.isLoggingEnabled = function (){
    return Site.getCurrent().getCustomPreferenceValue('pinterestLoggingFlag');
}

PinterestLogger.prototype.resetCache = function() {
    this.logCache = [];
    this.CACHE_AGE = Date.now();
}

PinterestLogger.prototype.isCacheFull = function() {
    return this.logCache.length >= this.CACHE_MAX_SIZE || Date.now() - this.CACHE_AGE > this.CACHE_MAX_HOLD_SECONDS * 1000;
}

/**
 * Send logs to Pinterest if logging is enabled
 * @param {string} message
 * @param {string} log_level
 * @returns
 */
PinterestLogger.prototype.enqueueLog = function (message, log_level, logSamplingEnum, additionalPayload) {
    if (!this.isLoggingEnabled() || (logSamplingEnum && this.existsInSamplingCache(logSamplingEnum))){
        // ignore log if logging is disabled or if this log should be sampled out
        return;
    }
    if (message) {
        var formattedLog = this.formatLog(message, log_level, additionalPayload);
        this.logCache.push(formattedLog);
    }
    if (this.isCacheFull()) {
        this.sendLogs();
    }
}
PinterestLogger.prototype.backfillLogIds = function () {
    var businessAccountConfig = pinterestHelper.getBusinessAccountConfig();
    if (businessAccountConfig && businessAccountConfig.info) {
        var advertiserId = businessAccountConfig.info.advertiser_id;
        var merchantId = businessAccountConfig.info.merchant_id;
        var tagId = businessAccountConfig.info.tag_id;
        var externalBusinessId = pinterestHelper.getExternalBusinessID(advertiserId, siteCurrent);
        for (var i = 0; i < this.logCache.length; i++) {
            this.logCache[i]["advertiser_id"] = advertiserId;
            this.logCache[i]["merchant_id"] = merchantId;
            this.logCache[i]["tag_id"] = tagId;
            this.logCache[i]["external_business_id"] = externalBusinessId;
        }
    }
}

PinterestLogger.prototype.sendLogs = function () {
    if (pinterestHelper.isConnected() && Array.isArray(this.logCache) && this.logCache.length > 0) {
        this.backfillLogIds();
        var payload = this.getRequestPayload(this.logCache);
        var result = pinterestLoggingService.call(payload);
        if (!result.ok) {
            pinterestFileLogger.error('Error sending logs to Pinterest: , ' + result.msg + ' - ' + result.errorMessage);
        }
        this.resetCache();
    }
}

/**
 * Turn Pinterest API response into valid log statement
 * @param {dw.svc.Result} message
 * @param {dw.svc.Result} result
 */
PinterestLogger.prototype.logErrorFromAPIResponse = function (message, result, logSamplingEnum) {
    if (!result){
        this.logError(message);
        this.logError('Attempt to log error from API response without a result object');
        return;
    }
    var errorMessageAsJSON = result.errorMessage? JSON.parse(result.errorMessage): null;
    var logStatement = message + ', ' + (result.msg? result.msg : '') + ' - '
    if (errorMessageAsJSON && errorMessageAsJSON["message"] && errorMessageAsJSON["code"]){
        logStatement += errorMessageAsJSON["message"] + ' , code: ' + errorMessageAsJSON["code"];
    }
    this.logError(logStatement, logSamplingEnum);
}

/**
 * @param {string} message
 */
PinterestLogger.prototype.logError = function (errorPayload, logSamplingEnum) {
    var message = errorPayload ? String(errorPayload) : 'uncaptured logError messsage';
    var additionalPayload = undefined;

    if (typeof errorPayload === 'string') {
        message = errorPayload;
    } else if (errorPayload instanceof Error) {
        message = 'Pinterest error: ' + errorPayload.name + ' - ' + errorPayload.message;
        additionalPayload = errorPayload;
    }
    
    pinterestFileLogger.error(message);
    this.enqueueLog(message, 'ERROR', logSamplingEnum, additionalPayload);
}

/**
 * @param {string} message
 */
PinterestLogger.prototype.logWarning = function (message, logSamplingEnum) {
    pinterestFileLogger.warn(message);
    this.enqueueLog(message, 'WARN', logSamplingEnum);
}

/**
 * @param {string} message
 */
PinterestLogger.prototype.logInfo = function (message, logSamplingEnum) {
    pinterestFileLogger.error(message);
    this.enqueueLog(message, 'INFO', logSamplingEnum);
}

PinterestLogger.prototype.flushLogCache = function () {
    this.sendLogs();
}

/**
 * For log sampling, return true if key is already present in sampling cache
 * @param {string} key
 */
PinterestLogger.prototype.existsInSamplingCache = function (key) {
    if (samplingCache.get(key)){
        return true;
    } else {
        samplingCache.put(key, {});
        return false;
    }
}

module.exports = PinterestLogger;