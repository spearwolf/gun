(function(){
	"use strict";

	var create_module = require('./create_module')
	  , create_mixin = require('./create_mixin')
	  ;

	function create_app_root() {
		var app = {};

		app.Module = function(name, createModFn) {
			return create_module.Module(name, app, createModFn);
		};

		app.Mixin = create_mixin(app);

		return app;
	}

	module.exports = function(appName) {

		var apps_registry = {};

		var app = apps_registry[appName];
		if (!app) {
			app = apps_registry[appName] = create_app_root();
		}

		return app;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
