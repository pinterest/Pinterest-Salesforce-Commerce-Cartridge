var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var URLAction = require('dw/web/URLAction');

function getAllSites() {

    var pinterestUserWebsitesService = require('*/cartridge/scripts/services/pinterestUserWebsites');
    var apiSitesObject = {};
    var apiSitesVerified = [];
    var apiSitesNotVerified = [];

    var resultWebsites = pinterestUserWebsitesService.call();
    if (resultWebsites.ok) {
        apiSitesObject = JSON.parse(resultWebsites.object);
        apiSitesObject.items.forEach(item => {
            if (item.status === 'verified') {
                apiSitesVerified.push(item.website);
            } else {
                apiSitesNotVerified.push(item.website);
            }
        });
    }
    var site = Site.getCurrent();
    var allSitesData = [];
    var locales = site.allowedLocales.toArray();

    locales.forEach(locale => {
        if (locale != 'default' && locales.length > 1) {
            request.setLocale(locale);

            var homeURL = URLUtils.https(URLAction('Home-Show', site.name, locale)).toString().replace('https://', '').split('/');
            var hostname = homeURL[0];

            var isDW = hostname.indexOf('.demandware.net') !== -1? true : false;
            var isSF = hostname.indexOf('.salesforce.com') !== -1? true : false;

            if (isDW || isSF) {
                hostname = hostname + '/s/' + site.ID;
            }

            var isVerified = apiSitesVerified.indexOf(hostname) !== -1? true : false;

            if (!isVerified) {
                allSitesData.push({
                    isVerified: isVerified,
                    ID: site.ID,
                    name: site.name,
                    httpsHostName: site.httpsHostName,
                    locale: locale,
                    urlPart: hostname,
                    url: 'https://' + hostname
                });
            }
        }
    });

    request.setLocale('default');

    return {
        allSitesData: allSitesData,
        apiSitesVerified: apiSitesVerified,
        apiSitesNotVerified: apiSitesNotVerified
    };
};

module.exports = {
    getAllSites: getAllSites
};
