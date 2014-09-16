(function(){
    "use strict";

    module.exports = function(gun) {

        var api = gun.Logger = Object.create(null);
        var root = require('./root')();

        api.options = {
            //DEBUG: true,
            //INFO: true,
            //WARN: true,
            //ERROR: true
        };

        Object.defineProperty(api.options, 'DEBUG', {
            get: function(){ return this._DEBUG; },
            set: function(enable){
                this._DEBUG = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.debug) {
                    api.debug = con.debug.bind(con);
                } else {
                    api.debug = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'INFO', {
            get: function(){ return this._INFO; },
            set: function(enable){
                this._INFO = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.info) {
                    api.info = con.info.bind(con);
                } else {
                    api.info = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'WARN', {
            get: function(){ return this._WARN; },
            set: function(enable){
                this._WARN = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.warn) {
                    api.warn = con.warn.bind(con);
                } else {
                    api.warn = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'ERROR', {
            get: function(){ return this._ERROR; },
            set: function(enable){
                this._ERROR = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.error) {
                    api.error = con.error.bind(con);
                } else {
                    api.error = function(){};
                }
            }
        });

        api.options.DEBUG = true;
        api.options.INFO = true;
        api.options.WARN = true;
        api.options.ERROR = true;
    };
})();
// vim: et ts=4 sts=4 sw=4
