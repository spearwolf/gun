!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.gun=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_namespace = _dereq_('./gun/create_namespace')
	  , create_mixin = _dereq_('./gun/create_mixin')
	  , create_module = _dereq_('./gun/create_module')
	  , gun = {

			VERSION: '0.4.2',

			Namespace: create_namespace.Namespace,
			CreateObjPath: create_namespace.CreateObjPath
		}
	  ;

	Object.defineProperty(gun, '_gun', { value: gun });

	_dereq_('./gun/log')(gun);

	gun.Module = create_module(gun);
	gun.Mixin = create_mixin(gun);

	_dereq_('./gun/events')(gun);
	_dereq_('./gun/object_directory.coffee')(gun);

	module.exports = gun;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./gun/create_mixin":2,"./gun/create_module":3,"./gun/create_namespace":4,"./gun/events":5,"./gun/log":6,"./gun/object_directory.coffee":7}],2:[function(_dereq_,module,exports){
(function(){
    "use strict";

	var create_namespace = _dereq_('./create_namespace')
	  , setup_registry = _dereq_('./registry')
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

		api.Include = includeMixin;
		api.NewObject = createNewObject;

		return api;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./create_namespace":4,"./registry":8}],3:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_namespace = _dereq_('./create_namespace')
	  , create_mixin = _dereq_('./create_mixin')
	  , setup_registry = _dereq_('./registry')
	  ;

	module.exports = function(gun) {

		setup_registry(gun, '_modules_registry');

		function create_mod_root() {
			var mod = {};
			Object.defineProperty(mod, '_gun', { value: gun });

			mod.Namespace = function(name, createModFn) {
				return create_namespace.Namespace(name, mod, createModFn);
			};

			mod.Mixin = create_mixin(mod);

			return mod;
		}

		return function(modName) {
			var mod = gun._modules_registry.get(modName);
			if (!mod) {
				mod = gun._modules_registry.set(modName, create_mod_root());
			}

			return mod;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./create_mixin":2,"./create_namespace":4,"./registry":8}],4:[function(_dereq_,module,exports){
(function(){
    "use strict";

    var createObjPath = function(name, root, nextCallback) {
        var path = name.split('.');
        var cur = root;
        var i, next;
        for (i = 0; i < path.length - 1; i++) {
            next = path[i];
            if (typeof cur[next] === 'undefined') {
                cur[next] = Object.create(null);
            }
            cur = cur[next];
        }
        next = path[path.length-1];
        if (typeof nextCallback === 'function') {
            nextCallback(cur, next);
        } else {
            if (typeof cur[next] === 'undefined') {
                cur[next] = Object.create(null);
            }
            return cur[next];
        }
    };

    var createNamespace = function(name, root, createModFn) {
        if (arguments.length === 2) {
            createModFn = root;
            root = _dereq_('./root')();
        }
        createObjPath(name, root, function(cur, next) {
            if (typeof createModFn === 'function') {
                if (typeof cur[next] === 'undefined') {
                    cur[next] = {};
                }
                var res = createModFn(cur[next]);
                if (typeof res !== 'undefined') {
                    cur[next] = res;
                }
            } else {
                if (typeof cur[next] === 'undefined') {
                    cur[next] = createModFn;
                } else {
                    throw new Error("could not override object path: " + name);
                }
            }
        });
    };

    module.exports = {
        CreateObjPath: createObjPath,
        Namespace: createNamespace
    };

})();

},{"./root":9}],5:[function(_dereq_,module,exports){
(function(){
    "use strict";

    module.exports = function(gun) {

        gun.Mixin('events', function() {

            return function(o) {

                var callbacks = { _id: 0 };

                o.exports.on = function(eventName, prio, fn) {

                    if (arguments.length === 2) {
                        fn = prio;
                        prio = 0;
                    }

                    var eventListener = callbacks[eventName] || (callbacks[eventName] = [])
                      , fnId = ++callbacks._id
                      ;

                    eventListener.push({ id: fnId, fn: fn, prio: (prio||0) });
                    eventListener.sort(function(a,b){
                        return b.prio - a.prio;
                    });

                    return fnId;
                };

                o.exports.off = function(id) {
                    var cb, i, j, _callbacks, keys = Object.keys(callbacks);
					for (j = 0; j < keys.length; j++) {
						_callbacks = callbacks[keys[j]];
						for (i = 0; i < _callbacks.length; i++) {
							cb = _callbacks[i];
							if (cb.id === id) {
								_callbacks.splice(i, 1);
								return;
							}
						}
                    }
                };

                o.exports.emit = function(eventName /* arguments.. */) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (eventName in callbacks) {
                        callbacks[eventName].forEach(function(cb){
                            cb.fn.apply(o.current, args);
                        });
                    }
                };

            };
        });
    };
})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{}],6:[function(_dereq_,module,exports){
(function(){
    "use strict";

    module.exports = function(gun) {

        var api = gun.Logger = {};

        api.options = {
            DEBUG: true,
            INFO: true,
            WARN: true,
            ERROR: true
        };

        var any_log = function() {
            return api.options.DEBUG || api.options.INFO || api.options.WARN || api.options.ERROR;
        };

        var root = _dereq_('./root')();

        if ('undefined' !== typeof root.console) {

            api.debug = function() {
                if (api.options.DEBUG) console.debug.apply(console, arguments);
            };
            api.info = function() {
                if (api.options.INFO) console.info.apply(console, arguments);
            };
            api.warn = function() {
                if (api.options.WARN) console.warn.apply(console, arguments);
            };
            api.error = function() {
                if (api.options.ERROR) console.error.apply(console, arguments);
            };

            if ('function' === typeof root.console.group) {
                api.group = function(name, fn) {
                    var any = any_log();
                    if (any) console.group(name);
                    fn();
                    if (any) console.groupEnd();
                };
            } else {
                api.group = function(_, fn) {
                    fn();
                };
            }

        } else {

            api.debug = api.info = api.warn = api.error = function(){};
        }
    };

})();
// vim: et ts=4 sts=4 sw=4

},{"./root":9}],7:[function(_dereq_,module,exports){
module.exports = function(gun) {
  return gun.Mixin('object_directory', function() {
    var build_obj_id;
    build_obj_id = function(self, conf) {
      if (self.name) {
        if (conf.objectDirectory.obj_directory[self.name] != null) {
          throw new Error("object name '" + self.name + "' already exists for " + conf.objectTypeName);
        }
        return self.name;
      }
      conf.objectDirectory.cur_obj_id++;
      return "" + conf.objectTypeName + "@" + conf.objectDirectory.cur_obj_id;
    };
    return {
      initialize: function(obj) {
        var finder, _base, _conf;
        (_base = obj.conf).objectDirectory || (_base.objectDirectory = {
          obj_directory: {},
          latest_obj: null,
          cur_obj_id: 0
        });
        obj.self.name = build_obj_id(obj.current, obj.conf);
        _conf = obj.conf.objectDirectory;
        _conf.obj_directory[obj.self.name] = obj.self;
        finder = function(name) {
          return _conf.obj_directory[name];
        };
        if (!_conf.static_finder_created) {
          _conf.static_finder_created = true;
          obj.conf.gun.Namespace(obj.conf.objectTypeName, function(exports) {
            exports.get = finder;
            exports.find = finder;
            exports.latest = function() {
              return _conf.latest_obj;
            };
          });
        }
        return _conf.latest_obj = obj.self;
      }
    };
  });
};



},{}],8:[function(_dereq_,module,exports){
(function(){
    "use strict";

	function Registry(parent) {
		this.parent = parent;
		this.data = new Map();
	}

	Registry.prototype.get = function(key) {
		var val = this.data[key];
		return typeof val === 'undefined' && this.parent ? this.parent.get(key) : val;
	};

	Registry.prototype.findAll = function(key, fromButtomUp) {
		var values = [], _values;

		if (this.parent && !fromButtomUp) {
			values = values.concat(this.parent.findAll(key));
		}

		_values = this.data[key];
		if (Array.isArray(_values)) {
			values = values.concat(_values);
		}

		if (this.parent && fromButtomUp) {
			values = values.concat(this.parent.findAll(key));
		}

		return values;
	};
	
	Registry.prototype.findOne = function(key, fromButtomUp) {
		if (Array.isArray(key)) {
			var i, res;
			for (i = 0; i < key.length; i++) {
				res = this.findOne(key[i], fromButtomUp);
				if (res) return res;
			}
		} else {
			return this.findAll(key, fromButtomUp)[0];
		}
	};

	Registry.prototype.push = function(key, value) {
		var values = this.data[key];
		if (typeof values === 'undefined') {
			values = this.data[key] = [];
		} else {
			if (!Array.isArray(values)) {
				throw new Error('could not push to', typeof values, 'value');
			}
		}
		values.push(value);
		return value;
	};

	Registry.prototype.exists = function(key) {
		return typeof this.get(key) !== 'undefined';
	};

	Registry.prototype.set = function(key, value) {
		this.data[key] = value;
		return value;
	};


	module.exports = function(gun, propName) {
		if (!gun._gun.hasOwnProperty(propName)) {
			Object.defineProperty(gun._gun, propName, { value: new Registry() });
		}
		if (gun._gun !== gun) {
			if (!gun.hasOwnProperty(propName)) {
				Object.defineProperty(gun, propName, { value: new Registry(gun._gun[propName]) });
			}
		}
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{}],9:[function(_dereq_,module,exports){
(function (global){
(function(){
    "use strict";

    module.exports = function() {
        var root;

        try {
            root = window;
        } catch (err) {
        }

        if (typeof root === 'undefined') {
            try {
                root = global;
            } catch (err) {
            }
        }

        if (typeof root === 'undefined') {
            root = this;
        }

        return root;
    };

})();
// vim: et ts=4 sts=4 sw=4

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])
(1)
});