'use strict';
var Logger = require('dw/system/Logger');
var pinterestLogger = Logger.getLogger('pinterest', 'pinterest');

function htmlHead (pdict) {
    var Site = require('dw/system/Site');
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
    var siteCurrent = Site.getCurrent();

    try {
        if (pinterestHelpers.isConnected()) {
            var velocity = require('dw/template/Velocity');
            var pinterestConversionService = require('*/cartridge/scripts/services/pinterestConversion');
            var customerData = pinterestHelpers.getDataCustomerEmail(pdict);
            var clientEvent = pinterestHelpers.getClientEvent(pdict);
            var serverEvent = pinterestHelpers.getServerEvent(pdict);
            var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig();
            var isBot = /Pinterestbot/i.test(request.httpUserAgent);
            var pinterestEnabledGDPR = siteCurrent.getCustomPreferenceValue('pinterestEnabledGDPR') || false;
            var gdprConsent = true;
            if (pinterestEnabledGDPR) {
                gdprConsent = session.privacy.consent || false;
            }

            //if token is about to expire refresh it
            businessAccountConfig = pinterestHelpers.refreshAccessToken(businessAccountConfig);

            if (
                serverEvent 
                && siteCurrent.getCustomPreferenceValue('pinterestEnabledConversionServersideCalls') 
                && !isBot 
                && gdprConsent
            ) {
                //send server side event
                var result = pinterestConversionService.call(serverEvent);

                if (!result.ok) {
                    pinterestLogger.error('Pinterest error: ' + result.msg + ' - ' + result.errorMessage);
                }
            }

            //render client side event
            velocity.render("$velocity.remoteInclude('Pinterest-HtmlHead', 'email', $email, 'emailHashed', $emailHashed, 'track', $track, 'data', $data, 'verificationCode', $verificationCode, 'isEnabledConversionCalls', $isEnabledConversionCalls)",
                {
                    velocity: velocity,
                    email: customerData.email,
                    emailHashed: customerData.emailHashed,
                    track: clientEvent.track ? clientEvent.track : false,
                    data: clientEvent.data ? JSON.stringify(clientEvent.data) : false,
                    verificationCode: businessAccountConfig.verificationCode,
                    isEnabledConversionCalls: siteCurrent.getCustomPreferenceValue('pinterestEnabledConversionClientsideCalls')
                }
            );
        }
    } catch (e) {
        pinterestLogger.error('Pinterest error: hook failed, ' + ((e && e.message)? e.message : 'unknown error'));
    }
}

module.exports = {
    htmlHead: htmlHead
};
