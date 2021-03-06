!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.gun=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_namespace = _dereq_('./gun/create_namespace')
	  , create_mixin = _dereq_('./gun/create_mixin')
	  , create_module = _dereq_('./gun/create_module')
	  , hijack = _dereq_('./gun/hijack')
	  , gun = {

			VERSION: '0.7.1',

			Namespace: create_namespace.Namespace,
			CreateObjectPath: create_namespace.CreateObjectPath
		}
	  ;

	Object.defineProperty(gun, '_gun_', { value: gun });

	_dereq_('./gun/log')(gun);

	gun.Module = create_module(gun);
	gun.Mixin = create_mixin(gun).Mixin;
	gun.Inject = create_mixin(gun).Inject;
	gun.CreateObject = create_mixin(gun).CreateObject;
	gun.Hijack = hijack(gun);

	_dereq_('./gun/events')(gun);
	_dereq_('./gun/object_directory.coffee')(gun);

	module.exports = gun;

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./gun/create_mixin":2,"./gun/create_module":3,"./gun/create_namespace":4,"./gun/events":5,"./gun/hijack":6,"./gun/log":7,"./gun/object_directory.coffee":9}],2:[function(_dereq_,module,exports){
(function(){
    "use strict";

    var create_namespace = _dereq_('./create_namespace')
      , setup_registry = _dereq_('./registry')
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
            var objInstance = Object;

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
                    args.unshift(undefined);
                    obj = new(objInstance.bind.apply(objInstance, args));
                }
            } else {
                obj = Object.create(objInstance);
            }

            return includeMixin(objectTypeName, obj);
        };

        function create_alias_method(_super, _alias, _instance) {
            if (typeof _super === 'undefined') {
                _super = function(){};
            }
            return _alias.bind(_instance, _super.bind(_instance));
        }

        function _initialize(objectTypeName, instance, originalObjectTypeName) {
            var _mixins = gun._gun_mixins_registry_.findAll(objectTypeName);

            if (Array.isArray(_mixins) && _mixins.length > 0) {

                if (!Object.hasOwnProperty.call(instance, '_gun_')) {

                    Object.defineProperty(instance, '_gun_', {
                        value: Object.create(null)
                    });
                    instance._gun_.instance = instance;
                    instance._gun_.kindOf = function(mixinName) {
                        var found = !instance._gun_.mixins ? false : instance._gun_.mixins.indexOf(mixinName) > -1;
                        if (!found) {
                            var proto = Object.getPrototypeOf(instance);
                            if (proto && proto._gun_ && 'function' === typeof proto._gun_.kindOf) {
                                found = proto._gun_.kindOf(mixinName);
                            }
                        }
                        return found;
                    };
                }

                if (instance._gun_.kindOf(objectTypeName)) {
                    return;
                } else {
                    if (!instance._gun_.mixins) {
                        instance._gun_.mixins = [objectTypeName];
                    } else {
                        instance._gun_.mixins.push(objectTypeName);
                    }
                }

                _mixins.forEach(function(mixin) {
                    var key, val;

                    // dependsOn ========================================== {{{
                    if (Array.isArray(mixin.dependsOn)) {
                        mixin.dependsOn.forEach(function(_typeName) {
                            includeMixin(_typeName, instance, originalObjectTypeName);
                        });
                    } else if (typeof mixin.dependsOn === 'string') {
                        includeMixin(mixin.dependsOn, instance, originalObjectTypeName);
                    }
                    // ---------------------------------------------------- }}}

                    // defaultValues ====================================== {{{
                    if (typeof mixin.defaultValues === 'object') {
                        for (key in mixin.defaultValues) {
                            if (mixin.defaultValues.hasOwnProperty(key) && 'undefined' === typeof instance[key]) {
                                if ('function' === typeof mixin.defaultValues[key]) {
                                    try {
                                        val = mixin.defaultValues[key].call(instance, instance);
                                    } catch (err) {
                                        log.error(err);
                                    }
                                } else {
                                    val = mixin.defaultValues[key];
                                }
                                instance[key] = val;
                            }
                        }
                    }
                    // ---------------------------------------------------- }}}

                    // defineProperties =================================== {{{
                    if (typeof mixin.defineProperties === 'object') {
                        for (key in mixin.defineProperties) {
                            if (mixin.defineProperties.hasOwnProperty(key)) {
                                if ('function' === typeof mixin.defineProperties[key]) {
                                    try {
                                        instance[key] = mixin.defineProperties[key].call(instance, instance);
                                    } catch (err) {
                                        log.error(err);
                                    }
                                } else if ('object' === typeof mixin.defineProperties[key]) {
                                    try {
                                        Object.defineProperty(instance, key, mixin.defineProperties[key]);
                                    } catch (err) {
                                        log.error(err);
                                    }
                                }
                            }
                        }
                    }
                    // ---------------------------------------------------- }}}

                    // exportsNamespace =================================== {{{
                    var exports = typeof mixin.exportsNamespace === 'string' ?
                            create_namespace.CreateObjectPath(mixin.exportsNamespace, instance)
                            : instance;
                    // ---------------------------------------------------- }}}

                    // exports ============================================ {{{
                    if (typeof mixin.exports === 'object') {
                        for (key in mixin.exports) {
                            if (mixin.exports.hasOwnProperty(key)) {
                                exports[key] = mixin.exports[key].bind(instance);
                            }
                        }
                    }
                    // ---------------------------------------------------- }}}

                    // on ================================================= {{{
                    if (typeof mixin.on === 'object') {
                        if (!instance._gun_.kindOf('events')) {
                            includeMixin('events', instance, originalObjectTypeName);
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

                    // aliasMethod ======================================== {{{
                    //
                    // aliasMethod: {
                    //     foo: function(super, ...) { ... }
                    //     foo: ["foo_orig", function(super, ...) {
                    //         ...
                    //     }]
                    // }
                    if (typeof mixin.aliasMethod === 'object') {
                        for (key in mixin.aliasMethod) {
                            if (mixin.aliasMethod.hasOwnProperty(key)) {
                                val = mixin.aliasMethod[key];
                                if ('string' !== typeof val && Array.isArray(val)) {
                                    instance[val[0]] = instance[key];
                                    val = val[1];
                                }
                                if ('function' === typeof val) {
                                    instance[key] = create_alias_method(instance[key], val, instance);
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

                        if (!mixinConf.gun) {
                            mixinConf.gun = gun;
                        }

                        try {
                            mixin.initialize.call(instance, instance, mixinConf);
                        } catch (err) {
                            log.error(err);
                        }
                    }
                    // ---------------------------------------------------- }}}

                });  // for each mixin

            } else {
                throw "Mixin not found: " + (Array.isArray(objectTypeName) ? objectTypeName.join(',') : objectTypeName);
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
                    return createNewObject.bind(gun, objectTypeName);
                });
            }
        };

        api.Inject = includeMixin;
        api.CreateObject = createNewObject;

        return api;
    };

})();
// vim: set expandtab:sts=4:ts=4:sw=4:

},{"./create_namespace":4,"./registry":10}],3:[function(_dereq_,module,exports){
(function(){
	"use strict";

	var create_namespace = _dereq_('./create_namespace')
	  , create_mixin = _dereq_('./create_mixin')
	  , setup_registry = _dereq_('./registry')
	  , hijack = _dereq_('./hijack')
	  ;

	module.exports = function(gun) {

		setup_registry(gun, '_gun_modules_registry_');

		function create_mod_root(mod) {
			
			if (typeof mod === 'undefined') {
				mod = {};
			}

			Object.defineProperty(mod, '_gun_', { value: gun });

			mod.Namespace = function(name, createModFn) {
				return create_namespace.Namespace(name, mod, createModFn);
			};

			mod.Mixin = create_mixin(mod).Mixin;
			mod.Inject = create_mixin(mod).Inject;
			mod.CreateObject = create_mixin(mod).CreateObject;
			mod.Hijack = hijack(mod);
			mod.Logger = mod._gun_.Logger;

			return mod;
		}

		return function(modName, root) {
			var mod = gun._gun_modules_registry_.get(modName);
			if (!mod) {
				mod = gun._gun_modules_registry_.set(modName, create_mod_root(root));
			}

			return mod;
		};
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./create_mixin":2,"./create_namespace":4,"./hijack":6,"./registry":10}],4:[function(_dereq_,module,exports){
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
        CreateObjectPath: createObjPath,
        Namespace: createNamespace
    };

})();

},{"./root":11}],5:[function(_dereq_,module,exports){
(function(){
    "use strict";

    module.exports = function(gun) {

        gun.Mixin('events', function() {

            return function(o) {

                var callbacks = { _id: 0 };

                o.on = function(eventName, prio, fn) {

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

                o.off = function(id) {
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

                o.emit = function(eventName /*, arguments ..*/) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    //var self = this;
                    var _callbacks = callbacks[eventName];
                    var i, len;
                    //if (eventName in callbacks) {
                    if (_callbacks) {
                        //callbacks[eventName].forEach(function(cb){
                            //cb.fn.apply(self, args);
                        //});

                        len = _callbacks.length;
                        for (i = 0; i < len; i++) {
                            _callbacks[i].fn.apply(this, args);
                        }

                    }
                };

                o.emitReduce = function(eventName /*, value, [arguments ..] */) {
                    //var self = this;
                    var args = Array.prototype.slice.call(arguments, 1);
                    var _callbacks = callbacks[eventName];
                    var i, len;
                    //if (typeof args[0] === 'undefined') {
                    if (args.length === 0) {
                        //args[0] = {};
                        args.push({});
                    }
                    //if (eventName in callbacks) {
                    if (_callbacks) {
                        //callbacks[eventName].forEach(function(cb){
                            //args[0] = cb.fn.apply(self, args);
                        //});
                        len = _callbacks.length;
                        for (i = 0; i < len; i++) {
                            args[0] = _callbacks[i].fn.apply(this, args);
                        }
                    }
                    return args[0];
                };

            };
        });
    };
})();
// vim: set expandtab:sts=4:ts=4:sw=4:

},{}],6:[function(_dereq_,module,exports){
(function(){
	module.exports = function(gun) {

        return function(ctor /*, mixin[s, ..] [, constuctor]*/) {

            if ('function' !== typeof ctor) {
                throw 'Need a constructor as first argument, but is '+(typeof ctor);
            }

            var mixins = Array.prototype.slice.call(arguments, 1);
            var hijacked;
            var extra_ctor = typeof mixins[mixins.length - 1] === 'function' ? mixins.pop() : false;

            /* jshint ignore:start */
            hijacked = eval('(function '+ctor.name+'(){'+
                                'this._gun_super_.apply(this,arguments);'+
                                'gun.Inject(["'+mixins.join('","')+'"],this);'+
                                'if(this._gun_extra_ctor_){this._gun_extra_ctor_.apply(this,arguments)}'+
                            '})');
            /* jshint ignore:end */

            hijacked.prototype = Object.create(ctor.prototype, {
                '_gun_super_': { value: ctor },
                '_gun_extra_ctor_': { value: extra_ctor }
            });

            return hijacked;
        };

    };
})();

},{}],7:[function(_dereq_,module,exports){
(function(){
    "use strict";

    module.exports = function(gun) {

        var api = gun.Logger = Object.create(null);
        var root = _dereq_('./root')();

        api.options = {
            //DEBUG: true,
            //INFO: true,
            //WARN: true,
            //ERROR: true
        };

        Object.defineProperty(api.options, 'DEBUG', {
            get: function(){ return this._DEBUG; },
            set: function(enable){
                this._DEBUG = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con) {
                    if ('undefined' !== typeof con.debug) {
                        api.debug = con.debug.bind(con);
                    } else if ('undefined' !== typeof con.log) {
                        api.debug = con.log.bind(con);
                    }
                } else {
                    api.debug = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'INFO', {
            get: function(){ return this._INFO; },
            set: function(enable){
                this._INFO = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.info) {
                    api.info = con.info.bind(con);
                } else {
                    api.info = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'WARN', {
            get: function(){ return this._WARN; },
            set: function(enable){
                this._WARN = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.warn) {
                    api.warn = con.warn.bind(con);
                } else {
                    api.warn = function(){};
                }
            }
        });

        Object.defineProperty(api.options, 'ERROR', {
            get: function(){ return this._ERROR; },
            set: function(enable){
                this._ERROR = enable;
                var con;
                try { con = console; } catch (err) {}
                if (enable && con && 'undefined' !== typeof con.error) {
                    api.error = con.error.bind(con);
                } else {
                    api.error = function(){};
                }
            }
        });

        api.options.DEBUG = true;
        api.options.INFO = true;
        api.options.WARN = true;
        api.options.ERROR = true;
    };
})();
// vim: et ts=4 sts=4 sw=4

},{"./root":11}],8:[function(_dereq_,module,exports){
(function(){
    "use strict";

    if (typeof Map === 'undefined') {

        module.exports.create = function() {
            return Object.create(null);
        };

    } else {

        module.exports.create = function() {
            return new Map();
        };

    }

})();
// vim: et ts=4 sts=4 sw=4

},{}],9:[function(_dereq_,module,exports){
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
      initialize: function(o, conf) {
        var finder, _conf;
        conf.objectDirectory || (conf.objectDirectory = {
          obj_directory: {},
          latest_obj: null,
          cur_obj_id: 0
        });
        o.name = build_obj_id(o, conf);
        _conf = conf.objectDirectory;
        _conf.obj_directory[o.name] = o;
        finder = function(name) {
          return _conf.obj_directory[name];
        };
        if (!_conf.static_finder_created) {
          _conf.static_finder_created = true;
          conf.gun.Namespace(conf.objectTypeName, function(exports) {
            exports.get = finder;
            exports.find = finder;
            exports.latest = function() {
              return _conf.latest_obj;
            };
          });
        }
        return _conf.latest_obj = o;
      }
    };
  });
};



},{}],10:[function(_dereq_,module,exports){
(function(){
    "use strict";

	var map = _dereq_('./map');

	function Registry(parent) {
		this.parent = parent;
		this.data = map.create();
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
		if (!gun._gun_.hasOwnProperty(propName)) {
			Object.defineProperty(gun._gun_, propName, { value: new Registry() });
		}
		if (gun._gun_ !== gun) {
			if (!gun.hasOwnProperty(propName)) {
				Object.defineProperty(gun, propName, { value: new Registry(gun._gun_[propName]) });
			}
		}
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:

},{"./map":8}],11:[function(_dereq_,module,exports){
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