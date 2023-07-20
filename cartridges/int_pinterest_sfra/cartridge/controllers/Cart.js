'use strict';

var page = module.superModule;
var server = require('server');

server.extend(page);

server.append('AddProduct', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Logger = require('dw/system/Logger');
    var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var pinterestAddToCartDecorator = require('*/cartridge/models/pinterest/addToCart.js');
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
                pinterestLogger.error('Pinterest error: AddProduct, ' + result.msg + ' - ' + result.errorMessage);
            }
        }
    } catch (e) {
        pinterestLogger.error('Pinterest error: AddProduct, ' + ((e && e.message)? e.message : 'unknown error'));
    }

    next();
});

module.exports = server.exports();
