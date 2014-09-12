(function(){
	"use strict";

	var create_namespace = require('./gun/create_namespace')
	  , create_mixin = require('./gun/create_mixin')
	  , create_module = require('./gun/create_module')
	  , gun = {

			VERSION: '0.6.1',

			Namespace: create_namespace.Namespace,
			CreateObjectPath: create_namespace.CreateObjectPath
		}
	  ;

	Object.defineProperty(gun, '_gun_', { value: gun });

	require('./gun/log')(gun);

	gun.Module = create_module(gun);
	gun.Mixin = create_mixin(gun).Mixin;
	gun.Inject = create_mixin(gun).Inject;
	gun.CreateObject = create_mixin(gun).CreateObject;

	require('./gun/events')(gun);
	require('./gun/object_directory.coffee')(gun);

	module.exports = gun;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
