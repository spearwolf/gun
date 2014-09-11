(function(){
	"use strict";

	var create_namespace = require('./create_namespace')
	  , create_mixin = require('./create_mixin')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(gun) {

		setup_registry(gun, '_modules_registry');

		function create_mod_root() {
			var mod = {};
			Object.defineProperty(mod, '_gun', { value: gun });

			mod.Namespace = function(name, createModFn) {
				return create_namespace.Namespace(name, mod, createModFn);
			};

			mod.Mixin = create_mixin(mod);

			return mod;
		}

		return function(modName) {
			var mod = gun._modules_registry.get(modName);
			if (!mod) {
				mod = gun._modules_registry.set(modName, create_mod_root());
			}

			return mod;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
