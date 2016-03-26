var Room = require('./Room').Room;
var HashMap = require('./HashMap').HashMap;
var Conference = function (name) {
	this._rooms = new HashMap();
};
Conference.prototype._getOrCreateRoom = function(name) {
	var rm = this._rooms.get(name);
	var newRm;
	if(rm) {
		return rm;
	}
	newRm =  new Room(name);
	this._rooms.put(name, newRm);
	return newRm;
};
Conference.prototype.getRoomsOpen = function() {
	return this._rooms.getSize();
};
Conference.prototype.enter = function(roomName, user) {
	var rm = this._getOrCreateRoom(roomName);
	user.room = rm;
	rm.enter(user);
	
};
Conference.prototype.leave = function(user) {
	var rm = this._rooms.get(user.getAttr('roomName'));
	if(rm){
		rm.leave(user);
	}
	user.destroy();
	user = null;
};
Conference.prototype.destroy = function() {
	this._rooms = null;
};
Conference.prototype.equals = function(other) {
	return this == other;
};
Conference.prototype.iterateRoomUsers = function(roomName, fn) {
	this._rooms.get(roomName).iterateUsers(fn);
};
exports.Conference = Conference;