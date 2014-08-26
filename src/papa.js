(function(){
	"use strict";

	var create_module = require('./papa/create_module')
	  , create_mixin = require('./papa/create_mixin')
	  , papa = {

			VERSION: '0.1.3',

			App: require('./papa/create_app'),

			Module: create_module.Module,
			CreateObjPath: create_module.CreateObjPath

		}
	  ;

	papa.Mixin = create_mixin(papa);

	require('./papa/log')(papa);
	require('./papa/object_directory.coffee')(papa);

	module.exports = papa;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
