'use strict';

var server = require('server');

var Site = require('dw/system/Site');
var cacheManager = require('dw/system/CacheMgr');
var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');

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
        pageVisitData: req.querystring.pageVisitData,
        verificationCode: req.querystring.verificationCode,
        isEnabledConversionCalls: isEnabledConversionCalls,
        pinterestEnabledGDPR: pinterestEnabledGDPR,
        gdprConsent: gdprConsent
    });

    next();
});


/**
 * Pinterest-BaseCode: Called via Pinterest-HtmlHead in a remote include so user data isn't cached.
 * Controller uses cache for performance.
 */
server.get('BaseCode', server.middleware.include, function (req, res, next) {
    var cache = cacheManager.getCache('CacheForBaseCode');
    var cacheKey = 'pinterest/BaseCode:' + Site.getCurrent().getID();
    var locationHashed = {
        countryHashed: '',
        stateHashed: ''
    };

    var cacheLoader = function () {
        var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig();
        var pinterestEnabledLDP = Site.getCurrent().getCustomPreferenceValue('pinterestEnabledLDP') || false;

        return {
            tagID: businessAccountConfig.info.tag_id,
            pinterestEnabledLDP: pinterestEnabledLDP
        };
    };
    var cachedValue = cache.get(cacheKey, cacheLoader);

    if (cachedValue.pinterestEnabledLDP) {
        locationHashed = pinterestHelpers.getCustomerCountryAndState(req);
    }

    res.render('pinterest/baseCode', {
        tagID: cachedValue.tagID,
        pinterestEnabledLDP: cachedValue.pinterestEnabledLDP,
        locationHashed: locationHashed,
        email: req.querystring.email,
        emailHashed: req.querystring.emailHashed,
        pinterestEnabledGDPR: req.querystring.pinterestEnabledGDPR == 'true' ? true : false,
        gdprConsent: req.querystring.gdprConsent == 'true' ? true : false,
    });

    next();
});

module.exports = server.exports();
