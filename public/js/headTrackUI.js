/*global define:false, window:false, require:false, console:false, document:false*/
define(["jquery",
	"js/utils",
	"js/conf",
	"js/third-party-fd/headtrackr"
], function($, utils, conf, headtrackr) {
	"use strict";
	var htracker,
		faceLocationTrack = {
			x: -100,
			y: -100
		},
		notifyPeersOnFace,
		PROCESS_CANVAS_WIDTH = 128,
		PROCESS_CANVAS_HEIGHT = null,
		USE_DEBUGGING_CANVAS = true;
	$(window).on('attachedSelfVideo', function(jqObj, obj) {
		utils.noOp(jqObj);
		var selfVideoTag = obj.tag,
			//stream = obj.stream,
			processCanvas = document.getElementById('process-self-face-detect'),
			debugCanvas,
			whenHaveVideoMetadata = function() {
				var setCanvasWH = function(c, w, h) {
					if (c) {
						c.width = w;
						c.height = h;
					}
				},
					w = selfVideoTag.videoWidth,
					h = selfVideoTag.videoHeight,
					videoAspectRatio = w / h,
					ultimaterocessCanvasWidth = PROCESS_CANVAS_WIDTH,
					ultimateCanvasHeight;
				ultimateCanvasHeight = ultimaterocessCanvasWidth / videoAspectRatio;
				PROCESS_CANVAS_HEIGHT = ultimateCanvasHeight;
				setCanvasWH(processCanvas, ultimaterocessCanvasWidth, ultimateCanvasHeight);
				setCanvasWH(debugCanvas, ultimaterocessCanvasWidth, ultimateCanvasHeight);
				htracker.init2(selfVideoTag, processCanvas);
				htracker.start();
			};
		if (USE_DEBUGGING_CANVAS) {
			debugCanvas = document.getElementById('debug-self-face-detect');
		}
		htracker = new headtrackr.Tracker({
			calcAngles: true,
			ui: false,
			headPosition: false,
			debug: debugCanvas
		});
		if (isNaN(selfVideoTag.duration)) {
			//dont know the dimensions
			selfVideoTag.addEventListener('loadedmetadata', function() {
				whenHaveVideoMetadata();
			});
		} else {
			whenHaveVideoMetadata();
		}
	});

	var throttle = function(fn, time) {
		var newFn,
			tOut,
			lastCall = 0,
			latestArgs,
			callAtEnd = false,
			latestThis;
		newFn = function() {
			var now = Date.now();
			latestArgs = Array.prototype.slice.call(arguments);
			latestThis = this;
			if (now - lastCall > time) {
				lastCall = now;
				fn.apply(latestThis, latestArgs);
				clearTimeout(tOut);
				tOut = setTimeout(function() {
					lastCall = Date.now();
					if (callAtEnd) {
						fn.apply(latestThis, latestArgs);
						callAtEnd = false;
					}
				}, time);
			} else {
				callAtEnd = true;
			}
		};
		return newFn;
	};
	var selfFaceRect;
	var selfVideoContainer;
	var sendToPeers = function(data) {
		conf.sendDataToAll(data);
	};
	var throttleSendToAll = throttle(sendToPeers, 40);
	document.addEventListener('facetrackingEvent', function(event) {


		/*event
		angle: 1.5876379039213386
		confidence: 1
		detection: "CS"
		height: 80
		time: 48
		timeStamp: 1383206357563
		type: "facetrackingEvent"
		width: 56
		x: 74
		y: 57
		*/
		selfVideoContainer = selfVideoContainer || $('.self');
		selfFaceRect = selfFaceRect || $('#selfFaceRect');
		var sfr = selfFaceRect;
		var svc = selfVideoContainer;
		var cssMod;
		var w, h;
		if (htracker.status === "tracking") {
			w = event.width / PROCESS_CANVAS_WIDTH * svc.innerWidth();
			h = event.height / PROCESS_CANVAS_HEIGHT * svc.innerHeight();
			cssMod = {
				width: w,
				height: h,
				left: event.x / PROCESS_CANVAS_WIDTH * svc.innerWidth() - w / 2,
				top: event.y / PROCESS_CANVAS_HEIGHT * svc.innerHeight() - h / 2
			};
		} else {
			cssMod = {
				width: svc.innerWidth(),
				height: svc.innerHeight(),
				left: 0,
				top: 0

			};
		}
		sfr.css(cssMod);
		notifyPeersOnFace({
			x: event.x / PROCESS_CANVAS_WIDTH,
			y: event.y / PROCESS_CANVAS_HEIGHT
		});

	});
	notifyPeersOnFace = function(o) {
		if (Math.abs(faceLocationTrack.x - o.x) > 0.03 || Math.abs(faceLocationTrack.y - o.y) > 0.5) {
			faceLocationTrack.x = o.x;
			faceLocationTrack.y = o.y;
			throttleSendToAll({
				type: "face-detect",
				id: conf.getSelfId(),
				px: o.x,
				py: o.y
			});
		}
	};
	$(conf).on(conf.EVENTS.PEER_DATA, function(jqObj, obj) {
		utils.noOp(jqObj);
		// if (obj.type === "face-detect") {
		// 	$('.videoContainer video[data-id=' + obj.id + ']').data("face", {
		// 		px: obj.px,
		// 		py: obj.py
		// 	}).attr('data-has', 'data');
		// }
		$(window).trigger('peerFaceMoved', {
			id: obj.id,
			px: obj.px,
			py: obj.py
		});
	});
	var stop = function() {
		if (htracker) {
			htracker.stop();
		}
	};
	$(window).unload(stop);
	return {
		stop: function() {
			stop();
		}
	};
});