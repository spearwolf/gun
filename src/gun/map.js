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
