(function(){
    "use strict";

	var create_namespace = require('./create_namespace')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(gun) {
		var log = gun._gun.Logger;

		setup_registry(gun, '_mixins_registry');

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
					if (obj.gun) {
						obj.gun.instance = obj;
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
						return instance.gun.instance;
					} }
			});
		}

		function _initialize(objectTypeName, apiInstance, originalObjectTypeName) {
			var exports;
			var instance = apiInstance;

			if (apiInstance.gun && apiInstance.gun.instance) {
				instance = apiInstance.gun.instance;
			}

			var _mixins = gun._mixins_registry.findAll(objectTypeName);

			if (Array.isArray(_mixins) && _mixins.length > 0) {

				if (!apiInstance.gun) {
					Object.defineProperty(apiInstance, 'gun', {
						value: Object.create(null)
					});
					apiInstance.gun.instance = instance;
					apiInstance.gun.apiInstance = apiInstance;
					apiInstance.gun.kindOf = function(mixinName) {
						if (!apiInstance.gun.mixins) return false;
						return apiInstance.gun.mixins.indexOf(mixinName) > -1;
					};
				}

				if (!apiInstance.gun.mixins) {
					apiInstance.gun.mixins = [objectTypeName];
				} else {
					if (apiInstance.gun.mixins.indexOf(objectTypeName) > -1) {
						return;
					}
					apiInstance.gun.mixins.push(objectTypeName);
				}

				_mixins.forEach(function(mixin) {
					var key, val;

					// dependsOn ========================================== {{{
					if (Array.isArray(mixin.dependsOn)) {
						mixin.dependsOn.forEach(function(_typeName) {
							includeMixin(_typeName, apiInstance, originalObjectTypeName);
						});
					} else if (typeof mixin.dependsOn === 'string') {
						includeMixin(mixin.dependsOn, apiInstance, originalObjectTypeName);
					}
					// ---------------------------------------------------- }}}

					// defaults =========================================== {{{
					if (typeof mixin.defaults === 'object') {
						for (key in mixin.defaults) {
							if (mixin.defaults.hasOwnProperty(key) && 'undefined' === typeof instance[key]) {
							   	if ('function' === typeof mixin.defaults[key]) {
									try {
										val = mixin.defaults[key].call(instance, instance);
									} catch (err) {
										log.error(err);
									}
								} else {
									val = mixin.defaults[key];
								}
								instance[key] = val;
							}
						}
					}
					// ---------------------------------------------------- }}}

					// define ============================================= {{{
					if (typeof mixin.define === 'object') {
						for (key in mixin.define) {
							if (mixin.define.hasOwnProperty(key) && 'function' === typeof mixin.define[key]) {
								try {
									instance[key] = mixin.define[key].call(instance, instance);
								} catch (err) {
									log.error(err);
								}
							}
						}
					}
					// ---------------------------------------------------- }}}

					var exports = typeof mixin.namespace === 'string' ? create_namespace.CreateObjPath(mixin.namespace, apiInstance) : apiInstance;

					// exports ============================================ {{{
					// jshint ignore:start
					if (typeof mixin.exports === 'object') {
						for (key in mixin.exports) {
							if (mixin.exports.hasOwnProperty(key)) {
								exports[key] = (function(_method, _api){
									return function(){
									   return _method.apply(_api.gun.instance, arguments);
									};
								})(mixin.exports[key], apiInstance);
							}
						}
					}
					// jshint ignore:end
					// ---------------------------------------------------- }}}

					// on ================================================= {{{
					if (typeof mixin.on === 'object') {
						if (!instance.gun.kindOf('events')) {
							includeMixin('events', apiInstance, originalObjectTypeName);
						}
						for (key in mixin.on) {
							if (mixin.on.hasOwnProperty(key)) {
								if ('function' === typeof mixin.on[key]) {
									instance.on(key, mixin.on[key]);
								} else if (Array.isArray(mixin.on[key])) {
									instance.on(key, mixin.on[key][0], mixin.on[key][1]);
								}
							}
						}
					}
					// ---------------------------------------------------- }}}

					// TODO
					//
					// alias_method: {
					//	   foo: function(super, ...) { ... }
					//     foo: ["foo_orig", function(super, ...) {
					//         ...
					//     }]
					// }

					// initialize ========================================= {{{
					if (typeof mixin.initialize === 'function') {

						var mixinConf = gun._mixins_registry.findOne(originalObjectTypeName, true);

						if (!mixinConf) {
							mixinConf = gun._mixins_registry.findOne(objectTypeName, true);
						}

						if (mixinConf && !mixinConf.gun) {
							mixinConf.gun = gun;
						}

						try {
							mixin.initialize.call(instance, mixin_args(instance, exports, mixinConf));
						} catch (err) {
							log.error(err);
						}
					}
					// ---------------------------------------------------- }}}

				});  // for each mixin
			}
		}

		var api = function(objectTypeName, callback) {

			var mixin = callback();

			if ('function' === typeof mixin) {
				mixin = { initialize: mixin };
			}

			if ('string' !== typeof mixin.objectTypeName) {
				mixin.objectTypeName = objectTypeName;
			}

			gun._mixins_registry.push(objectTypeName, mixin);

			// factory
			if (mixin.factory) {
				gun.Namespace(('string' === typeof mixin.factory ? mixin.factory : objectTypeName + ".create"), function() {
					return function(obj) {
						return createNewObject(objectTypeName, obj);
					};
				});
			}
		};

		api.Inject = includeMixin;
		api.NewObject = createNewObject;

		return api;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
