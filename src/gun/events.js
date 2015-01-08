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
