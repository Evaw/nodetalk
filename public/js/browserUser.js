define([], function(){
	var User = function (id, channel) {
		this.id = id;
		this.channel = channel;
	};

	User.prototype.connect = function(peerId) {
		
	};
	return {
		User: User
	};
})