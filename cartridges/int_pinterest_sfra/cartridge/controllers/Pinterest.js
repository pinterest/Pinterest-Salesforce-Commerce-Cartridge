'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var cache = require('*/cartridge/scripts/middleware/cache');
var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');

/**
 * Pinterest-HtmlHead: Called via the app.template.htmlHead hook
 * renders base code and event codes 
 */
server.get('HtmlHead', server.middleware.include, function (req, res, next) {
    var isEnabledConversionCalls = req.querystring.isEnabledConversionCalls == 'true' ? true : false;
    var pinterestEnabledGDPR = Site.getCurrent().getCustomPreferenceValue('pinterestEnabledGDPR') || false;
    var gdprConsent = req.session.privacyCache.get('consent') || false;

    res.render('pinterest/htmlHead', {
        email: req.querystring.email,
        emailHashed: req.querystring.emailHashed,
        track: req.querystring.track,
        data: req.querystring.data,
        verificationCode: req.querystring.verificationCode,
        isEnabledConversionCalls: isEnabledConversionCalls,
        pinterestEnabledGDPR: pinterestEnabledGDPR,
        gdprConsent: gdprConsent
    });

    next();
});

/**
 * Pinterest-BaseCode: Called via Pinterest-HtmlHead in a remote include so user data isn't cached
 */
server.get('BaseCode', server.middleware.include, function (req, res, next) {
    var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig();

    res.render('pinterest/baseCode', {
        tagID: businessAccountConfig.info['tag_id'],
        email: req.querystring.email,
        emailHashed: req.querystring.emailHashed,
        pinterestEnabledGDPR: req.querystring.pinterestEnabledGDPR == 'true' ? true : false,
        gdprConsent: req.querystring.gdprConsent == 'true' ? true : false
    });

    next();
});

module.exports = server.exports();
