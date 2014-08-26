(function(){
    "use strict";

    module.exports = function(papa) {

        var api = papa.Logger = {};

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
                if (api.options.DEBUG) console.debug.apply(console, arguments);
            };
            api.info = function() {
                if (api.options.INFO) console.info.apply(console, arguments);
            };
            api.warn = function() {
                if (api.options.WARN) console.warn.apply(console, arguments);
            };
            api.error = function() {
                if (api.options.ERROR) console.error.apply(console, arguments);
            };

            if ('function' === typeof root.console.group) {
                api.group = function(name, fn) {
                    var any = any_log();
                    if (any) console.group(name);
                    fn();
                    if (any) console.groupEnd();
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
