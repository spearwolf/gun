(function(){
	"use strict";

	var create_namespace = require('./gun/create_namespace')
	  , create_mixin = require('./gun/create_mixin')
	  , create_module = require('./gun/create_module')
	  , gun = {

			VERSION: '0.6.0',

			Namespace: create_namespace.Namespace,
			CreateObjPath: create_namespace.CreateObjPath
		}
	  ;

	Object.defineProperty(gun, '_gun', { value: gun });

	require('./gun/log')(gun);

	gun.Module = create_module(gun);
	gun.Mixin = create_mixin(gun);

	require('./gun/events')(gun);
	require('./gun/object_directory.coffee')(gun);

	module.exports = gun;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
