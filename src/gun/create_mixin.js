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
