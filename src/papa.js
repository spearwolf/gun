(function(){
	"use strict";

	var create_namespace = require('./papa/create_namespace')
	  , create_mixin = require('./papa/create_mixin')
	  , create_app = require('./papa/create_app')
	  , papa = {

			VERSION: '0.2.0',

			Namespace: create_namespace.Namespace,
			CreateObjPath: create_namespace.CreateObjPath
		}
	  ;

	Object.defineProperty(papa, '_papa', { value: papa });

	require('./papa/log')(papa);

	papa.App = create_app(papa);
	papa.Mixin = create_mixin(papa);

	require('./papa/events')(papa);
	require('./papa/object_directory.coffee')(papa);

	module.exports = papa;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
