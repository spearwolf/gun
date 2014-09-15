(function(){
    "use strict";
	module.exports = function(gun) {

        return function(_constructor /*, mixins*/) {
            var mixins = Array.prototype.slice.call(arguments, 1);

            var hijacked = function(){
                _constructor.apply(this, arguments);
                gun.Inject(mixins, this);
            };

            hijacked.prototype = _constructor.prototype;

            return hijacked;
        };

    };
})();
