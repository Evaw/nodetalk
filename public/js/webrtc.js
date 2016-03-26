define(["jquery", "js/conf", "swf/ZeroClipboard_1.2.0",
], function($, conf, ZeroClipboard) {

var sharingPeers = {};
var popShareWindow;
var closeShareWindow = function () {
	if(popShareWindow) {
		popShareWindow.close();
	}
};
$(window).unload(function () {
	closeShareWindow();
});
var checkAndRenegociate = function (videoTag) {
	var lastTime;
	var tOut;
	var checkAndRenegociateHelper = function (){
		if(videoTag && videoTag.src) {
			if(videoTag.currentTime === lastTime && videoTag.readyState === videoTag.HAVE_ENOUGH_DATA){
				//froze, renegociate
				console.log(lastTime);
				console.log('%c renegociated, share froze', 'background-color: blue; font-size: 30px;')
				conf.devRenegotiateAll();
				tOut = setTimeout(checkAndRenegociateHelper, 10000);
			} else {
				tOut = setTimeout(checkAndRenegociateHelper, 2000);	
			}
			lastTime = videoTag.currentTime;
		} else {
			clearTimeout(tOut);
		}
	}
	checkAndRenegociateHelper();
};
// clip.on( 'complete', function(client, args) {
//   this.style.display = "none"; // "this" is the element that was clicked
//   alert("Copied text to clipboard: " + args.text );
// } );
	ZeroClipboard.setDefaults({
		moviePath: "/swf/ZeroClipboard_1.2.0.swf",           // URL to movie
		trustedOrigins:    null,                       // Page origins that the SWF should trust (single string or array of strings)
		hoverClass:        "zeroclipboard-is-hover",   // The class used to hover over the object
		activeClass:       "zeroclipboard-is-active",  // The class used to set object active
		allowScriptAccess: "sameDomain",               // SWF outbound scripting policy
		useNoCache:        true,                       // Include a nocache query parameter on requests for the SWF
		forceHandCursor:   true                       // Forcibly set the hand cursor ("pointer") for all glued elements
	});
	

// what happens when we get self video
$(conf).on(conf.EVENTS.GOT_SELF_VIDEO, function (jqObj, obj){
		var videoSelf = $('#selfVideo');
		var videoTag = videoSelf[0];
		videoSelf.css('background-image', 'none');

		conf.attachStream(videoTag, obj.stream, obj.userId);
		videoSelf[0].muted = true;
		$(window).trigger('attachedSelfVideo', {
			stream: obj.stream,
			tag: videoTag
		});
});
var userWantsToStopShare = function () {
	var $shareButton = $('.shareButton');
	$shareButton.removeClass('stop-share');
	conf.stopScreen();
};
	


// what happens when we get someone else
$(conf).on(conf.EVENTS.GOT_PEER_VIDEO, function (jqObj,obj) {

	if (obj.type === "video") {

		var availVideoLocations = $(".brady .videoContainer video").filter(
			function(index) {
				return !$(this).attr('data-id');
			});
		if(!availVideoLocations){//no available tags
			obj.stream.stop();
			return;
		}
		targetLocation = availVideoLocations.eq(0);
		targetLocation.css('background-image','none').attr('data-id', obj.userId);
		//debugger;
		conf.attachStream(targetLocation[0], obj.stream);
		$(window).trigger('newPersonJoined');
		//count and click
	} else if (obj.type === "screen") {
		var $share = $('.share-video');
		sharingPeers[obj.userId] = {
			stream: obj.stream
		};
		conf.attachStream($share[0], obj.stream);
		checkAndRenegociate($share[0]);
		$(window).trigger('shareStart');
	}
	
});
$(window).on('share-pop', function () {
	var w = window.open('', "vid", 'toolbar=0,top=0,left=0,width=640,height=480');
	popShareWindow = w;
	setTimeout(function() {

		w.document.open();
		setTimeout(function() {
			w.document.write([
				'<!doctype html>',
				'<html>',
				'<head>',
				'	<title></title>',
				'	<script type="text/javascript">',
				'	</script>',
				'</head>',
				'<body style="margin:0;background-color:black">',
				'	<video style="width:100%"autoplay="true"></video>',
				'</body>',
				'</html>'
				].join('\n'));
			w.document.close();
			setTimeout(function() {
				var v = $("video", w.document.body)[0];
				var shareArea = $('.share-video');
				var firstSharingPeer;
				var id;
				for(id in sharingPeers){
					if(sharingPeers.hasOwnProperty(id)){
						firstSharingPeer = sharingPeers[id];
						break;
					}
				}
				conf.attachStream(v, firstSharingPeer.stream);
				shareArea[0].pause();
				$(popShareWindow).unload(function () {
					shareArea[0].play();
					$(window).trigger('closePopoutShare')
				});
			}, 100);
		}, 100);
	}, 100);
	
	$(window).trigger('popoutShare');
});

var shareVideoRemoved = function (id) {
	//for now id not needed since only one video stream for share	
	delete sharingPeers[id];

	var $share = $('.share-video');
	$share.attr('src', "");
	closeShareWindow();
	$(window).trigger('shareEnd');
};
//when a video stream is removed
$(conf).on(conf.EVENTS.REMOVED_PEER_VIDEO, function (jqObj, obj) {
	if (obj.type === "screen") {
		shareVideoRemoved(obj.userId);
	}
});

//what happens when the user stops screen through chrome's FIT
$(conf).on(conf.EVENTS.SCREEN_STOPPED, function (jqObj, obj) {
	$('.shareButton').removeClass("stop-share");
});
// what happens when we lose somebody
$(conf).on(conf.EVENTS.PEER_GONE, function(jqObj, obj){
		targetVideoID = obj.userId;
		if(sharingPeers.hasOwnProperty(obj.userId)) {
			//this peer is sharing
			shareVideoRemoved(obj.userId);
		}
		targetVideo = $('[data-id="'+targetVideoID+'"]');
		targetVideo.attr('src', "").css('background-image', '').attr("data-id", '');
		//targetVideo.attr('src', "").css('background-image', '').attr("data-id", '');//clears video so bg img shows
		//targetVideo.attr('src', "").css('background-image', '').removeAttr("data-id");//clears video so bg img shows
		//markFreeTag(nameOfTag);
		$(window).trigger('personLeft');
});
	
var mainSpeakingTimeouts = {};
$(conf).on(conf.EVENTS.SPEAK_POLL, function(jqObj, obj){
		//obj.userId: id of who is doing this
		//obj.volumeDecibel: [-100, 0] decibel level (according to harker.js -45 is speech)
		//console.log('poll volume ' + obj.userId + ' ' + obj.volumeDecibel);
		var $personVid;
		var personId;
		if(obj.speakingStatus === "speaking"){
			clearTimeout(mainSpeakingTimeouts[obj.userId]);
			console.log('%c I think ' +obj.userId+ ' is speaking', 'background-color: #C0FFEE;');
			$personVid = $('[data-id='+obj.userId+']');
			$personVid.addClass('speaking');
			mainSpeakingTimeouts[obj.userId] = setTimeout(function (){
				$personVid.removeClass('speaking');

			}, 4000);
		}
	});
	
	
$(document).ready(function() {
			joinMeetingInit();
			checkBrowser();
			devToolsInit();
});
			
	//functions
function devToolsInit(){
		$('.renegotiate').click(function() {
			conf.devRenegotiateAll();
		});
		 
		$('.loadGifs').click(function() {
		  		$(document.head).append($('<link rel="stylesheet" href="/css/gif-bg.css" type="text/css"/>'))
		});
		$('.showFaceCanvas').click(function () {
			if($(this).hasClass('ticked')){
				$('#process-self-face-detect').hide();
				$('#debug-self-face-detect ').hide();
				$('#selfFaceRect').hide();
				$(this).removeClass('ticked')				
			} else {
				//$('#process-self-face-detect').show();
				//$('#debug-self-face-detect ').show();
				$('#selfFaceRect').show();
				$(this).addClass('ticked')
			}
		})
		$('.showDevCanvas').click(function () {
			if($(this).hasClass('ticked')){
				$('#devTools').hide();
				$(this).removeClass('ticked')				
			} else {
				//$('#process-self-face-detect').show();
				//$('#debug-self-face-detect ').show();
				$('#devTools').show();
				$(this).addClass('ticked')
			}
		})
}
	
	
	
	
	function start(roomName) {
 		if (checkBrowser()) {
 			$('#frontPage').hide();
 			 
 		}
		conf.joinRoom(roomName);
	}
	
	function joinMeetingInit() {
	
			var clip = new ZeroClipboard($(".copy-to-clipboard-zc"));
			
			if ($('.copy-to-clipboard-checkbox').length) {
			if ($('.copy-to-clipboard-checkbox')[0].checked) {
				clip.glue( document.getElementsByClassName('startButton') );
			}
			}
			
			var meetingURL,
				roomName,
				isVideoEnabled,
				meetingIDString;
				
				
			var joinRoomName = function () {
				window.location.href =window.location.protocol + '//' + window.location.host + '/' + roomName;
				$(window).trigger('enteredMeeting');
			};
			
			$('.meetingId').select();
			//checkStartButton();
			var $shareButton = $('.shareButton');
			$shareButton.click(function (){
				if($shareButton.hasClass('stop-share')){
					userWantsToStopShare();
				} else {
					$shareButton.addClass('stop-share');
					conf.getAndSendScreen(
						function (stream) {
							
						},
						function () {
							alert('failed to get screen, need https and enabled flag')
						});
				}
			});
			
			//happens when click on flash covered start button
			clip.on('mouseup',  function (client, args) {
							
							
							if ($('.startButton').hasClass('inactive')){
								
								return false;
							}
							isVideoEnabled = false;
							getRoomName()
							
							if ($(this).hasClass('startButton')){
								if (!$('.copy-to-clipboard-checkbox')[0].checked) {
									enterMeeting()
								}
											
							}
							
							
							
			});
			
			clip.on('complete',  function (client, args) {
							
							if ($(this).hasClass('popoverCopy')){
								$('.copiedText.popoverCopy').css('display', 'inline-block');
								setTimeout(function () {
									$('.copiedText.popoverCopy').css('display', 'none');
									$('.inviteMenu').hide();
									$('.inviteButton').removeClass('openPopover')
								}, 1000);
								return
							}
							
							if ($('.startButton').hasClass('inactive')){
								
								return false;
							}
							isVideoEnabled = false;
							getRoomName()
							
							if ($(this).hasClass('startButton')){
								enterMeeting()						
							}
							
							else if ($(this).hasClass('copyButton')) {//button is copy button
								
								$('.copiedText').css('display', 'inline-block');
								setTimeout(function () {
									$('.copiedText').css('display', 'none');
								}, 1000);
							}	
							
							
			});
			
			clip.on('dataRequested',  function (client, args) {
							if ($(this).hasClass('popoverCopy')){
								clip.setText(document.URL);//set clipboard text
								return
							}
							
							if ($('.startButton').hasClass('inactive')){
								return false;
							}
							
							if ($(this).hasClass('copyButton')) {//button is copy button
								getRoomName();
								clip.setText(meetingURL);//set clipboard text
							}
							
							if ($(this).hasClass('startButton')){
								if ($('.copy-to-clipboard-checkbox')[0].checked) {
									getRoomName();
									clip.setText(meetingURL);//set clipboard text
								}
								else {
									$('#global-zeroclipboard-html-bridge').remove(); return false
								}				
							}
							
			});
			
		
			function enterMeeting(){
					
						joinRoomName();
					
			}
			
			function getRoomName(){
					meetingIDString = $('.meetingId').val();
					roomName = $('.meetingId').val().trim();
					if (roomName != ""){isVideoEnabled = true}
	
					if(roomName){
						meetingURL = location.protocol + "//" + location.host + "/" + roomName;
					}
			}

			$(document).keyup(function(e){checkStartButton(e)});
			
			function checkStartButton(e){
				if ($('.meetingId').val() != ""){
						$('.startButton, .copyButton').removeClass('inactive').addClass('active');
						
						if (e.keyCode == 13) {
						  	getRoomName();
						  //	enterMeeting()
						}
				}
				
				else {
						$('.startButton, .copyButton').removeClass('active').addClass('inactive')
				}
			}
			
			
			$('.startButton').click(function() {
				getRoomName();enterMeeting()
			});
			
			
			
			$('#clipboardCheckbox').change(function() {
				if ($('.copy-to-clipboard-checkbox')[0].checked) {
				//alert ('glue');
					clip.glue( document.getElementsByClassName('startButton') );
				}
				
				else {
					clip.unglue(document.getElementsByClassName('startButton') )
				}
			});
			
	}

	function getRoomName () {
		return window.location.pathname.slice(1);
	}
	function checkBrowser() {
			
			var is_OK = false; 
			var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
			var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
			var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
			var is_safari = navigator.userAgent.indexOf("Safari") > -1;
			var is_Opera = navigator.userAgent.indexOf("Presto") > -1;
			if (is_chrome) {is_OK = true}
			if (!is_OK) {alert('Sorry, the prototype only works in Chrome')}
			return is_OK
	}
	if(getRoomName()){
		start(getRoomName());
	}
});




function adjustVideo() {
			$("video.participant").mousedown(function(e){
	
	 	     	dragElement = $(this);
	 	    	cursorStartX = e.pageX;
				dragStartLeft = dragElement.position().left;
	 	       
				$(document).mousemove(function(event){
			 	       	deltaX = event.pageX - cursorStartX;
			 	       	targetLeft = dragStartLeft + deltaX;
			 	       	dragElement.css('left', targetLeft);
			 	});
			 	    
			 	$(document).mouseup(function(e){
			 	    	$(document).unbind('mousemove');
			 	 });
			});
}	


