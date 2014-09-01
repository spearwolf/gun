(function(){
    "use strict";

	var create_module = require('./create_module')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(papa) {
		var log = papa._papa.Logger;

		setup_registry(papa, '_mixins_registry');

		var includeMixin = function(objectTypeName, instance, originalObjectTypeName) {
			if (Array.isArray(originalObjectTypeName)) {
				originalObjectTypeName = originalObjectTypeName[0];
			}
			if (Array.isArray(objectTypeName)) {
				objectTypeName.forEach(function(typeName) {
					_initialize(typeName, instance, originalObjectTypeName || objectTypeName);
				});
			} else {
				_initialize(objectTypeName, instance, originalObjectTypeName || objectTypeName);
			}
			return instance;
		};

		var createNewObject = function(objectTypeName, objInstance, newScopeInheritance) {
			if (typeof objInstance === 'undefined') {
				return includeMixin(objectTypeName, Object.create(null));
			} else {
				var obj;
				if (newScopeInheritance === false) {
					obj = objInstance;
				} else {
					obj = Object.create(objInstance);
					if (obj.papa) {
						obj.papa.instance = obj;
					}
				}
				return includeMixin(objectTypeName, obj);
			}
		};

		function mixin_args(instance, objExports, objConf) {
			return Object.create(null, {
				self: {
					enumerable: true,
				   	value: instance },
				exports: {
					enumerable: true,
				   	value: objExports },
				conf: {
					enumerable: true,
				   	value: objConf },
				current: {
					enumerable: true,
					get: function() {
						return instance.papa.instance;
					} }
			});
		}

		function _initialize(objectTypeName, apiInstance, originalObjectTypeName) {
			var exports;
			var instance = apiInstance;

			if (apiInstance.papa && apiInstance.papa.instance) {
				instance = apiInstance.papa.instance;
			}

			var _mixins = papa._mixins_registry.findAll(objectTypeName);
			if (Array.isArray(_mixins) && _mixins.length > 0) {

				if (!apiInstance.papa) {
					Object.defineProperty(apiInstance, 'papa', {
						value: Object.create(null)
					});
					apiInstance.papa.instance = instance;
					apiInstance.papa.apiInstance = apiInstance;
					apiInstance.papa.kindOf = function(mixinName) {
						if (!apiInstance.papa.mixins) return false;
						return apiInstance.papa.mixins.indexOf(mixinName) > -1;
					};
				}
				if (!apiInstance.papa.mixins) {
					apiInstance.papa.mixins = [objectTypeName];
				} else {
					if (apiInstance.papa.mixins.indexOf(objectTypeName) > -1) {
						return;
					}
					apiInstance.papa.mixins.push(objectTypeName);
				}

				_mixins.forEach(function(mixin) {
					if (typeof mixin === 'function') {
						mixin(mixin_args(instance, apiInstance));
					} else if (typeof mixin === 'object') {

						// dependsOn
						if (Array.isArray(mixin.dependsOn)) {
							mixin.dependsOn.forEach(function(_typeName) {
								includeMixin(_typeName, apiInstance, originalObjectTypeName);
							});
						} else if (typeof mixin.dependsOn === 'string') {
							includeMixin(mixin.dependsOn, apiInstance, originalObjectTypeName);
						}

						// initialize
						if (typeof mixin.initialize === 'function') {
							var mixinConf = papa._mixins_registry.findOne(originalObjectTypeName, true);
							if (!mixinConf) {
								mixinConf = papa._mixins_registry.findOne(objectTypeName, true);
							}
							if (mixinConf && !mixinConf.app) {
								mixinConf.app = papa;
							}
							if (typeof mixin.namespace === 'string') {
								exports = create_module.CreateObjPath(mixin.namespace, apiInstance);
								mixin.initialize(mixin_args(instance, exports, mixinConf));
							} else {
								mixin.initialize(mixin_args(instance, apiInstance, mixinConf));
							}
						}
					}
				});
			}
		}

		var api = function(objectTypeName, callback) {

			var mixin = callback();
			if ('function' === typeof mixin) {
				mixin = { initialize: mixin };
			}
			mixin.objectTypeName = objectTypeName;

			papa._mixins_registry.push(objectTypeName, mixin);

			// factory
			if (mixin.factory) {
				papa.Module(('string' === typeof mixin.factory ? mixin.factory : objectTypeName + ".create"), function() {
					return function(obj) {
						return createNewObject(objectTypeName, obj);
					};
				});
			}
		};

		api.Include = includeMixin;
		api.NewObject = createNewObject;

		return api;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
