(function(){
    "use strict";

	function Registry(parent) {
		this.parent = parent;
		this.data = new Map();
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


	module.exports = function(papa, propName) {
		if (!papa._papa.hasOwnProperty(propName)) {
			Object.defineProperty(papa._papa, propName, { value: new Registry() });
		}
		if (papa._papa !== papa) {
			if (!papa.hasOwnProperty(propName)) {
				Object.defineProperty(papa, propName, { value: new Registry(papa._papa[propName]) });
			}
		}
	};

})();
// vim: set noexpandtab:sts=4:ts=4:sw=4:
