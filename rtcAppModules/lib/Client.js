var MAX_ALLOWED_INT = Math.pow(2, 31) - 1;//use 31 bits max
var Set = require('./Set').Set;
var i = 0;
var genetateId = function () {
	i = (i+1)%MAX_ALLOWED_INT;
	return [
		i,
		Date.now(),
		'client',
		parseInt(Math.random() * MAX_ALLOWED_INT, 10),
		parseInt(Math.random() * MAX_ALLOWED_INT, 10)
	].join('_');
};
var Client = function (attrbs) {
	this._attrbs = Object.create(null);
	this._userAttr = Object.create(null);
	this._attrbs.sock = attrbs.sock;
	this.id = genetateId();
};
Client.prototype.setAttr = function(attrName, val) {
	this._userAttr[attrName] = val;
};
Client.prototype.getAttr = function(attrName) {
	return this._userAttr[attrName];
};
Client.prototype.destroy = function () {
	this._attrbs = null;
	this._userAttr = null;
};
Client.prototype.getSocket = function () {
	return this._attrbs.sock;
};
Client.prototype.equals = function (other) {
	return this.id === other.id;
};
Client.prototype.announceJoin = function (otherClient) {
	this._attrbs.sock.emit('user.other.join', {
		id: otherClient.id
	});
};
Client.prototype.peerConnectWith = function (otherClient) {

};

exports.Client = Client;