(function(){
	"use strict";

	var create_module = require('./papa/create_module')
	  , create_mixin = require('./papa/create_mixin')
	  , create_app = require('./papa/create_app')
	  , papa = {

			VERSION: '0.1.3',

			Module: create_module.Module,
			CreateObjPath: create_module.CreateObjPath
		}
	  ;

	Object.defineProperty(papa, '_papa', { value: papa });

	papa.App = create_app(papa);
	papa.Mixin = create_mixin(papa);

	require('./papa/log')(papa);
	require('./papa/events')(papa);
	require('./papa/object_directory.coffee')(papa);

	module.exports = papa;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
