//https://developers.pinterest.com/docs/api/v5/

module.exports = require('dw/svc/LocalServiceRegistry').createService('pinterest.verification', {
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
        var pinterestBMHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestBMHelpers');
        var businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
        var url = svc.getURL();

        svc.addHeader('charset', 'UTF-8');
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Authorization', 'Bearer ' + businessAccountConfig.tokenData.access_token);
        svc.setAuthentication('NONE');
        svc.setRequestMethod('GET');
        svc.setURL(url);

        if (data) {
            data = JSON.stringify(data);

            return data;
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
