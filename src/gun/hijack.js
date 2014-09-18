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
