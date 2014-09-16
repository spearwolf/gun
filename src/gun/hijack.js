(function(){
	module.exports = function(gun) {

        return function(_CTOR /*, mixins*/) {
            var mixins = Array.prototype.slice.call(arguments, 1);
            var hijacked;

            /* jshint ignore:start */
            hijacked = eval("(function "+_CTOR.name+'(){_CTOR.apply(this,arguments);gun.Inject(["'+mixins.join('","')+'"],this)})');
            /* jshint ignore:end */

            hijacked.prototype = Object.create(_CTOR.prototype);

            return hijacked;
        };

    };
})();
