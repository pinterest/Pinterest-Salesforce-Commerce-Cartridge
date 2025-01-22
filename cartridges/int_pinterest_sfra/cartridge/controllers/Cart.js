'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

server.append('AddProduct', function (req, res, next) {
    var Site = require('dw/system/Site');
    var PinterestLogger = require('*/cartridge/scripts/helpers/pinterest/pinterestLogger');
    var pinterestLogger = new PinterestLogger();
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
    var pinterestAddToCartDecorator = require('*/cartridge/models/pinterest/addToCart.js');
    var LogSamplingEnums = require('*/cartridge/scripts/helpers/pinterest/pinterestConstants');
    var isBot = /Pinterestbot/i.test(request.httpUserAgent);
    var pinterestEnabledGDPR = Site.getCurrent().getCustomPreferenceValue('pinterestEnabledGDPR') || false;
    var gdprConsent = true;
    if (pinterestEnabledGDPR) {
        gdprConsent = req.session.privacyCache.get('consent') || false;
    }
    try {
        if (
            pinterestHelpers.isConnected()
            && Site.getCurrent().getCustomPreferenceValue('pinterestEnabledConversionServersideCalls')
            && !isBot
            && gdprConsent
            && res.viewData.error === false
        ) {
            var pinterestConversionService = require('*/cartridge/scripts/services/pinterestConversion');

            pinterestAddToCartDecorator(res.viewData, request.httpParameterMap.pid.value, request.httpParameterMap.quantity.value, gdprConsent);

            var serverEvent = pinterestHelpers.getServerEvent(res.viewData);

            //send server side event
            var result = pinterestConversionService.call(serverEvent);

            if (!result.ok) {
                pinterestLogger.logErrorFromAPIResponse('AddProduct', result, LogSamplingEnums.CAPI_ADD_TO_CART_API_FAILURE);
            }
        }
    } catch (e) {
        pinterestLogger.logError(e || 'Pinterest error: AddProduct, unknown error', LogSamplingEnums.CAPI_ADD_TO_CART_EXCEPTION);
    }
    pinterestLogger.flushLogCache(); // we have to flush or the log will be lost
    next();
});

module.exports = server.exports();
