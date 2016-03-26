var Set = require('./Set').Set;
var Room = function (name) {
	this._name = name;
	this._users = new Set();
};
Room.prototype.enter = function(user) {
	var me = this;
	this._users.iterate(function(other){
		other.announceJoin(user);
	});
	this._users.add(user);
};
Room.prototype.leave = function(user) {
	this._users.remove(user);
};
Room.prototype.destroy = function() {
	this.name = null;
	this._users = null;
};
Room.prototype.equals = function(other) {
	return this == other;
};
Room.prototype.iterateUsers = function(fn) {
	this._users.iterate(fn);
};
exports.Room = Room;