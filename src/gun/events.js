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
