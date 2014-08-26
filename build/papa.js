!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.papa=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_module = _dereq_('./papa/create_module')
	  , create_mixin = _dereq_('./papa/create_mixin')
	  , papa = {

			VERSION: '0.1.3',

			App: _dereq_('./papa/create_app'),

			Module: create_module.Module,
			CreateObjPath: create_module.CreateObjPath

		}
	  ;

	papa.Mixin = create_mixin(papa);

	module.exports = papa;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./papa/create_app":2,"./papa/create_mixin":3,"./papa/create_module":4}],2:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_module = _dereq_('./create_module')
	  , create_mixin = _dereq_('./create_mixin')
	  ;

	function create_app_root() {
		var app = {};

		app.Module = function(name, createModFn) {
			return create_module.Module(name, app, createModFn);
		};

		app.Mixin = create_mixin(app);

		return app;
	}

	module.exports = function(appName) {

		var apps_registry = {};

		var app = apps_registry[appName];
		if (!app) {
			app = apps_registry[appName] = create_app_root();
		}

		return app;
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./create_mixin":3,"./create_module":4}],3:[function(_dereq_,module,exports){
(function(){
    "use strict";

	var create_module = _dereq_('./create_module');

	module.exports = function(papa) {

		var mixins = {};

		var includeMixin = function(objectTypeName, instance, originalObjectTypeName) {
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
				return includeMixin(objectTypeName, {});
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
			var arg = {
				self: instance,
				exports: objExports,
				conf: objConf
			};
			Object.defineProperty(arg, 'current', {
				enumerable: true,
				configurable: false,
				get: function() {
					return instance.papa.instance;
				}
			});
			return arg;
		}

		function _initialize(objectTypeName, apiInstance, originalObjectTypeName) {
			var exports;
			var instance = apiInstance;

			if (apiInstance.papa && apiInstance.papa.instance) {
				instance = apiInstance.papa.instance;
			}

			var _mixins = mixins[objectTypeName];
			if (Array.isArray(_mixins) && _mixins.length > 0) {

				if (!apiInstance.papa) {
					Object.defineProperty(apiInstance, 'papa', {
						enumerable: false,
						configurable: false,
						writable: false,
						value: {}
					});
					apiInstance.papa.instance = instance;
					apiInstance.papa.apiInstance = apiInstance;
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
							var mixinConf = mixins[originalObjectTypeName];
							if (Array.isArray(mixinConf)) {
								mixinConf = mixinConf[0];
							}
							if (!mixinConf.app) {
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

			if (!Array.isArray(mixins[objectTypeName])) {
				mixins[objectTypeName] = [];
			}

			var mixin = callback();
			if ('object' === typeof mixin) {
				mixin.objectTypeName = objectTypeName;
			}

			mixins[objectTypeName].push(mixin);

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

},{"./create_module":4}],4:[function(_dereq_,module,exports){
(function (global){
(function(){
    "use strict";

    var createObjPath = function(name, root, nextCallback) {
        var path = name.split('.');
        var cur = root;
        var i, next;
        for (i = 0; i < path.length - 1; i++) {
            next = path[i];
            if (typeof cur[next] === 'undefined') {
                cur[next] = {};
            }
            cur = cur[next];
        }
        next = path[path.length-1];
        if (typeof nextCallback === 'function') {
            nextCallback(cur, next);
        } else {
            if (typeof cur[next] === 'undefined') {
                cur[next] = {};
            }
            return cur[next];
        }
    };

    var createModule = function(name, root, createModFn) {
        if (arguments.length === 2) {
            createModFn = root;
            root = window || global || this;
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
        Module: createModule
    };

})();

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1])
(1)
});