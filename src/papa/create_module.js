(function(){
	"use strict";

	var create_namespace = require('./create_namespace')
	  , create_mixin = require('./create_mixin')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(papa) {

		setup_registry(papa, '_modules_registry');

		function create_mod_root() {
			var mod = {};
			Object.defineProperty(mod, '_papa', { value: papa });

			mod.Namespace = function(name, createModFn) {
				return create_namespace.Namespace(name, mod, createModFn);
			};

			mod.Mixin = create_mixin(mod);

			return mod;
		}

		return function(modName) {
			var mod = papa._modules_registry.get(modName);
			if (!mod) {
				mod = papa._modules_registry.set(modName, create_mod_root());
			}

			return mod;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
