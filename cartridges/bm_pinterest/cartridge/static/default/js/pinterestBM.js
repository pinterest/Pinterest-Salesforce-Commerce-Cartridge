/* eslint-disable no-unused-vars */
var pinterestAppConnectPopupClose = function(e) {
    if (e) {
        e.preventDefault();
    }
    window.close();
};

var pinterestAppConnectPopupCloseAndRefreshOpener = function(e) {
    if (e) {
        e.preventDefault();
    }

    if (window.opener && window.opener.parent) {
        var openerParent = window.opener.parent;
        var openerParentURL = new URL(openerParent.location.href);
        var openerParentURLParams = new URLSearchParams(openerParentURL.search);
        openerParentURLParams.delete('disconnectPinterest');
        openerParent.location = openerParentURL.origin + openerParentURL.pathname + '?' + openerParentURLParams.toString();
    }
    window.close();
};
