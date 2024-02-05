'use strict';

//https://developers.pinterest.com/docs/api/v5/

module.exports = require('dw/svc/LocalServiceRegistry').createService('pinterest.catalog.feeds', {
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
        var pinterestHelpers = require('*/cartridge/scripts/helpers/pinterest/pinterestHelper');
        var businessAccountConfig = pinterestHelpers.getBusinessAccountConfig();

        svc.addHeader('charset', 'UTF-8');
        svc.addHeader('Content-type', 'application/json');
        svc.addHeader('Authorization', 'Bearer ' + businessAccountConfig.tokenData.access_token);
        svc.setAuthentication('NONE');
        svc.addParam('ad_account_id', businessAccountConfig.info.advertiser_id);

        //check and see if the url changes from previous calls persisted and then undo them...
        var urlPartsArray = svc.getURL().split('/');
        if (urlPartsArray.length === 7) {
            urlPartsArray.pop();
        }
        svc.setURL(urlPartsArray.join('/'))

        if (data && data.action === 'delete') {
            svc.setRequestMethod('DELETE');
            svc.setURL(svc.getURL() + '/' + data.feed_id);
        } else if (data && data.action === 'add') {
            svc.setRequestMethod('POST');
        } else if (data && data.action === 'update') {
            svc.setRequestMethod('PATCH');
            svc.setURL(svc.getURL() + '/' + data.feed_id);
        } else {
            svc.setRequestMethod('GET');
        }

        if (data && data.action === 'add') {
            delete data.action;
            data = JSON.stringify(data);

            return data;
        } else if (data && data.action === 'update') {
            delete data.action;
            delete data.feed_id;
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
