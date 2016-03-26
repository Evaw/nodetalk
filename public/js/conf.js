/**
	separate the conf object from webrtc handling
**/

/*global window:false, console:false, define:false, document:false*/
(function() {
	"use strict";
	/**
	change to use document instead of conf
	screen share
	face detect
	remove copy to clipboard for phones
	*/
	var fileLocationRegex = /^file:/,
		EVENTS = {
			GOT_SELF_VIDEO: "got_self_video",
			//GOT_SELF_SCREEN: "got_self_screen",
			GOT_PEER_VIDEO: "got_peer_video",
			PEER_GONE: "peer_gone",
			SPEAK_POLL: "talking",
			PEER_DATA: "peer_data",
			REMOVED_PEER_VIDEO: "REMOVED_PEER_VIDEO",
			SCREEN_STOPPED: "SCREEN_STOPPED"
		};
	if (fileLocationRegex.test(window.location.href)) {
		//do not have a server
		define(["js/utils"],
			function(utils) {
				return {
					joinRoom: function(joiningRoomName) {
						utils.noOp(joiningRoomName);
					},
					EVENTS: EVENTS,
					setVolumeDetectionPeriod: function(newValue) {
						utils.noOp(newValue);
					},
					attachStream: function(videoTag, stream, userId) {
						utils.noOp(videoTag, stream, userId);
					}
				};
			});
		if (window.console) {
			window.console.error('since this is running as a file, cant connect to server');
		}
		return;
	}
	var USE_AUDIO_CHART = true;
	define(["jquery",
			"js/adapter",
			"sock/socket.io",
			"js/browserUser",
			(USE_AUDIO_CHART ? "js/hark.bundle.plus.chart" : "js/hark.bundle"),
			"js/utils"
		],
		function($,
			adapter,
			io,
			browserUser,
			hark,
			utils) {
			var volumeDetectionPeriod_ms = 150,
				triggerGotSelfVideoWhenUserProvided = false,
				optional = {
					optional: [{
						DtlsSrtpKeyAgreement: true
					}, {
						RtpDataChannels: true
					}]
				},
				confObj = {},

				User = browserUser.User,
				exit,
				localstream,
				setEnabledOnTracks,
				gotStream,
				start,
				oniceconnectionstatechange,
				gotDescription1,
				gotDescription2,
				gotDescriptionRenegociate,
				gotDescription1Error,
				gotDescription2Error,
				getUserMediaError,
				renegociate,
				speech,
				RELAY_TYPES = {
					RENEGOCIATE_DESC: "renegociate:desc",
					RENEGOCIATE_ANS: "renegociate:ans"
				},
				hangup,
				roomName = 'test',
				gotRemoteStream,
				iceCallback1,
				selfUser,
				localScreenStream,
				sendinglocalScreenStream = false,
				ping,
				//exampleIce: {"iceServers": 
				// 	[
				// 		{"url": "stun:stun.l.google.com:19302"},
				//		{"url":"turn:my_username@<turn_server_ip_address>",
				//			"credential":"my_password"}
				//	]
				//};
				peers = {}, //id provided by server: {id:same as key}
				stunTurnServers = [
					//{url: "stun:stun.l.google.com:19302"},
					// {
					// 	url: "stun:stun.example.org"
					// },
					{
						url: "stun:stun.l.google.com:19302"
					}, {
						url: 'turn:jorge@166.78.120.222',
						credential: "whybother"
					}

				],
				call,
				location = window.location,
				sdpConstraints = {
					'mandatory': {
						'OfferToReceiveAudio': true,
						'OfferToReceiveVideo': true
					}
				},
				onPeerDesc,
				onData,
				generateSocketConnectURL = function selfUser() {
					return [
						location.protocol,
						"//",
						location.hostname, (location.port ? ":" + location.port : "")
					].join('');
				},
				socket = io.connect(generateSocketConnectURL()),
				idToHarkerHash = {

				};
			window.___debuggingGlobal___ = window.___debuggingGlobal___ || {};
			window.___debuggingGlobal___.peers = peers;
			socket.on('user:connection:entry', function(data) {
				selfUser = new User(data.id, socket);
				selfUser.roomName = roomName;
				if (triggerGotSelfVideoWhenUserProvided) {
					$(confObj).trigger(EVENTS.GOT_SELF_VIDEO, {
						stream: localstream,
						userId: selfUser.id
					});
					triggerGotSelfVideoWhenUserProvided = false;
				}
			});
			window.peers = peers; //TODO
			$(window).unload(function() {
				if (localstream) {
					localstream.stop();
				}
				sendDataToAll(JSON.stringify({
					appDataType: 'peerUnload',
					data: {
						userId: selfUser.id
					}
				}));
				exit();
			});
			exit = function() {
				var peerId;
				for (peerId in peers) {
					if (peers.hasOwnProperty(peerId)) {
						try {

							peers[peerId].peerConnection.close();
						} catch (ignore) {
							//idk why it would fail
						}
					}
				}
			};
			onData = function(ev) {
				//console.log('got data');
				var data, type, clientData;
				try {
					data = JSON.parse(ev.data);
					//console.log(data);
				} catch (err) {
					console.log('could not parse it, malformed message');
					return;
				}
				type = data.appDataType;
				clientData = data.data;
				if (type === 'raw') {
					$(confObj).trigger(EVENTS.PEER_DATA, clientData);
				} else if (type === 'hark') {
					if (peers[clientData.userId]) {
						//make sure we have this peer
						//userId is external definition of User.id TODO change internal definitoi to userId
						//have this peer
						$(confObj).trigger(EVENTS.SPEAK_POLL, clientData);
					}
				} else if (type === 'conf') {
					// var subtype = ev.data.subtype;
					// if (subtype === "remoteScreenId") {
					// 	this.remoteScreenIds.push(ev.data.remoteScreenId);
					// }
					var subtype = data.subtype;
					if (subtype === "screenStop") {
						$(confObj).trigger(EVENTS.REMOVED_PEER_VIDEO, {
							type: "screen",
							userId: data.data.fromPeerId
						});
					}
				} else if (type === 'peerUnload') {
					onPeerGone(peers[clientData.userId]);
				}
			};

			var onPeerGone = function(peer) {
				if (peer) {
					if (peers.hasOwnProperty(peer.id)) {
						if (idToHarkerHash[peer.id]) {
							idToHarkerHash[peer.id].destroy();
							delete idToHarkerHash[peer.id];
						}
						delete peers[peer.id];
						$(confObj).trigger(EVENTS.PEER_GONE, {
							userId: peer.id
						});
						//TODO destroy peer	
					}
				}
			};
			oniceconnectionstatechange = function(peer) {
				if (peer && peer.peerConnection) {
					if (peer.peerConnection.iceConnectionState === "disconnected") {
						onPeerGone(peer);
					}
				}
			};
			onPeerDesc = function(data) {
				var videoTracks = localstream.getVideoTracks(),
					audioTracks = localstream.getAudioTracks(),
					descObj = data.desc,
					peerId = data.peerId,
					peerDesc = new adapter.RTCSessionDescription(descObj),
					servers = {
						iceServers: stunTurnServers
					},
					peerConnection;
				if (videoTracks.length > 0) {
					console.log('Using Video device: ' + videoTracks[0].label);
				}
				if (audioTracks.length > 0) {
					console.log('Using Audio device: ' + audioTracks[0].label);
				}
				peerConnection = new adapter.RTCPeerConnection(servers, optional);
				peers[peerId] = {
					id: peerId,
					peerConnection: peerConnection,
					roomName: roomName,
					streams: [],
					dataChannel: null
				};

				//data
				peerConnection.ondatachannel = function(ev) {
					var chan = ev.channel;
					peers[peerId].dataChannel = chan;
					chan.onmessage = onData;
				};
				//end data
				peerConnection.oniceconnectionstatechange = function() {
					oniceconnectionstatechange(peers[peerId]);
				};
				console.log("Created local peer connection object peerConnection");
				peerConnection.onicecandidate = function(event) {
					console.log('onicecandidate: ' + selfUser.id + ' ' + peerId);
					iceCallback1(event, {
						fromPeerId: selfUser.id,
						toPeerId: peerId
					});
				};
				peerConnection.addStream(localstream);
				if (sendinglocalScreenStream) {
					if (localScreenStream) {

						peerConnection.addStream(localScreenStream);
					} else {
						console.warn('bad state, sending stream, but no stream actually available');
					}
				}
				peerConnection.onaddstream = function(ev) {
					gotRemoteStream(ev, peers[peerId]);
				};
				peerConnection.onremovestream = function(ev) {
					removedRemoteStream(ev, peers[peerId]);
				};
				console.log("Adding Local Stream to peer connection");
				//peerConnection.createOffer(gotDescription1);

				//
				console.log('got peer desc, creating answer');
				peerConnection.setRemoteDescription(new adapter.RTCSessionDescription(peerDesc));
				// Since the "remote" side has no media stream we need
				// to pass in the right constraints in order for it to
				// accept the incoming offer of audio and video.
				peerConnection.createAnswer(function(desc) {
					gotDescription2(desc, peers[peerId]);
				}, gotDescription2Error, sdpConstraints);
			};
			socket.on('recvPeerDesc', onPeerDesc);
			socket.on('user:other:join', function(data) {
				//there was someone
				console.log('user:other:join');
				console.log(data);
				var peer = {
					id: data.id,
					peerConnection: null,
					roomName: roomName,
					streams: [] //streams:{streamDescription:string, stream:stream}
				};
				peers[data.id] = peer;
				call(peer); //call to user w/ id in room

			});

			socket.on('recvIce', function(data) {
				console.log('recvIce');
				peers[data.peerId].peerConnection.addIceCandidate(new adapter.RTCIceCandidate(data.iceCandidate));
			});
			var gotAnswerRenegociate = function(desc, peerId) {
				peers[peerId].peerConnection.setLocalDescription(desc);
				socket.emit('relay', {
					toPeerId: peerId,
					toRelay: {
						relayType: RELAY_TYPES.RENEGOCIATE_ANS,
						desc: desc,
						peerId: selfUser.id
					}
				});
			};
			var handleRenegociateGotAns = function(relayd) {
				var peerId = relayd.peerId;
				var peer = peers[peerId];

				if (!peer) {
					return;
				}
				peer.peerConnection.setRemoteDescription(new adapter.RTCSessionDescription(relayd.desc));
			};
			var handleRenegociateGotPeerDesc = function(relayd) {
				var peerId = relayd.peerId;
				var peer = peers[peerId];

				if (!peer) {
					return;
				}
				peer.peerConnection.setRemoteDescription(new adapter.RTCSessionDescription(relayd.desc));
				peer.peerConnection.createAnswer(function(desc) {
					gotAnswerRenegociate(desc, peerId);
				});
			};

			var handlePeerUnload = function(relayd) {
				onPeerGone();
			}
			socket.on('relay', function(relayd) {
				switch (relayd.relayType) {
					case RELAY_TYPES.RENEGOCIATE_DESC:
						handleRenegociateGotPeerDesc(relayd);
						break;
					case RELAY_TYPES.RENEGOCIATE_ANS:
						handleRenegociateGotAns(relayd);
						break;
				}
			});
			gotDescriptionRenegociate = function(desc, peer) {
				var peerConnection = peers[peer.id].peerConnection;
				peerConnection.setLocalDescription(desc);
				socket.emit('relay', {
					toPeerId: peer.id,
					toRelay: {
						relayType: RELAY_TYPES.RENEGOCIATE_DESC,
						desc: desc,
						peerId: selfUser.id
					}
				});
			};
			renegociate = function(peer) {
				if (!peer) {
					return;
				}
				peer.peerConnection.createOffer(function(desc) {
					gotDescriptionRenegociate(desc, peer);
				});
			};
			gotStream = function(stream) {
				window.___debuggingGlobal___.localstream = stream;
				console.log("Received local stream");
				// Call the polyfill wrapper to attach the media stream to this element.
				//adapter.attachMediaStream(vid1, stream);
				localstream = stream;
				if (selfUser && selfUser.id) {
					//depending on connection speed, there may or not be a user
					$(confObj).trigger(EVENTS.GOT_SELF_VIDEO, {
						stream: stream,
						userId: selfUser.id
					});
				} else {
					triggerGotSelfVideoWhenUserProvided = true;
				}
				socket.emit('join', {
					roomName: roomName
				});
			};
			socket.on('recvAnswerDesc', function(data) {
				console.log('recvAnswerDesc', data);
				var peerConnection = peers[data.peerId].peerConnection;
				peerConnection.setRemoteDescription(new adapter.RTCSessionDescription(data.desc));
			});

			start = function() {

				console.log("Requesting local stream");
				// Call into getUserMedia via the polyfill (adapter.js).
				adapter.getUserMedia({
					audio: true,
					video: true
				}, gotStream, getUserMediaError);
				//join in when getStream is successful
			};
			getUserMediaError = function() {
				console.log('failed to get user media');
			};
			call = function(peer) {
				console.log("Starting call");
				console.log(peer);
				var videoTracks = localstream.getVideoTracks(),
					audioTracks = localstream.getAudioTracks(),
					servers = {
						iceServers: stunTurnServers
					},
					peerConnection;

				if (videoTracks.length > 0) {
					console.log('Using Video device: ' + videoTracks[0].label);
				}
				if (audioTracks.length > 0) {
					console.log('Using Audio device: ' + audioTracks[0].label);
				}
				//if(navigator.userAgent.indexOf('Chrome')){

				//}
				peerConnection = new adapter.RTCPeerConnection(servers, optional);
				peers[peer.id].peerConnection = peerConnection;
				peerConnection.oniceconnectionstatechange = function() {
					oniceconnectionstatechange(peer);
				};
				console.log("Created local peer connection object peerConnection");
				peerConnection.onicecandidate = function(event) {
					console.log('onicecandidate ' + selfUser.id + ' ' + peer.id);
					iceCallback1(event, {
						fromPeerId: selfUser.id,
						toPeerId: peer.id
					});
				};
				//data
				peers[peer.id].dataChannel = peerConnection.createDataChannel("sendDataChannel", {
					reliable: false
				});
				window.dc = peers[peer.id].dataChannel; //TODO
				peers[peer.id].dataChannel.onmessage = onData;
				//end data
				peerConnection.addStream(localstream);
				if (sendinglocalScreenStream) {
					if (localScreenStream) {
						peerConnection.addStream(localScreenStream);
					} else {
						console.warn('bad state had sendinglocalScreenStream but no stream');
					}
				}
				peerConnection.onaddstream = function(ev) {
					gotRemoteStream(ev, peers[peer.id]);
				};
				console.log("Adding Local Stream to peer connection");
				peerConnection.createOffer(function(desc) {
					console.log('offer obj created');
					console.log(peer);
					gotDescription1(desc, peer);
				}, gotDescription1Error, sdpConstraints);

			};
			ping = function() {
				socket.emit('ev', new Date());
			};
			gotDescription1 = function(desc, peer) {
				var peerConnection = peers[peer.id].peerConnection;
				peerConnection.setLocalDescription(desc);
				console.log("got  self dexcription \n" + desc.sdp);
				console.log(desc);
				socket.emit('sendPeerDesc', {
					desc: desc,
					fromPeerId: selfUser.id,
					toPeerId: peer.id,
					roomName: peer.roomName
				});
			};

			gotDescription1Error = function() {
				console.log('failed getting local description1');
			};
			gotDescription2Error = function() {
				console.log('failed getting local description 2');
			};
			gotDescription2 = function(desc, peer) {
				//pc2.setLocalDescription(desc);
				console.log("Answer from pc2 \n" + desc.sdp);
				var peerConnection = peers[peer.id].peerConnection;
				peerConnection.setLocalDescription(desc);
				socket.emit('answerPeer', {
					desc: desc,
					fromPeerId: selfUser.id,
					toPeerId: peer.id,
					roomName: peer.roomName
				});
			};

			hangup = function() {
				//alert('not done yet');
				// console.log("Ending call");
				// peerConnection.close();
				// //pc2.close();
				// peerConnection = null;
				// btn3.disabled = true;
				// btn2.disabled = false;
			};
			var removedRemoteStream = function(e, peer) {
				//TODO for now, only share streams are removed
				var type = "screen";
				$(confObj).trigger(EVENTS.REMOVED_PEER_VIDEO, {
					stream: e.stream,
					userId: peer.id,
					type: type
				});
			};
			gotRemoteStream = function(e, peer) {
				// Call the polyfill wrapper to attach the media stream to this element.
				//var v = document.createElement('video');
				//v.autoplay = true;
				//$(document.body).append(v);
				//adapter.attachMediaStream(v, e.stream);
				var type = peer.peerConnection.getRemoteStreams().length > 1 ? "screen" : "video";
				e.stream.onaddtrack = function() {
					console.log('%c got another track ', 'background:red;font-size: 41px;');
				};
				$(confObj).trigger(EVENTS.GOT_PEER_VIDEO, {
					stream: e.stream,
					userId: peer.id,
					type: type
				});
				console.log("Received remote stream");
			};

			iceCallback1 = function(event, info) {
				console.log("iceCallback1");
				if (event.candidate) {
					//pc2.addIceCandidate(new adapter.RTCIceCandidate(event.candidate));
					console.log("Local ICE candidate: \n" + event.candidate);
					socket.emit('ice', {
						iceCandidate: event.candidate,
						fromPeerId: info.fromPeerId,
						toPeerId: info.toPeerId
					});
				}

			};
			setEnabledOnTracks = function(tracks, newEnabled) {
				var i;
				if (!tracks) {
					return;
				}
				for (i = tracks.length - 1; i >= 0; i -= 1) {
					tracks[i].enabled = newEnabled;
				}
			};
			var sendScreen = function(stream) {
				var id;
				//localstream.addTrack(stream.getVideoTracks()[0]);
				window.___debuggingGlobal___.localstream = localstream;
				sendinglocalScreenStream = true;
				for (id in peers) {
					if (peers.hasOwnProperty(id)) {
						//peers[id].peerConnection.addStream(stream);
						peers[id].peerConnection.addStream(stream);
						renegociate(peers[id]);
					}
				}
			};
			var getScreen = function(callback, errorCallback) {
				var sw = screen.width;
				var sh = screen.height;
				adapter.getUserMedia({
						video: {
							mandatory: {
								// request 'screen' as a source media
								chromeMediaSource: 'screen',
								"minWidth": sw,
								"maxWidth": sw,
								"minHeight": sh,
								"maxHeight": sh,
								"minFrameRate": "30"
							}
						}
					},
					function(stream) {
						// $(confObj).trigger(EVENTS.GOT_SELF_SCREEN, {
						// 	stream: stream
						// });
						localScreenStream = stream;
						callback(stream);
						//success

					}, function() {
						//debugger;
						//error
						if (typeof errorCallback === "function") {
							errorCallback.apply(this, arguments);
						}
					});
			};
			var isFn = function(o) {
				return typeof o === "function";
			};
			var sendDataToAll = function(json) {
				var peer, peerId;
				for (peerId in peers) {
					if (peers.hasOwnProperty(peerId)) {
						peer = peers[peerId];
						if (peer.dataChannel) {
							peer.dataChannel.send(json);
						} else {
							console.warn('A bug, a peer does not have a data channel');
						}
					}
				}
			};
			var sendDataToAllExpose = function(data) {
				var toSend = {
					appDataType: "raw",
					data: data
				};
				var s = JSON.stringify(toSend)
				sendDataToAll(s);
			};
			$.extend(confObj, {
				getSelfId: function() {
					return selfUser.id
				},
				stopScreen: function() {
					if (sendinglocalScreenStream) {
						localScreenStream.stop();
						var id;
						var toSend = {
							appDataType: "conf",
							subtype: "screenStop",
							data: {
								fromPeerId: selfUser.id,
							}
						};
						var s = JSON.stringify(toSend)
						sendDataToAll(s);
						try {

							//localstream.addTrack(stream.getVideoTracks()[0]);
							for (id in peers) {
								if (peers.hasOwnProperty(id)) {
									//peers[id].peerConnection.addStream(stream);
									peers[id].peerConnection.removeStream(localScreenStream);
									renegociate(peers[id]);
								}
							}
							sendinglocalScreenStream = false;
						} catch (ignore) {
							alert('could not stop screen stream, refreshing the page to ensure the sharing stops');
							window.location.href = window.location.href;
						}
					}
				},
				getNumPeers: function() {
					var p,
						count = 0;
					for (p in peers) {
						count += 1;
					}
					return count;
				},
				getAndSendScreen: function(callback, errorCallback) {
					if (sendinglocalScreenStream) {
						console.warn('already sending screen');
						return;
					}
					getScreen(function(stream) {
						stream.addEventListener('ended', function(ev) {
							confObj.stopScreen();
							$(confObj).trigger(EVENTS.SCREEN_STOPPED);
						});
						var vidTracks = stream.getVideoTracks()
						for (var i = 0; i < vidTracks.length; i += 1) {
							console.log('%c ' + vidTracks[i].id, 'background: #333;color: #1FCFE7');
							console.log('%c ' + vidTracks[i].label, 'background: #333;color: #1FCFE7');
						}
						sendScreen(stream);
						if (isFn(callback)) {
							callback(stream);
						}
					}, function() {
						if (isFn(errorCallback)) {
							errorCallback();
						}
					});
				},
				sendDataToAll: function(data) {
					sendDataToAllExpose(data);
				},
				sendData: function(id, data) {
					var peer = peers[id];
					if (peer && peer.dataChannel) {
						peer.dataChannel.send(JSON.stringify({
							appDataType: 'raw',
							data: data
						}));
					} else {
						console.warn('could not send data, please provide a valid peerId');
					}
				},
				joinRoom: function(joiningRoomName) {
					roomName = joiningRoomName;
					start();
				},

				EVENTS: EVENTS,
				/**
				 * volume detection period in ms
				 */
				setVolumeDetectionPeriod: function(newValue) {
					volumeDetectionPeriod_ms = newValue;
					if (idToHarkerHash[selfUser.id]) {
						idToHarkerHash[selfUser.id].setInterval(newValue);
					}
				},
				unpauseLocalVideoStream: function() {
					var audioTracks;
					if (localstream) {
						audioTracks = localstream.getVideoTracks();
						setEnabledOnTracks(audioTracks, true);
					}
				},
				pauseLocalVideoStream: function() {
					var audioTracks;
					if (localstream) {
						audioTracks = localstream.getVideoTracks();
						setEnabledOnTracks(audioTracks, false);
					
					}
				},
				unmuteLocalAudioStream: function() {
					var audioTracks;
					if (localstream) {
						audioTracks = localstream.getAudioTracks();
						setEnabledOnTracks(audioTracks, true);
					}
					if(speech){
						speech.resume();
					}
				},
				devRenegotiateAll: function() {
					var peerId;
					for (peerId in peers) {
						renegociate(peers[peerId]);
					}
				},
				muteLocalAudioStream: function() {
					var audioTracks;
					if (localstream) {
						audioTracks = localstream.getAudioTracks();
						setEnabledOnTracks(audioTracks, false);
					}
					if(speech){
						speech.pause();
					}
				},
				attachStream: function(videoTag, stream, userId) {
					adapter.attachMediaStream(videoTag, stream);
					//seems only get data for local stream, therefore will send info to all peers
					if (userId === selfUser.id) {

						speech = hark(stream, {
							canvas: document.getElementById('hark-canvas'),
							freqCanvas: document.getElementById('hark-freq-canvas'),
							interval: volumeDetectionPeriod_ms,
							threshold: -45 //threshold dB [-100dB, 0dB]
						});
						if (speech) {
							idToHarkerHash[userId] = speech;
							speech.on('volume_change', function(obj) {
								var peerId,
									talkObj = {
										userId: userId,
										speakingStatus:  obj.speakingStatus
									};
								$(confObj).trigger(EVENTS.SPEAK_POLL, talkObj);
								for (peerId in peers) {
									if (peers.hasOwnProperty(peerId)) {
										try {
											peers[peerId].dataChannel.send(JSON.stringify({
												appDataType: 'hark',
												data: talkObj
											}));
										} catch (err) {
											console.error('failed send');
											console.error(err);
										}
									}
								}
							});
						}
					}
				}
			});
			window.___debuggingGlobal___.confObj = confObj;
			var makeGetScreenButton = function() {
				var button = $('<button></button>');
				button.css({
					position: 'absolute',
					'z-index': 9999,
					top: 0,
					left: 0,
					display: 'inline-block',
					width: 100,
					height: 30
				}).text('screen').click(function() {

					confObj.getAndSendScreen(function(stream) {
							//confObj.sendScreen(stream);
						},
						function() {
							console.error('failed getting screen');
						});
				}).appendTo(document.body);

			};
			//makeGetScreenButton();
			return confObj;
		});
}());