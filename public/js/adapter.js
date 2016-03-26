/*global define:false, window:false*/
define(['js/logger'], function (logger) {
	"use strict";
	var RTCPeerConnection = null,
		getUserMedia = null,
		RTCSessionDescription = window.RTCSessionDescription,
		attachMediaStream = null,
		//reattachMediaStream = null,
		// webrtcDetectedBrowser = null,
		RTCIceCandidate = window.RTCIceCandidate;
	window.MediaStream = window.MediaStream || {};

	if (window.navigator.mozGetUserMedia) {
		logger.log("using mozGetUserMedia  when api called");

		// webrtcDetectedBrowser = "firefox";

		// The RTCPeerConnection object.
		RTCPeerConnection = window.mozRTCPeerConnection;

		// The RTCSessionDescription object.
		RTCSessionDescription = window.mozRTCSessionDescription;

		// The RTCIceCandidate object.
		RTCIceCandidate = window.mozRTCIceCandidate;

		// Get UserMedia (only difference is the prefix).
		// Code from Adam Barth.
		getUserMedia = window.navigator.mozGetUserMedia.bind(window.navigator);

		// Attach a media stream to an element.
		attachMediaStream = function (element, stream) {
			logger.log("Attaching media stream");
			element.mozSrcObject = stream;
			element.play();
		};

		//reattachMediaStream = function (to, from) {
		//	logger.log("Reattaching media stream");
		//	to.mozSrcObject = from.mozSrcObject;
		//	to.play();
		//};

		// Fake get{Video,Audio}Tracks
		window.MediaStream.prototype.getVideoTracks = function () {
			return [];
		};

		window.MediaStream.prototype.getAudioTracks = function () {
			return [];
		};
	} else if (window.navigator.webkitGetUserMedia) {
		logger.log("using webkitGetUserMedia when api called");

		// webrtcDetectedBrowser = "chrome";

		// The RTCPeerConnection object.
		RTCPeerConnection = window.webkitRTCPeerConnection;

		// Get UserMedia (only difference is the prefix).
		// Code from Adam Barth.
		getUserMedia = window.navigator.webkitGetUserMedia.bind(window.navigator);

		// Attach a media stream to an element.
		attachMediaStream = function (element, stream) {
			element.src = window.webkitURL.createObjectURL(stream);
			return;
			//if (element.srcObject) {
			//	element.srcObject = stream;
			//} else if (element.mozSrcObject) {
			//	element.mozSrcObject = stream;
			//} else if (element.src !==undefined) {
			//	element.src = window.URL.createObjectURL(stream);
			//} else {
			//	logger.log('Error attaching stream to element.');
			//}
		};

		//reattachMediaStream = function (to, from) {
		//	to.src = from.src;
		//};

		// The representation of tracks in a stream is changed in M26.
		// Unify them for earlier Chrome versions in the coexisting period.
		if (!window.webkitMediaStream.prototype.getVideoTracks) {
			window.webkitMediaStream.prototype.getVideoTracks = function () {
				return this.videoTracks;
			};
			window.webkitMediaStream.prototype.getAudioTracks = function () {
				return this.audioTracks;
			};
		}

		// New syntax of getXXXStreams method in M26.
		if (!window.webkitRTCPeerConnection.prototype.getLocalStreams) {
			window.webkitRTCPeerConnection.prototype.getLocalStreams = function () {
				return this.localStreams;
			};
			window.webkitRTCPeerConnection.prototype.getRemoteStreams = function () {
				return this.remoteStreams;
			};
		}
	} else {
		logger.log("Browser does not appear to be WebRTC-capable");
	}

	return {
		getUserMedia: getUserMedia,
		RTCPeerConnection: RTCPeerConnection,
		attachMediaStream: attachMediaStream,
		RTCIceCandidate: RTCIceCandidate,
		RTCSessionDescription: RTCSessionDescription
	};
});