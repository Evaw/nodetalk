/*jslint node: true, nomen: true*/
(function (exports) {
	'use strict';
	var _defaultEqFn = function (a, b) {
		if (a === null && b === null) {
			return true;
		}
		if (a && a.equals) {
			return a.equals(b);
		}
		return a === b;
	};
	var Set = function (eqFn) {
		this.eqFn = eqFn || _defaultEqFn;
		this._container = [];
	};
	/**
	if argument impelements iterate method, 
	it will check if the elements in this set are also contained in other
*/
	Set.prototype.containsAll = function (other) {
		var me = this;
		if (other.iterate) {
			other.iterate(function (elt) {
				if (!me.contains(elt)) {
					return false;
				}
			});
			return true;
		}
		return false;
	};

	/**
	returns true of there was already there
*/
	Set.prototype.add = function (Client) {
		var idx = this._getIndex(Client);
		if (idx >= 0) {
			this._container[idx] = Client;
			return true;
		}
		this._container.push(Client);
		return false;

	};
	Set.prototype.remove = function (Client) {
		var idx = this._getIndex(Client);
		if (idx >= 0) {
			this._container.splice(idx, 1);
		}
	};
	Set.prototype._getIndex = function (elt) {
		var i;
		for (i = this._container.length - 1; i >= 0; i -= 1) {
			if (this.eqFn(elt, this._container[i])) {
				return i;
			}
		}
		return -1;
	};
	Set.prototype.contains = function (elt) {
		return this._getIndex(elt) >= 0;
	};
	Set.prototype.empty = function () {
		this._container.length = 0;
	};
	Set.prototype.getSize = function () {
		return this._container.length;
	};
	Set.prototype.getAllAsArray = function () {
		return this._container.slice();
	};
	Set.prototype.toString = function () {
		return this._container.join(' ');
	};
	Set.prototype.iterate = function (fn) {
		var i = 0,
			l;
		for (i = 0, l = this._container.length; i < l; i += 1) {
			fn(this._container[i]);
		}
	};
	exports.Set = Set;
}(typeof exports === 'undefined' ? {} : exports));