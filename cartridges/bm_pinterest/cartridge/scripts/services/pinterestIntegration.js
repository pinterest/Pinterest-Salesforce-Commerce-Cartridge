//https://developers.pinterest.com/docs/api/v5/

module.exports = require('dw/svc/LocalServiceRegistry').createService('pinterest.integration', {
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
        svc.addHeader('charset', 'UTF-8');
        svc.addHeader('Content-type', 'application/json');
        svc.setAuthentication('NONE');

        if (data.action === 'delete') {
            var pinterestBMHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
            var businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
            svc.addHeader('Authorization', 'Bearer ' + businessAccountConfig.tokenData.access_token);
            svc.setRequestMethod('DELETE');
            svc.setURL(svc.getURL() + '/' + data.external_business_id);
        } else if (data.action === 'add') {
            svc.addHeader('Authorization', 'Bearer ' + data.partner_access_token);
            svc.setRequestMethod('POST');
        } else if (data.action === 'update') {
            pinterestBMHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
            businessAccountConfig = pinterestBMHelpers.getBusinessAccountConfig();
            svc.addHeader('Authorization', 'Bearer ' + businessAccountConfig.tokenData.access_token);
            svc.setRequestMethod('PATCH');
            svc.setURL(svc.getURL() + '/' + data.external_business_id);
        }

        if (data) {
            delete data.action;
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
