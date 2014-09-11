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
