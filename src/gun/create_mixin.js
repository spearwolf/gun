(function(){
    "use strict";

	var create_namespace = require('./create_namespace')
	  , setup_registry = require('./registry')
	  ;

	module.exports = function(gun) {
		var log = gun._gun_.Logger;

		setup_registry(gun, '_gun_mixins_registry_');

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

		var createNewObject = function() { // (objectTypeName || [objectTypeName,..], objInstance)
			var args = Array.prototype.slice.call(arguments, 0);
			var objectTypeName;
			var objInstance = null;

			if (Array.isArray(args[0])) {
				objectTypeName = args.shift();
			} else {
				objectTypeName = [];
				while (typeof args[0] === 'string') {
					objectTypeName.push(args.shift());
				}
			}
			if (args.length > 0) {
				objInstance = args.shift();
			}

			var obj;
			if (typeof objInstance === 'function') {
				if (args.length === 0) {
					obj = new objInstance();
				} else {
					switch (args.length) {
						case 1: obj = new objInstance(args[0]); break;
						case 2: obj = new objInstance(args[0], args[1]); break;
						case 3: obj = new objInstance(args[0], args[1], args[2]); break;
						case 4: obj = new objInstance(args[0], args[1], args[2], args[3]); break;
						case 5: obj = new objInstance(args[0], args[1], args[2], args[3], args[4]); break;
						case 6: obj = new objInstance(args[0], args[1], args[2], args[3], args[4], args[5]); break;
						case 7: obj = new objInstance(args[0], args[1], args[2], args[3], args[4], args[5], args[6]); break;
						case 8: obj = new objInstance(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]); break;
						default: throw "too many (constructor) arguments! please consider to use gun.Inject(..) instead of gun.CreateObject(..)";
					}
				}
			} else {
				obj = Object.create(objInstance);
			}

			if (obj.gun) {
				obj.gun.instance = obj;
			}

			return includeMixin(objectTypeName, obj);
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

		function create_alias_method(_super, _alias, _gun) {
			if (typeof _super === 'undefined') {
				_super = function(){};
			}
			return function() {
				return _alias.apply(_gun.gun.instance, [_super].concat(Array.prototype.slice.call(arguments, 0)));
			};
		}

		function create_gun_instance_method(_method, _gun) {
			return function(){
			   return _method.apply(_gun.gun.instance, arguments);
			};
		}

		function _initialize(objectTypeName, gunInstance, originalObjectTypeName) {
			var exports;
			var instance = gunInstance;

			if (gunInstance.gun && gunInstance.gun.instance) {
				instance = gunInstance.gun.instance;
			}

			var _mixins = gun._gun_mixins_registry_.findAll(objectTypeName);

			if (Array.isArray(_mixins) && _mixins.length > 0) {

				if (!gunInstance.gun) {
					Object.defineProperty(gunInstance, 'gun', {
						value: Object.create(null)
					});
					gunInstance.gun.instance = instance;
					gunInstance.gun.gunInstance = gunInstance;
					gunInstance.gun.kindOf = function(mixinName) {
						if (!gunInstance.gun.mixins) return false;
						return gunInstance.gun.mixins.indexOf(mixinName) > -1;
					};
				}

				if (!gunInstance.gun.mixins) {
					gunInstance.gun.mixins = [objectTypeName];
				} else {
					if (gunInstance.gun.mixins.indexOf(objectTypeName) > -1) {
						return;
					}
					gunInstance.gun.mixins.push(objectTypeName);
				}

				_mixins.forEach(function(mixin) {
					var key, val;

					// dependsOn ========================================== {{{
					if (Array.isArray(mixin.dependsOn)) {
						mixin.dependsOn.forEach(function(_typeName) {
							includeMixin(_typeName, gunInstance, originalObjectTypeName);
						});
					} else if (typeof mixin.dependsOn === 'string') {
						includeMixin(mixin.dependsOn, gunInstance, originalObjectTypeName);
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
							if (mixin.define.hasOwnProperty(key)) {
							   	if ('function' === typeof mixin.define[key]) {
									try {
										instance[key] = mixin.define[key].call(instance, instance);
									} catch (err) {
										log.error(err);
									}
								} else if ('object' === typeof mixin.define[key]) {
									try {
										Object.defineProperty(instance, key, mixin.define[key]);
									} catch (err) {
										log.error(err);
									}
								}
							}
						}
					}
					// ---------------------------------------------------- }}}

					var exports = typeof mixin.namespace === 'string' ? create_namespace.CreateObjectPath(mixin.namespace, gunInstance) : gunInstance;

					// exports ============================================ {{{
					if (typeof mixin.exports === 'object') {
						for (key in mixin.exports) {
							if (mixin.exports.hasOwnProperty(key)) {
								exports[key] = create_gun_instance_method(mixin.exports[key], gunInstance);
							}
						}
					}
					// ---------------------------------------------------- }}}

					// on ================================================= {{{
					if (typeof mixin.on === 'object') {
						if (!instance.gun.kindOf('events')) {
							includeMixin('events', gunInstance, originalObjectTypeName);
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

					// alias_method ======================================= {{{
					//
					// alias_method: {
					//	   foo: function(super, ...) { ... }
					//     foo: ["foo_orig", function(super, ...) {
					//         ...
					//     }]
					// }
					if (typeof mixin.alias_method === 'object') {
						for (key in mixin.alias_method) {
							if (mixin.alias_method.hasOwnProperty(key)) {
								val = typeof mixin.alias_method[key];
								if (Array.isArray(val)) {
									instance[val[0]] = instance[key];
									val = val[1];
								}
								if ('function' === typeof val) {
									instance[key] = create_alias_method(instance[key], val, gunInstance);
								} else if ('undefined' !== typeof val) {
									log.warn("could not alias method", key, 'of', instance, ':', key, " isnt typeof 'function' or 'undefined' (is", typeof val, ")");
								}
							}
						}
					}

					// ---------------------------------------------------- }}}

					// initialize ========================================= {{{
					if (typeof mixin.initialize === 'function') {

						var mixinConf = gun._gun_mixins_registry_.findOne(originalObjectTypeName, true);

						if (!mixinConf) {
							mixinConf = gun._gun_mixins_registry_.findOne(objectTypeName, true);
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

		var api = Object.create(null);
		
		api.Mixin = function(objectTypeName, callback) {

			var mixin = callback();

			if ('function' === typeof mixin) {
				mixin = { initialize: mixin };
			}

			if ('string' !== typeof mixin.objectTypeName) {
				mixin.objectTypeName = objectTypeName;
			}

			gun._gun_mixins_registry_.push(objectTypeName, mixin);

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
		api.CreateObject = createNewObject;

		return api;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
