(function(){
	"use strict";

	var create_module = require('./create_module')
	  , create_mixin = require('./create_mixin')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(papa) {

		setup_registry(papa, '_apps_registry');

		function create_app_root() {
			var app = {};
			Object.defineProperty(app, '_papa', { value: papa });

			app.Module = function(name, createModFn) {
				return create_module.Module(name, app, createModFn);
			};

			app.Mixin = create_mixin(app);

			return app;
		}

		return function(appName) {
			var app = papa._apps_registry.get(appName);
			if (!app) {
				app = papa._apps_registry.set(appName, create_app_root());
			}

			return app;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
