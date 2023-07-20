//https://developers.pinterest.com/docs/api/v5/

module.exports = require('dw/svc/LocalServiceRegistry').createService('pinterest.oauth', {
    /**
     * Create the service request
     * - Set request method to be the HTTP GET method
     * - Construct request URL
     * - Append the request HTTP query string as a URL parameter
     *
     * @param {dw.svc.HTTPService} svc - HTTP Service instance
     * @param {Object} params - Additional paramaters
     * @returns {void}
     */
    createRequest: function (svc, data) {
        var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelpers');
        var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig();
        var url = svc.getURL() + '/token';
        var urlData = '';

        svc.addHeader('charset', 'UTF-8');
        svc.addHeader('Content-type', 'application/x-www-form-urlencoded');
        svc.addHeader('Authorization', 'Basic ' + businessAccountConfig.info.clientHash);
        svc.setAuthentication('NONE');
        svc.setRequestMethod('POST');
        svc.setURL(url);

        if (data) {
            if (data['scope']) {
                data['scope'] = data['scope'].replace(' ', ',');
            }

            for (var key in data) {
                urlData = urlData + (urlData !== ''? '&' : '') + key + '=' + data[key];
            }

            return urlData;
        }

        return null;
    },
    /**
     * JSON parse the response text and return it in configured retData object
     *
     * @param {dw.svc.HTTPService} svc - HTTP Service instance
     * @param {dw.net.HTTPClient} client - HTTPClient class instance of the current service
     * @returns {Object} retData - Service response object
     */
    parseResponse: function (svc, client) {
        return client.text;
    },

    getRequestLogMessage: function () {
        var reqLogMsg = 'sending payload';
        return reqLogMsg;
    },

    getResponseLogMessage: function () {}

});
