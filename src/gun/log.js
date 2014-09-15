(function(){
    "use strict";

    module.exports = function(gun) {

        var api = gun.Logger = {};

        api.options = {
            DEBUG: true,
            INFO: true,
            WARN: true,
            ERROR: true
        };

        var any_log = function() {
            return api.options.DEBUG || api.options.INFO || api.options.WARN || api.options.ERROR;
        };

        var root = require('./root')();

        if ('undefined' !== typeof root.console) {

            api.debug = function() {
                if (api.options.DEBUG) root.console.debug.apply(root.console, arguments);
            };
            api.info = function() {
                if (api.options.INFO) root.console.info.apply(root.console, arguments);
            };
            api.warn = function() {
                if (api.options.WARN) root.console.warn.apply(root.console, arguments);
            };
            api.error = function() {
                if (api.options.ERROR) root.console.error.apply(root.console, arguments);
            };

            if ('function' === typeof root.console.group) {
                api.group = function(name, fn) {
                    var any = any_log();
                    if (any) root.console.group(name);
                    fn();
                    if (any) root.console.groupEnd();
                };
            } else {
                api.group = function(_, fn) {
                    fn();
                };
            }

        } else {

            api.debug = api.info = api.warn = api.error = function(){};
        }
    };

})();
// vim: et ts=4 sts=4 sw=4
