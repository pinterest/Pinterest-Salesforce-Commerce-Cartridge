'use strict';
var PinterestLogger = require('*/cartridge/scripts/helpers/pinterest/pinterestLogger');
var pinterestLogger = new PinterestLogger();
var LogSamplingEnums = require('*/cartridge/scripts/helpers/pinterest/pinterestConstants');

function htmlHead (pdict) {
    var Site = require('dw/system/Site');
    var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
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

            var pageVisitData = JSON.parse(JSON.stringify(clientEvent));
            if (pageVisitData) {
                pageVisitData.data.event_id = "PAGE_VISIT_" + clientEvent.data.event_id;  
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
                    pinterestLogger.logErrorFromAPIResponse('pinterestConversionService', result, LogSamplingEnums.PINTEREST_CONVERSION_SERVICE_API_FAILURE);
                }
            }

            //render client side event
            velocity.render("$velocity.remoteInclude('Pinterest-HtmlHead', 'email', $email, 'emailHashed', $emailHashed, 'track', $track, 'data', $data, 'pageVisitData', $pageVisitData, 'verificationCode', $verificationCode, 'isEnabledConversionCalls', $isEnabledConversionCalls)",
                {
                    velocity: velocity,
                    email: customerData.email,
                    emailHashed: customerData.emailHashed,
                    track: clientEvent.track ? clientEvent.track : false,
                    data: clientEvent.data ? JSON.stringify(clientEvent.data) : false,
                    pageVisitData: pageVisitData.data ? JSON.stringify(pageVisitData.data) : false,
                    verificationCode: businessAccountConfig.verificationCode,
                    isEnabledConversionCalls: siteCurrent.getCustomPreferenceValue('pinterestEnabledConversionClientsideCalls')
                }
            );
        }
    } catch (e) {
        pinterestLogger.logError('Pinterest error: hook failed, ' + ((e && e.message)? e.message : 'unknown error'), LogSamplingEnums.PINTEREST_CONVERSION_SERVICE_EXCEPTION);
    }
}

module.exports = {
    htmlHead: htmlHead
};
