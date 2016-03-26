/*jslint node:true*/
//test change again and again
//TODO: add userID before
//TODO: add version and reject previous versions
'use strict';
var fs = require('fs');
var ECT = require('ect');
var http = require('http');
var crypto = require('crypto');
var SECRETS = require('./SECRETS/SECRETS');
var monthInMs = 1000 * 60 * 60 * 24 * 30;
var ectRenderer = ECT({
	watch: true,
	root: __dirname + '/public'
});
console.log('Start');
var isProduction = process.env.NODE_ENV === "production";
var trace = function() {
	if (!isProduction) {
		console.log.apply(console, arguments);
	}
};
var setAppCSP = (function(res) {
	var CSP = [
		"default-src 'self'",
		"connect-src https: 'self' wss://* "
	].join('; ');
	return function(res) {
		trace('setting CSP ', CSP);
		//res.setHeader('Content-Security-Policy', CSP);
	};
}());
console.log(process.env.NODE_ENV);
trace('A');

var https = require('https'); //spdy or https
var express = require('express');
var Client = require('./rtcAppModules/lib/Client').Client;
var Conference = require('./rtcAppModules/lib/Conference').Conference;
var conference = new Conference();
var HashMap = require('./rtcAppModules/lib/HashMap').HashMap;
var usersMap = new HashMap(); /*put(key, value), get(key), remove(key)*/
var app = express();
var httpApp = express();
var passwordHash = SECRETS.passwordHash;
var signedclientToken = SECRETS.clientToken;
app.set('views', __dirname + '/public');

app.engine('.ect', ectRenderer.render);
var getHttpsOptions = function() {
	var FORCE_SELF_SIGNED = false;
	var useSelfSigned = FORCE_SELF_SIGNED || !isProduction;
	//var useSelfSigned = false;
	var selfSignedOptions = {
			key: fs.readFileSync('SECRETS/nodetalk/key.pem'),
			cert: fs.readFileSync('SECRETS/nodetalk/cert.pem')
		};
	if (useSelfSigned) {
		return selfSignedOptions;
	} else {
		try {
			return {
				ca: fs.readFileSync('./secrets/nodetalk/sub.class1.server.ca.pem'),
				key: fs.readFileSync('./secrets/nodetalk/key.pem'),
				cert: fs.readFileSync('./secrets/nodetalk/ssl.crt')
			};
		} catch (e) {
			console.log(e);
			console.log('could not read site keys trying self signed cert');
			return selfSignedOptions;
		}
	}
};
var httpsOptions = getHttpsOptions();
console.log('creating https server');
var server = https.createServer(httpsOptions, app);
console.log('created https server');
var io = require('socket.io').listen(server, {
	log: false
});
io.configure('production', function() {
	if (process.env.SERVER_ENV !== "wbx") {
		//only heroku server env needs xhr polling
		// io.set("transports", ["xhr-polling"]); 
		// io.set("polling duration", 10); 
	}
});
//var providedArgs = arguments;
app.use(express.compress());
app.use(express.cookieParser());
trace(process.env.NODE_ENV);
var isLoggedIn = function(req) {
	var cookies;
	if (req.cookies && req.cookies.ctoken) {
		cookies = req.cookies;
		return cookies.ctoken === signedclientToken;
	}
	return false;
};
app.configure(function() {
	var hoursMs = 1000 * 60 * 60;
	//var weekInMs = hoursMs*24*7;
	app.use(function(req, res, next) {
		if (isLoggedIn(req)) {

			express.static(__dirname + '/public', {
				maxAge: 0
			})(req, res, next);
		} else {
			next();
		}

	});
	//app.use(express.directory(__dirname + '/public'));
	app.use(express.errorHandler());
	app.disable('x-powered-by');
});
var redirectToRoom = function(req, res, room) {
	var pathAfterHost = room ? '/' + room : ""
	res.redirect('https://' + req.headers.host + pathAfterHost);
};

httpApp.get('/:id', function(req, res) {
	var roomName = req.params.id;
	redirectToRoom(req, res, roomName)
	//res.redirect('https://' + req.headers.host + '/' + roomName);
});
httpApp.get('*', function(req, res) {
	//res.redirect('https://' + req.headers.host);
	redirectToRoom(req, res);
});

var renderMainHTTPS = function(roomName, req, res) {
	setAppCSP(res);
	roomName = roomName || "";
	if (isLoggedIn(req)) {
		res.render('index.ect', {
			roomName: roomName,
			production: !! isProduction
		});
	} else {
		res.render('login.ect', {
			roomName: roomName
		});
	}
};
//app.use(express.bodyParser());
app.use(express.urlencoded());

app.use('/res', express.static(__dirname));
app.use('/sock', express.static(__dirname + "/node_modules/socket.io/node_modules/socket.io-client/dist"));
var postMain = function(req, res, roomId) {
	var password = req.param('password'),
		remember = !! req.param('remember'),
		hmac;
	if (password) {
		hmac = crypto.createHmac(SECRETS.hashAlgorithm, SECRETS.HmacKey);
		if (hmac.update(password).digest('hex') === passwordHash) {
			res.cookie('ctoken',
				signedclientToken, {
					httpOnly: true,
					secure: true,
					expires: remember ? new Date(new Date().getTime() + monthInMs) : false
				}
			);
		}
	}
	redirectToRoom(req, res, roomId);
};
app.post('/', function(req, res) {
	postMain(req, res);
});

app.post('/:id', function(req, res) {
	postMain(req, res, req.params.id);
});
app.get('/', function(req, res) {
	//res.redirect('/');
	renderMainHTTPS(false, req, res);
});

app.get('/:id', function(req, res) {

	var roomName = req.params.id;
	if (roomName) {
		renderMainHTTPS(roomName, req, res);
	} else {
		res.send("please specify an room name www.site.com/room/room_name");
	}
});
io.sockets.on('connection', function(socket) {
	trace('got connection');
	var user = new Client({
		sock: socket
	});
	socket.emit('user:connection:entry', {
		id: user.id
	});

	socket.on('disconnect', function() {
		console.dir('closed');
		usersMap.remove(user.id);
		conference.leave(user);
		user = null;
	});
	socket.on('relay', function(relayDesc) {
		var toPeerId,
			toUser,
			toRelay,
			sock;
		if (relayDesc && typeof relayDesc === "object") {
			toPeerId = relayDesc.toPeerId;
			if (toPeerId) {
				toUser = usersMap.get(toPeerId);
				if (toUser) {
					toRelay = typeof relayDesc.toRelay === undefined ? null : relayDesc.toRelay;
					if (toUser) {
						sock = toUser.getSocket();
						if (sock) {
							sock.emit('relay', toRelay);
						}
						//TODO need to perform these
					}
				}
			}
		}

	});
	socket.on('sendPeerDesc', function(data) {
		trace('got description, sending...');
		//rm.push({socket: socket, data: {desc: data.desc}});
		var fromPeerId = data.fromPeerId;
		var toPeerId = data.toPeerId;
		var toUser = usersMap.get(toPeerId);
		var toUserSocket;
		if (toUser) {
			var webRtcDescription = data.desc;
			toUserSocket = toUser.getSocket();
			toUserSocket.emit("recvPeerDesc", {
				desc: webRtcDescription,
				peerId: fromPeerId
			});
		}
	});
	socket.on('join', function(data) {
		var roomName = data.roomName;
		var otherUserSocket;
		user.setAttr('roomName', roomName);
		usersMap.put(user.id, user);
		conference.enter(roomName, user);
		conference.iterateRoomUsers(roomName, function(other) {
			if (user.id !== other.id) {
				otherUserSocket = other.getSocket();
				if (otherUserSocket) {
					otherUserSocket.emit('user:other:join', {
						id: user.id
					});
				}
			}
		});
	});
	socket.on('answerPeer', function(data) {
		var fromPeerId = data.fromPeerId,
			toPeerId = data.toPeerId;

		var toPeer = usersMap.get(toPeerId);
		var otherUserSocket;
		if (toPeer) {
			otherUserSocket = toPeer.getSocket();
			if (otherUserSocket) {
				otherUserSocket.emit('recvAnswerDesc', {
					peerId: fromPeerId,
					desc: data.desc
				});
			}
		}
	});
	socket.on('ice', function(data) {
		var toPeerId = data.toPeerId;
		var fromPeerId = data.fromPeerId;
		var iceCandidate = data.iceCandidate;
		var toPeer = usersMap.get(toPeerId);
		var toUserSocket;
		if (toPeer) {
			toUserSocket = toPeer.getSocket();
			if (toUserSocket) {
				toUserSocket.emit('recvIce', {
					peerId: fromPeerId,
					iceCandidate: iceCandidate
				});
			} //TODO inform peer to delete other peer
		}
	});
});

var PORT;
if (process.env.NODE_ENV === "production") {
	PORT = process.env.PORT || 80;
} else {
	PORT = process.env.PORT || 8080;
}
try {
	//http.createServer(httpApp).listen(PORT);
	http.createServer(httpApp).listen(PORT);
	console.log('listening on ' + PORT);
} catch (err) {
	console.log('could not listen on port 80, will not redirect http traffic');
}

var PORT_SECURE = 8443;
//https.createServer(options, app).listen(PORT_SECURE);
server.listen(PORT_SECURE);
//server.listen(PORT);
console.log('listening on port: ' + PORT_SECURE);
