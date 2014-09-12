(function(){
	"use strict";

	var create_namespace = require('./create_namespace')
	  , create_mixin = require('./create_mixin')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(gun) {

		setup_registry(gun, '_gun_modules_registry_');

		function create_mod_root() {
			var mod = {};
			Object.defineProperty(mod, '_gun_', { value: gun });

			mod.Namespace = function(name, createModFn) {
				return create_namespace.Namespace(name, mod, createModFn);
			};

			mod.Mixin = create_mixin(mod).Mixin;
			mod.Inject = create_mixin(mod).Inject;
			mod.CreateObject = create_mixin(mod).CreateObject;
			mod.Logger = mod._gun_.Logger;

			return mod;
		}

		return function(modName) {
			var mod = gun._gun_modules_registry_.get(modName);
			if (!mod) {
				mod = gun._gun_modules_registry_.set(modName, create_mod_root());
			}

			return mod;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
