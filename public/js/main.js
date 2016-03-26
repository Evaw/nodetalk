//
/*global define:false, window:false, require:false, console:false*/
(function() {
	"use strict";
	var resourcesDir = "js";
	require.config({
		baseUrl: '/',
		"paths": {
			"js": resourcesDir,
			"jquery": resourcesDir + "/jquery"
		}
	});
}());

require(["jquery",
	"js/webrtc",
	"js/conf",
	"js/headTrackUI",
	/**add big deps so loads faster*/
	"js/adapter",
	"sock/socket.io",
	"js/browserUser",
	"js/hark.bundle",
	'js/logger'
], function($, webrtc, conf, headTrackUI) {

	var headerHeight = 0;//was 55
	var footerHeight = 0;//was45

	var topMargin = -1; //Top of canvas
	var bottomMargin = -1; //Bottom of canvas
	var sideMargin = -1; //Sides of canvas


	var videoBottomPadding = 0; //Space for name and controls
	var videoRowMargin = 1; //Space between video rows
	var videoColumnMargin = 1; //Space between video columns

	var minVideoHeight = 110; //Minimum size before overflow occurs

	var narrowAspectRatio = 8 / 9; //Minimum aspect ratio
	var midAspectRatio = 4 / 3; //Secondary Minimum aspect ratio for some, optimized layouts
	var wideAspectRatio = 16 / 9; //Maximum aspect ratio

	var thumbnailRatio = 16 / 9;
	var isAspectOptimized = true;


	var finalRowFill = 0.5; //How full the bottom row should be (rounded up)

	var presenterWidth = 160;
	var thumbnailHeight = 90;
	var thumbnailMargin = 1;
	var thumbnailLeftPadding = 28;

	var isThumbnailOverflowing = false;

	var widthOfAllThumbnails = 1;

	var activeSpeakerMarginTop = 20;
	var activeSpeakerMarginBottom = 10;
	var activeSpeakerMarginLeft = 30;
	var activeSpeakerMarginCenter = 1;
	var activeSpeakerAspectRatio = 4 / 3;

	var noSpeakerTimeout;
	var switchingTimeout;
	var videotimeout;
	var activeSpeakerHistory = [];

	var switchingMode = 1;

	var numberOfRealOthersInMeeting = 0;

	var nPages = 1;
	var currentPage = 1;

	isVideoSmall = false;

	isExperimentalEnabled = false;

	currentVisibleParticipants = 1;
	currentNumberParticipants = 2;

	finalColumns = 1;
	finalRows = 1;
	
	var mouseMoveTimer;


	isAuto = true;
	isActive = false;
	isSmart = false;
	isShare = false;

	isFullBleed = false;

	presenterWidth = 160;
	isConstrainedVertically = true;
	equalAdjust = false;
	adjustedWidth = null;
	shareRatio = 16 / 9;
	presenterRatio = 16 / 9;

	verticalRatioTop = 1;
	horizontalRatioLeft = 1;

	offsetDistance = 16;
	snapDistance = 26;

	offsetDistanceTop = 66;
	snapDistanceTop = 76;
	
	var isFaceTrackingEnabled = false;
	
	var isStable = true;
	var isBeta = false;
	var isDev = false;

	$(document).ready(function() {

		//throw new Error('Safari not supported');
		//alert(navigator.userAgent);

		windowResize();
		printWindowSize();
		setNoParticipants();
		hideControls();
		cursors();
		showHideStuff(1);
		setLayoutMode();
		setPanels();
		$('#minHeight input').val(minVideoHeight);
		//getMinVideoSize();
		share();
		resizePresenter();
		dragAndDrop();
		popoutInit();
		videoButtonInit();
		setSwitchingMode();
		prototpeMenuInit();
		setTheme();
		setMinAspectRatio();
		headerButtonsInit();
		popoverHoverInit();
		muteInit();
		vidInit();
		leaveInit();
		prototypeToolsinit();
		paginationInit();
		experimentalInit();
		$('.equality').click();
		$('#participants>span').eq(0).click();
		$('.aspectMode').eq(0).click();
		//$('.enableExperimental').click();
		$('.fitPopover').show().hide();
		printNPeers();
		faceTrackInit();
		viewModeToggleInit();
		positionHeaderElements();
		checkUrlCode();
		toggleSelf();
		$('#selfVideoContainer').show();
	//	enterToEnterInit();
		uniqueRoomCodeInit();
		checkCookies();
		participantHoverInit()
		
		
		
		//positionSelfVideo();
	}); // onready

//function enterToEnterInit(){
//	$('#frontPage').keydown(function(e) {
//	    if (e.keyCode == 13) {
//	        $(this).closest('form').submit();
//	    }
//	});
//
//}

//function participantHoverInit(){
//	$('.brady').on('mouseover', '.participantContainer', function(){
//		$(this).find('.participantName').stop().fadeIn(0);
//		centerNames();
//	});
//	
//	$('.brady').on('mouseleave', '.participantContainer', function(){
//		$(this).find('.participantName').delay(300).fadeOut(200);
//	});
//
//
//
//}




function checkUrlCode() {
	urlString = window.location.pathname;
	
	isBetaValue = urlString.indexOf("beta");
	isDevValue = urlString.indexOf("dev");
	
	if (isBetaValue !== -1) {isBeta = true; isStable = false; isDev = false}
	if (isDevValue !== -1) {isBeta = false; isStable = false; isDev = true}
		
		
	if (isStable) {

		$('.viewModeToggle').remove();
		$('.networkButton, .moreButton, .minutesButton, .shareButton').remove();
		$('.prototypeTools').remove();
		$('footer').remove();
		$('#meetingInfo').remove();
		$('#meetingName').remove();
		$('.loadGifs').click();
		positionHeaderElements();
		
		$('.participantName').hide();
	
	}
	
	if (isBeta) {
	
		$('.networkButton, .moreButton, .minutesButton').remove();
		$('footer').remove();
		$('#meetingInfo').remove();
		$('#meetingName').remove();
		$('.loadGifs').click();
		positionHeaderElements();
	}
	
	else {
		//$('footer').show();
		$('#meetingInfo').show();
		$('#meetingName').show();
		$('.viewModeToggle').show();
	
	
	}


}

function centerNames() {
	elementsToCenter = $('.participantName:visible');
	elementsToCenter.each(function(index){
		thisWidth = $(this).width();
		thisContainerWidth = $(this).parent().width();
		thisMarginLeft = 0.5 * (thisContainerWidth - thisWidth);
		$(this).css('left', thisMarginLeft)
	});
}

function stopAnimations() {
	$('#pebbleBeachContainer').addClass('noAnimation')

}

	function revealButtonInit() {
		$('.participantContainer').eq(0).mouseenter(function() {
			if (!isSmart) {
				return
			}

			participantX = $(this).offset().left - 14;
			participantY = $(this).offset().top - 14;
			participantW = $(this).width() + 28;
			participantH = $(this).height() + 28;
			scale = (participantH - 25) / participantH;
			$('#revealContainer').css('top', participantY).css('left', participantX).width(participantW).height(participantH).show()
			$(this).addClass('reveal').css('-webkit-transform', 'scale(' + scale + ', ' + scale + ')')
		});

		$('#revealContainer').mouseleave(function() {
			$(this).hide();
			$('.participantContainer').eq(0).removeClass('reveal').css('-webkit-transform', 'scale(1)')
		});

		$('#revealButton').click(function() {
			alert('This would add an active speaker frame here')
		});
	}



	function experimentalInit() {
		$('.enableExperimental').click(function() {
			//revealButtonInit();
			isExperimentalEnabled = true;

			$('.experimental').show();
			$(this).addClass('ticked disabled').html('Experimental Features Enabled');
			windowResizeActions()
		});
	}
	
	
	
	function faceTrackInit() {
			$('.enableFaceTracking').click(function() {
				//revealButtonInit();
				if ($(this).hasClass('ticked')){
					$(this).removeClass('ticked').html('Enabled Face Tracking');
					isFaceTrackingEnabled = false;
				
				}
				else {
				isFaceTrackingEnabled = true;
	
				$(this).addClass('ticked').html('Face Tracking Enabled');
				
				}
				nudgeAllVideos()
			});
		}



	function viewModeToggleInit() {
		$('.viewModeToggle').click(function() {
			
			if ($(this).hasClass('selected')) {
				return false
			}
			if ($(this).hasClass('activeSpeakerMode')) {
				$('li.mode.activeSpeaker').click()
			}
			if ($(this).hasClass('gridMode')) {
				$('li.mode.equality').click()
			}
			$('.viewModeToggle').toggleClass('selected')

		});

	}



	function prototypeToolsinit() {
		$('.startSwitching').click(function() {
			defineActiveSpeaker();
			$('.switchMode.disabled').removeClass('disabled');
			$(this).addClass('ticked disabled').html('Switching Started');
		});
	}

	function popoutInit() {
		$('.popoutControl').click(function() {
			if ($(this).parent().hasClass('shareContent')) {
				popoutShareContent()
			}
		});
	}

	function popoutShareContent() {
		$(window).trigger('share-pop');
	}

	function uniqueRoomCodeInit() {
		uniqueCode = "";
		codeLength = 5;
		//ABCDEFGHIJKLMNOPQRSTUVWXYZ
		sourceString = "abcdefghijklmnopqrstuvwxyz1234567890";
		sourceStringlength = sourceString.length;

		for (var i = 0; i < codeLength; i++) {
			newCharacter = "";

			positionInSourceString = Math.floor((Math.random() * sourceStringlength))
			newCharacter = sourceString[positionInSourceString];
			//console.log(newCharacter);
			uniqueCode = uniqueCode + newCharacter
		}

		$('#frontPage input.meetingId').val(uniqueCode).select();
		$('.startButton, .copyButton').removeClass('inactive');
		$('#clipboardCheckbox').attr('disabled', false);
	}



	function setMinAspectRatio() {
		$('li.aspectMode').click(function() {
			$('li.aspectMode').removeClass('selected ticked');
			isAspectOptimized = false;
			$(this).addClass('selected ticked');
			aspectMode = $(this).prevAll('li.aspectMode').length;
			if (aspectMode == 0) {
				narrowAspectRatio = 8 / 9
			};
			if (aspectMode == 1) {
				narrowAspectRatio = 1
			};
			if (aspectMode == 2) {
				narrowAspectRatio = 4 / 3
			};
			if (aspectMode == 3) {
				narrowAspectRatio = 16 / 9
			};
			if (aspectMode == 4) {
				narrowAspectRatio = 8 / 9;
				isAspectOptimized = true
			};

			windowResizeActions()
		});

	}


	function leaveInit() {
		$('.leaveButton').click(function() {
			headTrackUI.stop();
			//location.href = '/';
			if (confirm('Leave the video room?')){
			open(location, '_self').close();
			}
		});
	}


	function muteInit() {
		$('.micButton').click(function() {
			thisButton = $(this);
			if (thisButton.hasClass('micOn')) {
				turnMicOff();
				return
			}
			if (thisButton.hasClass('micOff')) {
				turnMicOn();
				return
			}
		});

		function turnMicOff() {

			thisButton.addClass('micOff').removeClass('micOn');
			conf.muteLocalAudioStream()
		}

		function turnMicOn() {
			thisButton.addClass('micOn').removeClass('micOff');
			conf.unmuteLocalAudioStream()
		}

	}


	function vidInit() {
		$('.cameraButton, .videoItem').click(function() {
			thisButton = $(this);
			if (thisButton.hasClass('videoOn')) {
				turnVideoOff();
				return
			}
			if (thisButton.hasClass('videoOff')) {
				turnVideoOn();
				return
			}
		});

		function turnVideoOff() {

			$('.cameraButton, .videoItem').addClass('videoOff').removeClass('videoOn');
			conf.pauseLocalVideoStream()
		}

		function turnVideoOn() {
			$('.cameraButton, .videoItem').addClass('videoOn').removeClass('videoOff');
			conf.unpauseLocalVideoStream()
		}

	}


	function headerButtonsInit() {
		$('.moreButton').mousedown(function() {
			if ($(this).hasClass('openPopover')) {
				$(this).removeClass('openPopover');
				$('.moreMenu').hide();
			} else {
				openMorePopover()
			}
		});
		
		$('.inviteButton').mousedown(function() {
			if ($(this).hasClass('openPopover')) {
				$(this).removeClass('openPopover');
				$('.inviteMenu').hide();
			} else {
				openInvitePopover()
			}
		});
	}

	function popoverHoverInit() {
		$('.more li').mouseenter(function() {
			$(this).addClass('hover')
		});

		$('.more li').mouseleave(function() {
			$(this).removeClass('hover')
		});
	}


	function openMorePopover() {
		thisButton = $('.moreButton');
		thisButton.addClass('openPopover');
		$('.moreMenu').show();
		positionVisibleFitMenu()

	}
	
	function openInvitePopover() {
			thisButton = $('.inviteButton');
			thisButton.addClass('openPopover');
			$('.inviteMenu').show();
			positionVisibleFitMenu()
	
		}

	function positionVisibleFitMenu() {
		thisPopover = $('.fitPopover:visible');
		thisButton = $('.moreButton');
		
		if (!thisButton.hasClass('openPopover')){
			thisButton = $('.inviteButton');
		}
		
		$('.more').children().show().removeClass('hiddenLi').css('-webkit-border-top-left-radius', '').css('-webkit-border-top-right-radius', '');
		if ($('.networkButton:visible').length > 0) {
			$('.networkItem').hide().addClass('hiddenLi');
		}
		if ($('#meetingName:visible').length > 0) {
			$('.infoItem').hide().addClass('hiddenLi');
		}
		if ($('.minutesButton:visible').length > 0) {
			$('.minutesItem').hide().addClass('hiddenLi');
		}
		if ($('.cameraButton:visible').length > 0) {
			$('.videoItem').hide().addClass('hiddenLi');
		}

		$('.more hr').hide();
		nOverflow = $('.overflowItem').length;
		if ($('.hiddenLi').length < nOverflow) {
			$('.more hr').show()
		}
		$('.more *:visible').eq(0).css('-webkit-border-top-left-radius', '7px').css('-webkit-border-top-right-radius', '7px')



		thisButtonWidth = thisButton.outerWidth();
		thisButtonHeight = thisButton.outerHeight();
		thisButtonOffsetLeft = thisButton.offset().left;
		thisButtonOffsetTop = thisButton.offset().top;
		thisPopoverWidth = thisPopover.outerWidth();
		thisPopoverHeight = thisPopover.outerHeight();
		$('.nubDark').css('left', "");
		//alert (thisButtonOffsetTop);

		thisPopoverOffsetLeft = thisButtonOffsetLeft + (thisButtonWidth / 2) - (thisPopoverWidth / 2);
		thisPopoverOffsetTop = thisButtonOffsetTop - thisPopoverHeight + 1;

		thisPopover.css('left', thisPopoverOffsetLeft).css('top', thisPopoverOffsetTop);


		//check for fit at top

		screenTop = 0;
		if (thisPopoverOffsetTop <= screenTop) {
			//alert('clash')
			newOffsetTop = thisButtonOffsetTop + thisButtonHeight - 1;
			thisPopover.css('top', newOffsetTop);
			$('.up').show().css('display', 'inline-block');
			$('.down').hide()
		}

		//check for LH side fit
		screenLeft = 0;
		if (thisPopoverOffsetLeft <= screenLeft) {
			//alert('clash')
			newOffsetleft = screenLeft + 5;
			thisPopover.css('left', newOffsetleft);
		}

		screenRight = screenLeft + $(window).width();
		RHSideofPopover = thisPopoverOffsetLeft + thisPopoverWidth;
		if (RHSideofPopover >= screenRight) {
			//alert('clash')
			newOffsetleft = screenRight - thisPopoverWidth - 2;
			thisPopover.css('left', newOffsetleft);

			nudgeDist = thisPopoverOffsetLeft - newOffsetleft;
			$('.nubDark').css('left', nudgeDist);

		}

	}

	function positionHeaderElements() {
		windowWidth = $(window).width();
		if (windowWidth < 500) {
			windowWidth = 500
		};
		if (windowWidth < 700) {
			isSmallIcons = true
		};

		//		if (isSmallIcons){
		//			
		//		
		//		}
		//		
		//		else{

		$('#leftButtons').hide();
		$('.leaveButton, .cameraButton, .minutesButton').show();
		centralButtonsWidth = $('#centralButtons').width();
		centralLeftOffset = (windowWidth - centralButtonsWidth) / 2;
		centralLeftOffsetLong = centralLeftOffset
		centralRightPosition = centralLeftOffset + centralButtonsWidth;


		rightButtonsWidth = $('#rightButtons').outerWidth();
		rightButtonsLeft = windowWidth - rightButtonsWidth;

		rightLeftOffset = windowWidth - rightButtonsWidth;

		$('#meetingName').show();
		$('#meetingName').css('width', 'auto');
		meetingNameRight = $('#meetingName').outerWidth();

		if (centralRightPosition > rightButtonsLeft + 25 || meetingNameRight < 100) { //clash	
//			if (!isStable) {
//			
//				$('.cameraButton, .minutesButton').hide();
//				centralButtonsWidth = $('#centralButtons').width();
//				centralLeftOffset = (windowWidth - centralButtonsWidth) / 2;
//			
//			}
		}

//alert (centralLeftOffset);
		$('#centralButtons').css('left', centralLeftOffset);
		$('#rightButtons').css('left', rightLeftOffset);
		$('#leftButtons').css('left', 0);

		//do title stuff



		if (meetingNameRight > centralLeftOffset) { //truncate meeting name
			meetingNameWidth = centralLeftOffset;
			$('#meetingName').css('width', meetingNameWidth);
		}

		if (centralLeftOffsetLong < 130) {
			$('#meetingName, #rightButtons').hide();
			//$('#leftButtons').show();

		}

		//		}


	}



	function setTheme() {
		$('li.themeMode').click(function() {
			$('li.themeMode').removeClass('selected ticked');
			$(this).addClass('selected ticked');
			themeMode = $(this).prevAll('li.themeMode').length;
			if (themeMode == 0) {
				$('#pebbleBeachContainer').removeClass('style1')
			};
			if (themeMode == 1) {
				$('#pebbleBeachContainer').addClass('style1')
			};
		});
	}



	function prototpeMenuInit() {


		$('#menuContainer li, #menuContainer ul').not('.sectionHeading, .participantNumber').hover(function() { // delegation does not work properly here
			$(this).addClass("hover");
		}, function() {
			$(this).removeClass("hover");
		});


		$('.prototypeTools').click(function() { // delegation does not work properly here
			if ($(this).hasClass('openToolsMenu')) {
				$(this).removeClass('openToolsMenu');
				$('#menuContainer').hide()
			} else {
				$(this).addClass('openToolsMenu');
				$('#menuContainer').show()
			}
		});


	}



	function setSwitchingMode() {
		$('li.switchMode').click(function() {
					 		
			if ($(this).hasClass('disabled')) {
				return
			}
			$('li.switchMode').removeClass('selected ticked');
			$(this).addClass('selected ticked');

			switchingMode = $(this).prevAll('li.switchMode').length + 1;

			
		});
	}





	function defineActiveSpeaker() {
		//define current active speaker
		//do it randomly for now out of the currently active people
		//choose a random participant and make them speak for between 3 and 10 seconds. Then choose another.
		minTimespeaking = 1000; //ms
		maxTimeSpeaking = 12000; //ms
		noSpeakerDwellTime = 3000; //ms				

		switchingTimeout = setTimeout(switchActiveSpeaker, minTimespeaking);

		function switchActiveSpeaker() {
			prevActiveSpeakerID = $('.activeSpeakerVideo video').attr('data-id');

			//console.log ("Switching mode: " + switchingMode);

			speakerCandidates = $('.activeParticipant');
			nSpeakerCandidates = speakerCandidates.length;

			//figure number of visible candidates, i.e. because of scrollbar
			canvasWidth = $('#canvas').width();
			noOfFullThumbnailsVisible = (canvasWidth - thumbnailLeftPadding - (thumbnailHeight * thumbnailRatio)) / ((thumbnailHeight * thumbnailRatio) + thumbnailMargin);
			noOfFullThumbnailsVisible = Math.floor(noOfFullThumbnailsVisible);
			noOfFullThumbnailsVisible = noOfFullThumbnailsVisible + 1;
			noOfFullThumbnailsVisible = Math.min(noOfFullThumbnailsVisible, nSpeakerCandidates);
			//

			speakerTime1 = Math.random() * (maxTimeSpeaking - minTimespeaking) + minTimespeaking;
			speakerTime2 = Math.random() * (maxTimeSpeaking - minTimespeaking) + minTimespeaking;
			speakerTime3 = Math.random() * (maxTimeSpeaking - minTimespeaking) + minTimespeaking;
			speakerTime = Math.min(speakerTime1, speakerTime2, speakerTime3);
			speakerTime = Math.floor(speakerTime);
			//console.log ("speaker time: " + speakerTime);


			speakerN1 = Math.random() * (nSpeakerCandidates + 1);
			speakerN2 = Math.random() * (nSpeakerCandidates + 1);
			speakerN3 = Math.random() * (nSpeakerCandidates + 1);
			speakerN = Math.min(speakerN1, speakerN1, speakerN1);
			speakerN = Math.floor(speakerN) + 1;


			$('.participantContainer').removeClass('currentSpeaker');

			if (speakerN != 1) { //speaker pN (2-12)

				clearTimeout(noSpeakerTimeout);

				participantClass = "p" + speakerN;

				//clear all values in active speaker history that match and then push the new value to the front
				activeSpeakerHistory = jQuery.grep(activeSpeakerHistory, function(n, i) {
					return (n != speakerN);
				});

				activeSpeakerHistory.unshift(speakerN);


				//console.log(activeSpeakerHistory);

				thisVideoElement = $('.brady video.' + participantClass);

				thisVideoElement.closest('.participantContainer').addClass('currentSpeaker spoken');

				if (!thisVideoElement.closest('.participantContainer').hasClass('pinned')) {



					currentSpeakerDataId = thisVideoElement.attr('data-id');
					currentSpeakerSrc = thisVideoElement.attr('src');
					if (!currentSpeakerDataId) {
						currentSpeakerDataId = ""
					}
					if (!currentSpeakerSrc) {
						currentSpeakerSrc = ""
					}
					if (prevActiveSpeakerID != currentSpeakerDataId) {
						$('.activeSpeakerVideo video').attr('src', currentSpeakerSrc).attr('data-id', currentSpeakerDataId);
					}
					$('.activeSpeakerVideo video').removeClass().addClass(participantClass);
				} else {
					$('#activeSpeakerContainer .promoted video.' + participantClass).closest('.participantContainer').addClass('currentSpeaker');

				}

				//setParticipantInOverflowToBlue();


				//if the new speaker is not one of the visible lot, then switch it with the least recent visible one
				//get position of currentSpeaker in array of activeParticipants

				$('.activeParticipant').each(function(index) {
					if ($(this).hasClass('currentSpeaker')) {
						spotOfActive = index + 1
					}
				});
				//console.log(spotOfActive);

				if (switchingMode == 1) {
					if (spotOfActive > noOfFullThumbnailsVisible) { //speaker in overflow
						visibleActiveParticipantsArray = $('.activeParticipant').slice(0, noOfFullThumbnailsVisible);


						visibleActiveParticipantsArray.each(function(index) {
							notSpokenIndex = -1;
							if (!$(this).hasClass('spoken')) {
								notSpokenIndex = index;
								return false
							}
						});

						//console.log (notSpokenIndex);

						if (notSpokenIndex != -1) { //non-spoken so take leftmost 
							slotOfLeastActiveVisible = notSpokenIndex + 1
						} else { //all visible have spoken so take least recent

							//	pNOfLeastActiveVisible = 0;
							slotOfLeastActiveVisible = null;
							placeOfLeastRecentParticipant = 1;
							//get position of least recent visible

							//console.log (visibleActiveParticipants.length); //
							visibleActiveParticipantsArray.each(function(index) {
								//get pN for this
								thisClassPN = $(this).find('video').attr('class');
								thisClassPN = thisClassPN.split("p")[1];
								thisClassPN = parseInt(thisClassPN);
								//index of thisClassPN within activeSpeakerHistory = place in history (1 = active)
								placeOfThisParticipantInHistoryList = activeSpeakerHistory.indexOf(thisClassPN) + 1;
								//console.log ("place in history: " + placeOfThisParticipantInHistoryList);

								if (placeOfThisParticipantInHistoryList > placeOfLeastRecentParticipant) {
									placeOfLeastRecentParticipant = placeOfThisParticipantInHistoryList;
									slotOfLeastActiveVisible = index + 1;
									pNOut = thisClassPN;
								}
							});
						}
						//console.log ("" + activeSpeakerHistory + ", " + indexOfActive + ", " + pNOut)
						//noOfFullThumbnailsVisible
						//activeSpeakerHistory

						//switch 'em
						//switchThumbnails(slotOfLeastActiveVisible, noOfFullThumbnailsVisible + 1)
						switchThumbnails(slotOfLeastActiveVisible, spotOfActive);
					}
				}
			} else { // no-speaker
				noSpeakerTimeout = setTimeout(function() {
					$('.activeSpeakerVideo video').removeClass().attr('src', '').attr('data-id', '')
				}, noSpeakerDwellTime);
			}

			if (switchingMode == 2) {
				orderThumbnailsByRecency();
			}

			setTimeout(switchActiveSpeaker, speakerTime)
		}
		//choose a time

		//add to active spoeaker array (list of active speakers by time

		//reduce array down to individuals by most recent activeness

		//based on who is currently visible in the thumbnail strip, reposition if necessary, i.e. swap more recent people with less recent people

	}

	function switchThumbnails(slot1, slot2) { //slot1 < slot2
		if (!isSmart) {
			console.log("" + slot1 + ", " + slot2);
			index1 = slot1 - 1;
			index2 = slot2 - 1;

			slot1Element = $('.brady .activeParticipant').eq(index1);
			slot2Element = $('.brady .activeParticipant').eq(index2);

			//if (slot1Element.hasClass('pinned')){return}

			slot1Left = slot1Element.position().left;
			slot2Left = slot2Element.show().position().left;

			$('.brady .activeParticipant').eq(index1).insertAfter($('.brady .activeParticipant').eq(index2 - 1)).css('left', slot2Left);
			$('.brady .activeParticipant').eq(index2).insertBefore($('.brady .activeParticipant').eq(index1)).css('left', slot1Left);
			layoutVideos(currentNumberParticipants);
		}
	}


	function orderThumbnailsByRecency() {
		//		allActive = $('.activeParticipant');
		//		$('.activeParticipant').remove();
		//		allActive.each(function(index){
		//			thisClassPN = $(this).find('video').attr('class');
		//			thisClassPN = thisClassPN.split("p")[1];
		//			thisClassPN = parseInt(thisClassPN);
		//		});
		//		activeSpeakerHistory
		if (isSmart) {
			return false
		}

		$.each(activeSpeakerHistory, function(index, value) {
			targetvideoClass = "p" + value;
			thisContainer = $("." + targetvideoClass).closest('.activeParticipant');

			if (index == 0) {
				$('.brady').prepend(thisContainer)
			} else {
				thisContainer.insertBefore($('.activeParticipant').eq(index))
			}
		});
		layoutVideos(currentNumberParticipants);

	}

	function videoButtonInit() {

		$('#pebbleBeachContainer').on("mouseenter", '.participantContainer', function(event) {
			if (isActive && isExperimentalEnabled) {
				$(this).find('.videoButton').show()
			}
		});

		$('#pebbleBeachContainer').on("mouseleave", '.participantContainer', function(event) {
			$(this).find('.videoButton').hide()
		});


		$('#pebbleBeachContainer').on("click", '.brady .videoButton.pin', function(event) {
			if ($('.pinned').length >= 2) {
				alert('Only allowed 2 pinned participants (for now)');
				return false
			}
			thisParticipantContainer = $(this).closest('.participantContainer');

			if ($('.pinned').length == 0) {
				thisParticipantContainer.prependTo('.brady')
			} else if ($('.pinned').length > 0) {
				thisParticipantContainer.insertAfter('.pinned')
			}

			thisParticipantContainer.addClass('pinned spoken');

			thisClassString = thisParticipantContainer.find('video').attr('class');
			thisIDstring = thisParticipantContainer.find('video').attr('id');
			thisAttributeString = thisParticipantContainer.find('video').attr('src');
			//add class to available promoted spot
			$('#activeSpeakerContainer .participantContainer').not('.activeSpeakerVideo, .promoted').eq(0).addClass('promoted').show().find('video').attr('class', thisClassString).attr('id', thisIDstring).attr('src', thisAttributeString);
			layoutVideos(currentNumberParticipants);
			centerNames();
			//layoutVideos(currentNumberParticipants);
		});


		$('#pebbleBeachContainer').on("click", '#activeSpeakerContainer .videoButton.pin', function(event) {
			thisParticipantContainer = $(this).closest('.participantContainer');
			thisParticipantContainer.removeClass('promoted').hide();
			thisVideo = thisParticipantContainer.find('video');
			thisClassString = thisVideo.attr('class');

			thisVideo.attr('src', '').removeAttr('id').css('background-image', '');
			// thisVideo[0].src ="";

			//restore appropriate thumbnail



			$('.brady .participantContainer').find("." + thisClassString).closest('.participantContainer').removeClass('pinned');
			layoutVideos(currentNumberParticipants);
			centerNames()
		});


	}


	function toggleSelf() {
		$("#selfVideoContainer").mouseup(function(e) {
		//e.stopPropogation();
		//alert ('toggle mouse up');
		
	
		
						
						
			var thisElement = $(this);
			
				
			
			if ($(this).hasClass('movedDragElement')) {
				return
			}
			
			else {
			
			//thisElement.css('-webkit-transition', 'all 250ms');
				if ($(this).hasClass('minimized')){
					restoreSelf()
				}
				else{
					minimizeSelf()
				}
				
				
			}
			
			
			//verticalRatioTop = dragElement.position().top / (canvasHeight - dragElementHeight);
		//	horizontalRatioLeft = dragElement.position().left / (canvasWidth - dragElementWidth);
			
			
			function minimizeSelf() {
//				isSnappedRight = false;
//				isSnappedLeft = false;
//				isSnappedTop = false;
//				isSnappedBottom = false;
//				
				dragWidth = $('#pebbleBeachContainer').width();
				dragHeight = $('#pebbleBeachContainer').height();
//				
				//get Current location
//				posX = thisElement.position().left;
//				posY = thisElement.position().top;
				//isSnappedTop, isSnappedBottom, isSnappedRight, isSnappedLeft
//				if (thisElement.hasClass('snapRight')){isSnappedRight = true}
//				if (thisElement.hasClass('snapLeft')){isSnappedLeft = true}
//				if (thisElement.hasClass('snapTop')){isSnappedTop = true}
//				if (thisElement.hasClass('snapBottom')){isSnappedBottom = true}
				//write location and status to data
//				
//				thisElement.data("locationState", {
//					x: posX,
//					y: posY,
//					r: isSnappedRight,
//					l: isSnappedLeft,
//					t: isSnappedTop,
//					b: isSnappedBottom,
//				});
//				
				//figure target coordinates
				
				
				thisElement.addClass('minimized');
				thisWidth = 40;
				thisHeight = 30;
//				
				targetX = dragWidth - thisWidth - offsetDistance;
				targetY = dragHeight - thisHeight - offsetDistance;
				//animate to minimized spot
				thisElement.css('top', targetY).css('left', targetX);
				
//				setTimeout(function() {
//									thisElement.css('-webkit-transition', '');
//								}, 250);
			}
			
			function restoreSelf() {
				
				
				dragWidth = $('#pebbleBeachContainer').width();
				dragHeight = $('#pebbleBeachContainer').height();
			
			
				//read target location and status
				targetX = dragWidth * horizontalRatioLeft;
				targetY = dragHeight * verticalRatioTop;
				
				thisElement.removeClass('minimized');
//				thisWidth = thisElement.width();
//				thisHeight = thisElement.height();
//				
//				if (thisElement.data('locationState').r){targetX = dragWidth - thisWidth - offsetDistance; thisElement.addClass('snapRight')}
//				if (thisElement.data('locationState').l){targetX = offsetDistance; thisElement.addClass('snapLeft')}
//				if (thisElement.data('locationState').t){targetY = offsetDistance; thisElement.addClass('snapTop')}
//				if (thisElement.data('locationState').b){targetY = dragHeight - thisHeight - offsetDistance; thisElement.addClass('snapBottom')}
				
				//figure target coordinates
				//animate to restored location
				thisElement.css('left', targetX).css('top', targetY);
				positionSelfVideo();
				
//				setTimeout(function() {
//									thisElement.css('-webkit-transition', '');
//								}, 250);
			}
			
			
			
			
		});
		
		

	}


	function doShareVisibility() {
		if ($('.maximizeControl').hasClass('maximized')) {
			$('#shareContainerMaximized').show();
			$('#shareContainer,  #thumbnail').css('visibility', 'hidden')
		} else {
			$('#shareContainerMaximized').hide();
			$('#shareContainer,  #thumbnail').css('visibility', 'visible')
		}
	}


	function positionSelfVideo() {
		//current %age position
//		if (!verticalRatioTop) {
//			return
//		}


		canvasWidth = $('#pebbleBeachContainer').width();
		canvasHeight = $('#pebbleBeachContainer').height();
		canvasTop = $('#pebbleBeachContainer').offset().top;

		thisElement = $('#selfVideoContainer');
		
		
		
		videoWidth = thisElement.width();
		videoHeight = thisElement.height();
		
		
		if (thisElement.hasClass('minimized')) {
//					newLeft = canvasWidth - videoWidth - offsetDistance;
//					newTop = canvasHeight - videoHeight - offsetDistance;
					//alert (horizontalRatioLeft);
//			
//					thisElement.css('left', newLeft).css('top', newTop);
//					
//					return
			videoWidth = 40;
			videoHeight = 30;
		}


		newLeft = horizontalRatioLeft * (canvasWidth);
		newTop = verticalRatioTop * (canvasHeight);
		//alert (horizontalRatioLeft);

		thisElement.css('left', newLeft).css('top', newTop);
		
		//check for out of range
		
		if (newLeft <= offsetDistance){thisElement.addClass('snapLeft')}
		if (newTop <= offsetDistanceTop){thisElement.addClass('snapTop')}
		if (newLeft + videoWidth >= canvasWidth - offsetDistance){thisElement.addClass('snapRight')}
		if (newTop + videoHeight >= canvasHeight - offsetDistance){thisElement.addClass('snapBottom')}

		if (thisElement.hasClass('snapTop')) {
			thisElement.css('top', offsetDistanceTop)
		}
		
		if (thisElement.hasClass('snapLeft')) {
			thisElement.css('left', offsetDistance)
		}
		
		if (thisElement.hasClass('snapRight') || thisElement.hasClass('minimized')) {
			thisElement.css('left', canvasWidth - offsetDistance - videoWidth)
		}
		if (thisElement.hasClass('snapBottom') || thisElement.hasClass('minimized')) {
			thisElement.css('top', canvasHeight - offsetDistance - videoHeight)
		}

	}

	function dragAndDrop() {
		$(".dragAndDrop, .participantContainer").mousedown(function(e) {

			if ($(this).hasClass(promoted)){return}

			dragElement = $(this);

			if (dragElement.hasClass('minimized')){return}
			if (dragElement.hasClass('participantContainer') && isExperimentalEnabled == false) {return}

			dragElement.addClass('dragObject');
			dragElementWidth = dragElement.width();
			dragElementHeight = dragElement.height();

			canvasWidth = $('#pebbleBeachContainer').width();
			canvasHeight = $('#pebbleBeachContainer').height();
			canvasTop = $('#pebbleBeachContainer').offset().top;

			cursorStartX = e.pageX;
			cursorStartY = e.pageY;

			dragStartTop = dragElement.position().top;
			dragStartLeft = dragElement.position().left;

			$(document).mousemove(function(event) {

				dragElement.addClass('movedDragElement');

				if (dragElement.hasClass('participantContainer')) {
					if ($('.ghost').length == 0) {
						dragElement.clone().addClass('ghost').removeClass('movedDragElement').insertBefore(dragElement);
						makeDropTargets()
					}

					currentTargetIndex = null;

					$('.dropTarget').mouseenter(function(event) {
						thisTarget = $(event.target);
						totalTargets = $('.dropTarget').length;
						thisTargetIndex = thisTarget.prevAll('.dropTarget').length;
						if (thisTargetIndex != currentTargetIndex) {
							console.log(thisTargetIndex);
							if (thisTargetIndex == totalTargets - 1) {
								thisTargetLocation = $('.brady .participantContainer:visible').last();
								$('.ghost').insertAfter(thisTargetLocation);
							} else {
								thisTargetLocation = $('.brady .participantContainer:visible').not('.ghost, .movedDragElement').eq(thisTargetIndex);
								$('.ghost').insertBefore(thisTargetLocation);
							}
							$('.participantContainer').not('.movedDragElement').css('-webkit-transition', 'all 250ms');

							if (isActive) {
								doBestLayout($('.brady'), $('.activeParticipant').not('.movedDragElement').not('.pinned'))
							} else {
								doBestLayout($('.brady'), $('.activeParticipant').not('.movedDragElement'))
							}


							$('.movedDragElement').show();
							//$('.participantContainer').css('-webkit-transition', '');
							currentTargetIndex = thisTargetIndex;
						}

					});

//					$('.dropTargetPromotion').mouseenter(function(event) {
//						numberOfActiveVideos = $('#activeSpeakerContainer>.participantContainer:visible').length;
//						if (numberOfActiveVideos == 1) {
//							$('.ghost').hide();
//							$('#activeSpeakerContainer>.participantContainer').not('.activeSpeakerVideo').first().addClass('ghost').show();
//							doActiveSpeakerLayout(); 
//						}
//
//						if (numberOfActiveVideos == 2) {
//
//						}
//
//						if (numberOfActiveVideos == 3) {
//
//						}
//
//					})

				}

				deltaX = event.pageX - cursorStartX;
				deltaY = event.pageY - cursorStartY;

				targetLeft = dragStartLeft + deltaX;
				targetTop = dragStartTop + deltaY;

				rightExtent = targetLeft + dragElementWidth;
				bottomExtent = targetTop + dragElementHeight;

				dragElement.css('left', targetLeft);
				dragElement.css('top', targetTop);
				dragElement.removeClass('snapTop snapBottom snapLeft snapRight');

				if (targetLeft <= snapDistance) {
					dragElement.css('left', offsetDistance).addClass('snapLeft')
				}
				if (rightExtent >= canvasWidth - snapDistance) {
					dragElement.css('left', canvasWidth - offsetDistance - dragElementWidth).addClass('snapRight')
				}
				if (targetTop <= snapDistanceTop) {
					dragElement.css('top', offsetDistanceTop).addClass('snapTop')
				}
				if (bottomExtent >= canvasHeight - snapDistance) {
					dragElement.css('top', canvasHeight - offsetDistance - dragElementHeight).addClass('snapBottom')
				}
				//if (rightExtent >= canvasWidth - snapDistance){dragElement.css('left', canvasWidth - offsetDistance - dragElementWidth)}
			});

			$(document).mouseup(function(e) {
				//alert ('drag mouse up');
				$(document).unbind('mousemove');



				if (dragElement.hasClass('participantContainer')) {
					$('.dropTarget').unbind('mouseenter').remove();
//					$('.dropTargetPromotion').unbind('mouseenter').remove();
					$('.movedDragElement').insertAfter('.ghost');
					$('.ghost').remove();
					$('.movedDragElement').css('-webkit-transition', 'all 250ms');

					if (isActive) {
						doBestLayout($('.brady'), $('.activeParticipant').not('.pinned'))
					} else {
						doBestLayout($('.brady'), $('.activeParticipant'))
					}


				}
				//alert('hi');
				if (dragElement.attr('id') == "selfVideoContainer") {
					if (!dragElement.hasClass('movedDragElement')){return}
					verticalRatioTop = dragElement.position().top / (canvasHeight);
					horizontalRatioLeft = dragElement.position().left / (canvasWidth);
					console.log(verticalRatioTop);
					console.log(horizontalRatioLeft);
				}

				$('.dragObject').removeClass('dragObject movedDragElement');

				setTimeout(function() {
					$('.participantContainer').css('-webkit-transition', '');
				}, 250);
			});
		});
	}


	function makeDropTargets() {
		//drop target is existing participant
		$('.brady .participantContainer.activeParticipant:visible').not('.movedDragElement').each(function() {
			thisHeight = $(this).height() + 20;
			thisWidth = $(this).width() + 20;
			thisX = $(this).offset().left - 10;
			thisY = $(this).offset().top - 10;
			$('#pebbleBeachContainer').append('<div class="dropTarget">');
			$('.dropTarget').last().width(thisWidth).height(thisHeight).css('top', thisY).css('left', thisX)
		});

//		if (isActive){
//				promotionTargetHeight = $('#activeSpeakerContainer').height();
//				promotionTargetWidth = $('#activeSpeakerContainer').width() / 3;
//
//				$('#pebbleBeachContainer').append('<div class="dropTargetPromotion">');
//				$('.dropTargetPromotion').last().width(promotionTargetWidth * 2).height(promotionTargetHeight).css('top', 0).css('left', 0);
//
//				$('#pebbleBeachContainer').append('<div class="dropTargetPromotion">');
//				$('.dropTargetPromotion').last().width(promotionTargetWidth).height(promotionTargetHeight).css('top', 0).css('right', 0);
//
//		}
		
	}

	function resizePresenter() {
		$(".grabContainer").mousedown(function(e) {
			e.preventDefault();
			startX = e.pageX;
			presenterStartWidth = $('.presenter').width();


			criticalWidth = null; //width of presenter where switch between constrained vertical and horizontal
			criticalShareContentWidth = $('#shareContainer').height() * 16 / 9;
			criticalWidth = $('#shareContainer').width() - $('.grabContent').width() - criticalShareContentWidth;

			equalHeightWidth = ((($('#shareContainer').width() - $('.grabContent').width()) - 12)) / 2;

			isStartingBig = false;
			if (presenterStartWidth > criticalWidth) {
				isStartingBig = true
			}


			$(document).mousemove(function(e) {
				deltaX = e.pageX - startX;
				//deltaXFromCritical = e.pageX - startX;
				//console.log(criticalDelta - deltaX);
				//if ($('.presenter').width() > 160 && $('.presenter').width() < $('.shareContent').width()){
				if (isStartingBig) {
					criticalDelta = presenterStartWidth - criticalWidth;
					if (presenterWidth >= 160) {
						if (presenterWidth > criticalWidth) {
							presenterWidth = presenterStartWidth - (deltaX)
						}
						if (presenterWidth <= criticalWidth) {
							presenterWidth = criticalWidth - (2 * (deltaX - criticalDelta))
						}


					}
				}

				if (!isStartingBig) {
					criticalDelta = (presenterStartWidth - criticalWidth) / 2;
					if (presenterWidth >= 160) {
						if (presenterWidth <= criticalWidth) {
							presenterWidth = presenterStartWidth - (2 * deltaX)
						}
						if (presenterWidth > criticalWidth) {
							presenterWidth = criticalWidth - (deltaX - criticalDelta)
						}
					}
				}

				if (presenterWidth < 160) {
					presenterWidth = 160
				}
				if (presenterWidth > equalHeightWidth) {
					presenterWidth = equalHeightWidth
				}

				share();
			});

			$(document).mouseup(function(e) {
				$(document).unbind('mousemove');

			});

		});



	}



	function share() {
		// calculate available space aspect ratio for share content
		// width of available space, width of presenter video width of grabber

		targetPresenterWidth = presenterWidth;

		containerWidth = $('#shareContainer').width();
		grabberWidth = $('.grabber').width() + 12;
		// height of available space
		containerHeight = $('#shareContainer').height();
		shareContentWidth = containerWidth - targetPresenterWidth - grabberWidth;
		apsectRatio = shareContentWidth / containerHeight;

		targetShareWidth = null;

		$('#shareContainerTable').css('left', '').css('top', '');

		if (apsectRatio <= shareRatio) { //more portrait, fill width
			isConstrainedVertically = false;
			targetShareWidth = shareContentWidth;
			shareContentHeight = shareContentWidth / shareRatio;
			presenterHeight = targetPresenterWidth / presenterRatio;
			maxContentHeight = Math.max(shareContentHeight, presenterHeight);
			marginTop = (containerHeight - maxContentHeight) * 0.45;
			$('#shareContainerTable').css('top', marginTop);
		} else if (apsectRatio > shareRatio) { //more landscape, fill height
			isConstrainedVertically = true;
			targetShareWidth = containerHeight * shareRatio;
			tableWidth = $('#shareContainerTable>tbody').width();
			marginLeft = (containerWidth - tableWidth) * 0.5;
			$('#shareContainerTable').css('left', marginLeft);
		}

		$('.shareContent').width(targetShareWidth);
		$('.shareContent').height(targetShareWidth / shareRatio);

		$('.presenter').width(targetPresenterWidth);
		$('.presenter').height(targetPresenterWidth / presenterRatio);

		$('.grabber').css('margin-top', ((targetShareWidth / shareRatio) / 2) - 10);


		if (targetShareWidth <= targetPresenterWidth) {
			equalAdjust = true;
			adjustShare()
		} else {
			equalAdjust = false
		}

		//console.log(equalAdjust);
		//$('#shareContainerTable').height($('.shareContent').height());
		// if more landscape, maximize height
		// if more portrait, maximize width

		//if presenter is bigger than content, adjust size to be equal

	}

	function adjustShare() {
		equalHeightWidth = (($('#shareContainer').width() - $('.grabContent').width()) - 12) / 2;
		equalHeight = equalHeightWidth / shareRatio;
		containerHeight = $('#shareContainer').height();
		adjustedWidth = equalHeightWidth;

		if (equalHeight > containerHeight) { //too tall
			adjustedWidth = containerHeight * shareRatio
		}

		adjustedHeight = adjustedWidth / shareRatio;



		$('.shareContent').width(adjustedWidth);
		shareContentHeight = $('.shareContent').width() / shareRatio;
		$('.shareContent').height(adjustedHeight);
		$('.grabber').css('margin-top', (shareContentHeight / 2) - 10);
		$('.presenter').height(adjustedHeight);
		$('.presenter').width(adjustedWidth);

		tableWidth = $('#shareContainerTable').width();
		containerWidth = $('#shareContainer').width();
		containerHeight = $('#shareContainer').height();


		marginLeft = (containerWidth - tableWidth) * 0.5;
		$('#shareContainerTable').css('left', marginLeft);

		marginTop = (containerHeight - adjustedHeight) * 0.45;
		$('#shareContainerTable').css('top', marginTop);

	}




	function getMinVideoSize() {
		$(document).keyup(function(e) {
			//minVideoHeight = parseInt($('#minHeight input').val());

			//positionThumbnailTable();
			layoutVideos(currentNumberParticipants);
			checkOverflow();
			//positionThumbnailTable();
			layoutVideos(currentNumberParticipants);
			checkOverflow();
			isInputFocus = false;
			isAspectInFocus = false;
			isMinInFocus = false;
		});

	}



	function cursors() {
		$(document).keydown(function(e) {
			//e.preventDefault();

			currentN = currentNumberParticipants;
			totalN = $('#participants>span').size() + 1;
			isInputFocus = $('input').is(":focus");

			if (!isInputFocus && e.keyCode == 37) {
				if (currentN != 1) {
					$('#participants .selected').prev().click()
				}
				return false;
			}

			if (!isInputFocus && e.keyCode == 39) {
				if (currentN != totalN) {
					$('#participants .selected').next().click()
				}
				return false;
			}

			//return false
		});
	}



	function checkOverflow() {
		currentN = currentNumberParticipants;
		visibleN = currentVisibleParticipants;
		if (isSmart && currentN != visibleN + 1) {
			$('#canvas').addClass('overflowGrid');
			$('.overflowStrip').hide();
			$('#dotOverflow').show();

			if (visibleN == 0) {
				noOfDots = 0
			} else if (isSmart) {
				noOfDots = Math.ceil(currentN / visibleN)
			} else {
				noOfDots = 2
			}

			$('.dots').empty();
			for (var i = 0; i < noOfDots; i++) {
				$('.dots').append('<div class="dot"></div>')
			}
		} else {
			$('#canvas').removeClass('overflowGrid');
			$('.overflowStrip').hide();
			$('#dotOverflow').hide();

			//positionThumbnailTable();
			layoutVideos(currentNumberParticipants);

		}


	}
	
	function setCookie(c_name,value,exdays){
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
		document.cookie=c_name + "=" + c_value;
	}
	
	function getCookie(c_name){
		var c_value = document.cookie;
		var c_start = c_value.indexOf(" " + c_name + "=");
		if (c_start == -1)
		  {
		  c_start = c_value.indexOf(c_name + "=");
		  }
		if (c_start == -1)
		  {
		  c_value = null;
		  }
		else
		  {
		  c_start = c_value.indexOf("=", c_start) + 1;
		  var c_end = c_value.indexOf(";", c_start);
		  if (c_end == -1)
		  {
		c_end = c_value.length;
		}
		c_value = unescape(c_value.substring(c_start,c_end));
		}
		return c_value;
	}
	
	function checkCookies(){
		var isAutomaticallyCopying = getCookie("isAutomaticallyCopying");
		  if (isAutomaticallyCopying == "true") {
		 	 $("#clipboardCheckbox").prop("checked", true);
		  }
		else {
		 	 $("#clipboardCheckbox").prop("checked", false);
		  }
	}
	
	

	$(window).on('newPersonJoined', function() {
		printNPeers();
		numberOfRealOthersInMeeting = conf.getNumPeers();
		$('#participants>span').eq(numberOfRealOthersInMeeting - 1).click();


		windowResizeActions()


	});

	$(window).on('personLeft', function() {
		printNPeers();
		numberOfRealOthersInMeeting = conf.getNumPeers();
		if (numberOfRealOthersInMeeting == 0) {
			$('#participants>span').eq(numberOfRealOthersInMeeting).click()
		} else {
			$('#participants>span').eq(numberOfRealOthersInMeeting - 1).click();
		}


		windowResizeActions()


	});

	$(window).on('enteredMeeting', function() {
		if ($('.copy-to-clipboard-checkbox')[0].checked){
				isAutomaticallyCopying = "true"
		}
		else {
				isAutomaticallyCopying = "false"
		}
		
		setCookie('isAutomaticallyCopying',isAutomaticallyCopying, 365)
		
		
		
	});

	$(window).on('shareStart', function() {
		$('li.mode.sharing').click();
		windowResizeActions()
	});

	$(window).on('shareEnd', function() {
		$('li.mode.equality').click();
		windowResizeActions()
	});

	$(window).on('popoutShare', function() {
		$('li.mode.equality').click();
		windowResizeActions()
	});

	$(window).on('closePopoutShare', function() {
		$('li.mode.sharing').click();
		windowResizeActions()


	});

	$(window).on('speakerChange', function(event, eventData) {
		//define the single activest speaker
		
	});



	function checkIsFullBleed() {
		isFullBleed = false;
		$('#buttonShade').hide();
		if (currentVisibleParticipants == 1 && conf.getNumPeers() == 1) {
			isFullBleed = true;
			$('#buttonShade').show()
		}
		return isFullBleed;
	}

	function windowResize() {
		$(window).resize(function() {
			windowResizeActions()
		});
	}
	var resizeTimeout = null;
	
	function windowResizeActions() {
		clearTimeout(resizeTimeout);
		$('#pebbleBeachContainer').addClass('no-transitions');
		resizeTimeout = setTimeout(function(){
			$('#pebbleBeachContainer').removeClass('no-transitions');
		}, 1000);
		$('header>*').stop(true, true).show();
		
		stopAnimations();
		checkIsFullBleed();
		printWindowSize();
		positionHeaderElements();
		//positionThumbnailTable();
		sizeBrady();
		layoutVideos(currentNumberParticipants);

		if (nPages < currentPage) {
			currentPage = nPages;
			$('.dot').eq(currentPage - 1).click()
		}

		checkOverflow();
		share();
		positionSelfVideo();
		positionVisibleFitMenu();
		nudgeAllVideos();
		centerNames()

	}




	function setNoParticipants() {
		$('#participants>span').click(function() {
			text = "p" + $(this).html();
			intendedNumber = parseInt($(this).html());

			$('#participants>span').removeClass('selected');
			$(this).addClass('selected');
			$('#canvas').removeClass().addClass(text);
			currentNumberParticipants = intendedNumber;
			currentVisibleParticipants = currentNumberParticipants - 1;

			if (isSmart && $('.activeSpeaker').hasClass('selected')) {
				isSmart = false;
				isActive = true
			}
			//$('li.mode.selected').click();

			isFullBleed = false;
			if (currentVisibleParticipants == 1 && numberOfRealOthersInMeeting == 1) {
				isFullBleed = true
			}
			if (isActive && currentVisibleParticipants == 1) {
				isActive = false;
				isSmart = true
			};

			checkIsFullBleed();
			checkOverflow();
			showHideStuff(intendedNumber);
			//positionThumbnailTable();
			share();
			layoutVideos(intendedNumber);
			if (nPages < currentPage) {
				currentPage = nPages;
				$('.dot').eq(currentPage - 1).click()
			}
			checkOverflow();
			centerNames()


		});
	}


	function setLayoutMode() {
		$('li.mode').click(function() {
			modeText = $(this).html();

			if ($(this).hasClass("defaultLayout")) {
				mode = "Auto"
			}
			if ($(this).hasClass("activeSpeaker")) {
				mode = "Active"
			}
			if ($(this).hasClass("equality")) {
				mode = "Smart"
			}
			if ($(this).hasClass("sharing")) {
				mode = "Share"
			}

			$('li.mode').removeClass('selected ticked');
			$(this).addClass('selected ticked');
			$('#pebbleBeachContainer').removeClass('Auto Smart Active Share').addClass(mode);


			isAuto = false;
			isActive = false;
			isSmart = false;
			isShare = false;

			switch (mode) {
				case "Auto":
					isAuto = true;
					break;
				case "Active":
					isActive = true;
					break;
				case "Smart":
					isSmart = true;
					break;
				case "Share":
					isShare = true;
					break;
			}

			//console.log(isActive
			if (isActive && currentVisibleParticipants == 1) {
				isActive = false;
				isSmart = true
			}

			//alert ("Auto: "+ isAuto + ", Prominent: " + isProminent + ", Grid: " + isGrid + "Smart: " + isSmart)

			$('#canvas').removeClass('overflowGrid');
			$('.overflowStrip').hide();
			checkOverflow();
			showHideStuff(currentNumberParticipants);
			layoutVideos(currentNumberParticipants);
			//positionThumbnailTable();
			checkOverflow();
			share();
			showHideStuff(currentNumberParticipants);
			nudgeAllVideos();
			$('#participants>span.selected').click();

			//
		});
	}


	function setPanels() {
		$('#plist').click(function() {
			$('#pebbleBeachContainer').removeClass('notesOpen plistOpen');
			$('#plistContent').hide();

			if (!$(this).hasClass('selected')) {
				$(this).addClass('selected ticked');
				isPlistOpen = true;
				$('#pebbleBeachContainer').addClass('plistOpen');
				$('#plistContent').show();
			} else {
				$(this).removeClass('selected ticked');
				isPlistOpen = false
			}


			windowResizeActions();


		});
	}



	function showHideStuff(nParticipants) {
		$('#conversation, #thumbnail, #Active, #canvas>.self, .brady, #shareContainer, #shareContainerMaximized, #activeSpeakerContainer, #activeSpeakerContainer>div').hide();
		$('#minHeight, #aspectRatio').addClass('dim');
		$('#shareContainer,  #thumbnail').css('visibility', 'visible');

		$('#canvas>.self').show();

		if (isAuto) {
			isSmart = false;
			isActive = false;
			if (nParticipants <= 5) {
				isSmart = true;
				$('#pebbleBeachContainer').removeClass('Auto Smart Active Share').addClass('Smart');
				showBrady(nParticipants)
			}
			if (nParticipants > 5) {
				isActive = true;
				$('#pebbleBeachContainer').removeClass('Auto Smart Active Share').addClass('Active');
				showActive(nParticipants);
				$('#activeSpeakerContainer, .promoted, .activeSpeakerVideo').show();
				sizeBrady()
			}
		}

		if (isActive) {
			showBrady(nParticipants);
			$('#activeSpeakerContainer, .promoted, .activeSpeakerVideo').show();
		}

		if (isSmart) {
			showBrady(nParticipants)
		}

		if (isShare) {
			showActive(nParticipants);
			$('#Active').hide();
			$('#thumbnail .p2').parent().hide();
			$('#shareContainer, #shareContainerMaximized').show();
			share();
			doShareVisibility()
		}

		//$('.scrollbar').stop(true, true).delay(2500).fadeOut();

		function showBrady(nParticipants) {
			$('.brady').show();
			sizeBrady();
			$('.brady>.participantContainer').removeClass('activeParticipant').slice(0, (nParticipants - 1)).addClass('activeParticipant');

			$('#minHeight, #aspectRatio, #aspectRatio2').removeClass('dim');
		}


		function showActive(nParticipants) {
			workingN = nParticipants - 1;
			sizeBrady();
			$('.brady>.participantContainer').removeClass('activeParticipant').slice(0, (nParticipants - 1)).addClass('activeParticipant').show();


			$('#thumbnail, #Active').show();
			$('#thumbnail td').show().slice(workingN).hide();
			//positionThumbnailTable();

			if (workingN == 1) {
				$('#Active').removeClass('p3').addClass('p2')
			}
			if (workingN == 2) {
				$('#Active').removeClass('p3').addClass('p2')
			}
			if (workingN > 2) {
				$('#Active').removeClass('p2').addClass('p2')
			}
		}

		function showConversation(nParticipants) {
			$('#canvas>.self').show();
			$('#conversation').css('display', 'inline-block');
			$('#conversation td').show().slice(nParticipants - 1).hide()
		}

	}



	function hideControls() {
		$(document).mouseover(function(event) {
			$('.participantName').stop(true, true).fadeIn(0);
			centerNames();
			positionHeaderElements();
		});

		$(document).mouseleave(function(event) {
			if ($('.openPopover').length > 0) {return}
			$('.participantName').stop(true, true).delay(4000).fadeOut(500);
		});
		
		
		$(window).on('mousemove', function () {
		  $('header, #paginationControls, .viewModeToggle, .overflowStrip').stop(true, true).fadeIn(0);
		  positionHeaderElements();
		  try {
		    clearTimeout(mouseMoveTimer);
		  } catch (e) {}
		  mouseMoveTimer = setTimeout(function () {
		    if ($('.openPopover').length > 0) {return}
		    $('header, #paginationControls, .viewModeToggle, .overflowStrip').stop(true, true).fadeOut(500);
		  }, 3000);
		});

	}


	function printWindowSize() {
		windowWidth = $(window).width();
		windowHeight = $(window).height();
		$('#x').html(windowWidth);
		$('#y').html(windowHeight);
	 	}


	function printNPeers() {

		$('#np').html(conf.getNumPeers());

	}



	function doBestLayout(container, divs) {

		divs.show(); //show them all first and then hide them if they are in overflow

		originalNumberofP = divs.length; //total number of participants

		videoHeight = 1; // trying to maximize videoHeight

		//get canvas size from container
		canvasW = container.width();
		canvasH = container.height();

		//define working layout constants (can vary for special layouts e.g. 1:1)
		workingTopMargin = topMargin;
		workingBottomMargin = bottomMargin;
		workingSideMargin = sideMargin;
		workingVideoBottomPadding = videoBottomPadding;
		workingNarrowAspectRatio = narrowAspectRatio;
		workingWideAspectRatio = wideAspectRatio;
		workingVideoColumnMargin = videoColumnMargin;
		//for special layouts, redefine layout constants
		//special case
		if (checkIsFullBleed()) { //we have a 1:1 call so do a full-bleed
			workingTopMargin = -1;
			workingBottomMargin = -1;
			workingSideMargin = -1;
			workingVideoBottomPadding = 0;
			workingNarrowAspectRatio = 0.01; //Allows full-bleed for all browser sizes
			workingWideAspectRatio = 100; //Allows full-bleed for all browser sizes
		};

		if (isActive) {
			workingNarrowAspectRatio = 1.65;
			workingWideAspectRatio = 16 / 9;
			canvasH = 120;
			minVideoHeight = 90;
			workingVideoColumnMargin = thumbnailMargin;
			workingSideMargin = thumbnailLeftPadding;
		}

		//special case
		if (currentVisibleParticipants == 1 && numberOfRealOthersInMeeting == 0) { //only host in meeting so show placeholder at 16/9
			workingNarrowAspectRatio = 16 / 9
		};

		numberofP = originalNumberofP;
		do { //loop if video < 90
			for (var i = 1; i <= numberofP; i++) {

				candidateNColumns = i; //try all column sizes
				candidateNRows = Math.ceil(numberofP / candidateNColumns); //number of rows

				//special case
				if (isAspectOptimized) { //if the mode is optimized, then for some special layouts, change the constants
					if (candidateNRows >= 2 && numberofP <= 4) { //for 2x2 layout do not allow portrait videos
						workingNarrowAspectRatio = midAspectRatio
					}
					if (numberofP == 2) { //for 1:2 meetings do not allow portrait videos
						workingNarrowAspectRatio = midAspectRatio
					}
				};

				//calculate how full the final row is
				nFinalRow = numberofP % candidateNColumns; //number in final row
				if (nFinalRow == 0) {
					nFinalRow = candidateNColumns
				} // if final row is 0, then it is full

				//calculate "fullness" 
				fullness = nFinalRow / candidateNColumns;

				//continue with calculation if the grid is valid
				if (fullness >= finalRowFill) { //valid configuration so calculate video aspect ratios assuming the videos take up the full screen (then check for aspect ratio validity)

					// do sum and division to calculate video width for this number of columns
					candidateVideoWidth = (canvasW - (workingSideMargin * 2) - ((candidateNColumns - 1) * workingVideoColumnMargin)) / candidateNColumns;

					// do sum and division to calculate video width for this number of columns
					candidateVideoHeight = (canvasH - workingBottomMargin - workingTopMargin - ((candidateNRows - 1) * videoRowMargin) - (candidateNRows * workingVideoBottomPadding)) / candidateNRows;

					//for small canvasH, video size is negative because of margins and padding
					if (candidateVideoHeight < 1) {
						candidateVideoHeight = 1
					} // force video height to fail gracefully

					//calculate aspect ratio of the videos
					candidateAspectR = candidateVideoWidth / candidateVideoHeight;

					//test aspect ration validity and change aspect ratio accordingly
					if (candidateAspectR < workingNarrowAspectRatio) { // the video is too narrow so set to the narrowest aspect ratio
						candidateAspectR = workingNarrowAspectRatio;
						candidateVideoHeight = candidateVideoWidth / candidateAspectR
					}

					if (candidateAspectR >= workingWideAspectRatio) {
						candidateAspectR = workingWideAspectRatio;
						candidateVideoWidth = candidateVideoHeight * candidateAspectR
					}

					//use this layout if corresponding video height is best (so far)
					if (candidateVideoHeight > videoHeight) { //current candidate Height is bigger than previous best
						videoHeight = candidateVideoHeight;
						videoWidth = candidateVideoWidth;
						videoRatio = candidateAspectR;
						nRows = candidateNRows;
						nColumns = candidateNColumns;
					}
				} //end of fullness / valid grid if
			} //end of for loop

			//depaginate
			for (var i = 1; i <= originalNumberofP; i++) {
				pageClass = "page" + i;
				$('.participantContainer').removeClass(pageClass);
			}

			//paginate participants
			nPages = Math.ceil(originalNumberofP / numberofP);

			for (var i = 1; i <= nPages; i++) {
				startIndex = (i - 1) * numberofP;
				endIndex = (i * numberofP);
				pageClass = "page" + i;
				divs.slice(startIndex, endIndex).addClass(pageClass);
			}

			//hide participants not on current page

			pageClass = "page" + currentPage;
			$('.brady .participantContainer').show().not("." + pageClass).hide(); //hide participants in overflow

			numberofP = numberofP - 1; //decrement n until it fits
		}

		while (videoHeight < minVideoHeight)

		dealWithOverflow();


		//size divs with best sizes
		divs.width(videoWidth); //set participant container width
		divs.children(".videoContainer").height(videoHeight).width(videoWidth); //set video container width


		//layout participants based on video sizes, best grid and margins, padding etc
		// get total size of layout so it can be centered in canvas
		totalWidth = (videoWidth * nColumns) + (workingVideoColumnMargin * (nColumns - 1));
		totalHeight = (videoHeight * nRows) + (videoRowMargin * (nRows - 1)) + (workingVideoBottomPadding * nRows);

		centerX = (canvasW - totalWidth) * 0.5; //left-hand offset to centralize layout horizontally
		centerY = (canvasH - totalHeight) * 0.45; // top offset to position layout vertcally (just above center)
		if (isActive) {
			canvasH = container.height();
			centerY = (canvasH - totalHeight) - 25;
		}

		xPitch = videoWidth + workingVideoColumnMargin; //horizontal pitch of participants
		yPitch = videoHeight + videoRowMargin + workingVideoBottomPadding; //vertical pitch of participants


		//layout each page
		for (var i = 1; i <= nPages; i++) {

			pageClass = "page" + i;

			pageOffset = canvasW * (i - 1); //not used but could be used for css animation

			elements = $('.' + pageClass);

			//for each div position vertically and horizontal based on index
			elements.each(function(index) {
				//horizontal position
				thisX = (((index) % nColumns)) * xPitch;
				thisX = thisX + centerX;

				//vertical position
				thisY = (Math.floor((index) / nColumns)) * yPitch;
				thisY = thisY + centerY;

				//position the div
				$(this).css('top', thisY).css('left', thisX);
			});

		}

		//position pagination controls
		if($('.brady .participantContainer:visible').length){
			//may not have anyone, (sharing)
			top1 = $('.brady .participantContainer:visible').eq(0).offset().top;
			top2 = $('.brady .participantContainer:visible').last().offset().top;
			bottom2 = top2 + $('.brady .participantContainer').not('.pinned').height();
			controlOffset = (top1 + bottom2 - $('.pageControlRight').height()) / 2;
			$('#paginationControls').css('top', controlOffset);
		}



		//videos need to be centered using centerVids()
	}


	function dealWithOverflow() {
		$('#dotOverflow').hide();
		$('.dot').hide();
		$('.pageControlRight, .pageControlLeft').hide();
		if (currentPage == 2 && nPages == 1) {
			$('.dot').first().click()
		}
		if (nPages == 1) {
			return false
		}

		//show overflow elements
		$('#dotOverflow').show();
		$('.dot').slice(0, nPages).show();

		$('.pageControlRight, .pageControlLeft').show();
		if (currentPage == 1) {
			$('.pageControlLeft').hide()
		}
		if (currentPage == nPages) {
			$('.pageControlRight').hide()
		}

		if (currentPage > nPages) {
			$('.dot:visible').last().click()
		}



	}

	function paginationInit() {
		$('.dot').click(function() {

			$('.dot').removeClass('selected');
			$(this).addClass('selected');
			targetPage = $(this).prevAll().length + 1;
			currentPage = targetPage;
			pageClass = "page" + currentPage;
			$('.brady .participantContainer').show().not("." + pageClass).hide();
			dealWithOverflow()
		});

		$('.pageControlLeft').click(function() {
			$('.dot.selected').removeClass('selected').prev().addClass('selected').click();
			dealWithOverflow()
		});

		$('.pageControlRight').click(function() {
			$('.dot.selected').removeClass('selected').next().addClass('selected').click();
			dealWithOverflow()
		});
	}
	
function nudgeAllVideos(){
	if (isFaceTrackingEnabled){
		$('.activeParticipant video').each(function(){
			nudgeVideo(this)
		});
	}
}



function nudgeVideo(thisVideo){
			thisVideo = $(thisVideo);
			videoData = $(thisVideo).data('face');
			if (videoData) {
				videoX = videoData.px;
				offsetX = (0.5 - videoX) * 100;
				
				
				if (sourceRatio < videoRatio) { //crop top and bottom
					streamWidth = videoWidth;
					streamHeight = streamWidth / sourceRatio;
				} else {
					streamHeight = videoHeight;
					streamWidth = streamHeight * sourceRatio;
				}
				streamWidth = $(thisVideo).width();
				clampOffset = 100 * (((streamWidth - videoWidth) / 2) / streamWidth);
				clampOffset = clampOffset;
				console.log (clampOffset);
				
				
				if (offsetX < -clampOffset) {offsetX = -clampOffset}
				if (offsetX >  clampOffset) {offsetX = clampOffset}
				thisVideo.css('-webkit-transform', 'translateX(' + offsetX + '%)')
				//debugger;
//				offsetX = offsetX * 1.9;
//				horizontalRatio = (0.5 - offsetX) * -1;
//				if (horizontalRatio < -1) {
//					horizontalRatio = -1
//				}
//				if (horizontalRatio > 0) {
//					horizontalRatio = 0
//				}
			}

}


$(window).on('peerFaceMoved', function (jqObj, obj) {
	
		var id = obj.id,
			px = obj.px,
			py = obj.py,
			$video;

		$video = $('.videoContainer video[data-id=' + id + ']').data("face", {
			px: px,
			py: py
		});
	if (isFaceTrackingEnabled){
		//transform calc
		
		nudgeVideo($video)
		
		
		
			
	}
});



	function centerVid(video) {
		if(!video){
			//may not see a video 
			return;
		}
		

		//console.log (videoData.px);
		sourceRatio = 16 / 9;
		if ($(video).attr('data-id')) {
			sourceRatio = 4 / 3;
			
		}
		//if ($(video).closest('#activeSpeakerContainer')){sourceRatio = 4 / 3} // it is an active speaker or promoted participant

		if (sourceRatio < videoRatio) { //crop top and bottom
			streamWidth = videoWidth;
			streamHeight = streamWidth / sourceRatio;
		} else {
			streamHeight = videoHeight;
			streamWidth = streamHeight * sourceRatio;
		}


		$(video).height(streamHeight).width(streamWidth);

		horizontalRatio = -0.5;
		

		$(video).css('left', ((streamWidth - videoWidth) * horizontalRatio))

		verticalRatio = -0.35;
		$(video).css('top', ((streamHeight - videoHeight) * verticalRatio));
		
		
	}
	
	
	
	function layoutVideos(numberP) {

		nRows = 0;
		nColumns = 0;
		videoHeight = 0;
		videoWidth = 0;
		videoRatio = 1;


		sourceWidth = 0;


		actualN = numberP - 1;

		//activate actualN

		$('.brady>.participantContainer').removeClass('activeParticipant').slice(0, actualN).addClass('activeParticipant');

		canvasW = $('.brady').width();
		canvasH = $('.brady').height();


		//if smart grid
		if (isSmart) { //layout Brady

			doBestLayout($('.brady'), $('.activeParticipant'));
			centerVids()

		} //isSMart



		if (isActive) { //layout thumbnail strip

			
			

				//$('.brady').css(h);
				//								$('.brady').css('bottom', 45);
				doBestLayout($('.brady'), $('.activeParticipant').not('.pinned'));
				//								doBestLayout($('.brady'), $('.activeParticipant'))



			

			doActiveSpeakerLayout()

			centerVids()



		} //isActive


		

	

		
	}

	function doActiveSpeakerLayout() {

			sizeBrady();

			videos = $('.activeSpeakerVideo, .promoted');
//			videos = $('.activeSpeakerVideo, .promoted, #activeSpeakerContainer .ghost');
			numberOfVideos = videos.length;

			areaW = $('#activeSpeakerContainer').width();
			areaH = $('#activeSpeakerContainer').height();

			availableWidth = areaW - (2 * activeSpeakerMarginLeft) - ((numberOfVideos - 1) * activeSpeakerMarginCenter);
			//divide available with proportionally based on aspect ratio
			firstVideoWidth = availableWidth / numberOfVideos;

			firstVideoHeight = (firstVideoWidth / activeSpeakerAspectRatio);

			firstParticipantHeight = firstVideoHeight + videoBottomPadding + activeSpeakerMarginTop + activeSpeakerMarginBottom;

			if (firstParticipantHeight > areaH) { //make fit vertically
				finalVideoHeight = areaH - activeSpeakerMarginTop - activeSpeakerMarginBottom - videoBottomPadding;
				finalVideoWidth = finalVideoHeight * activeSpeakerAspectRatio;
				topOffset = activeSpeakerMarginTop;
				leftOffset = activeSpeakerMarginLeft + (areaW - ((2 * activeSpeakerMarginLeft) + (finalVideoWidth * numberOfVideos) + ((numberOfVideos - 1) * activeSpeakerMarginCenter))) / 2;
			} else { //position
				finalVideoHeight = firstVideoHeight;
				finalVideoWidth = firstVideoWidth;
				finalParticipantHeight = firstParticipantHeight;
				topOffset = activeSpeakerMarginTop + ((areaH - finalParticipantHeight) * 0.45);
				leftOffset = activeSpeakerMarginLeft;
			}


			$('#activeSpeakerContainer .participantContainer video').height(finalVideoHeight).width(finalVideoWidth);
			$('#activeSpeakerContainer >.participantContainer').width(finalVideoWidth);
			$('#activeSpeakerContainer .videoContainer').height(finalVideoHeight).width(finalVideoWidth);


			videos.each(function(index) {
				xPitch = finalVideoWidth + activeSpeakerMarginCenter;
				thisX = (index * xPitch) + leftOffset;
				$(this).css('top', topOffset).css('left', thisX);
			});

			centerVids();

		}

	function layoutThumbnailVideos(leftPosition) {
		$('.activeParticipant').not('.pinned').each(function(index) {
			xPitch = (thumbnailHeight * thumbnailRatio) + thumbnailMargin;
			thisX = (index * xPitch) + leftPosition;
			$(this).css('top', offsetTop).css('left', thisX);
		});
	}

	function centerVids() {
			$('.brady .participantContainer video').each(function(index) {
				centerVid(this);
			});
		};

	function sizeBrady() {
		canvasHeight = $('#canvas').height();
		canvasWidth = $('#canvas').width();
		$('.brady').height(canvasHeight - footerHeight - headerHeight);
		$('.brady').width(canvasWidth);
		$('.brady').css('top', headerHeight).css('bottom', "").css('left', "");

		if (currentVisibleParticipants == 1 && numberOfRealOthersInMeeting == 0) {
			$('.brady').width(350).css('left', (canvasWidth - 350) / 2)
		};
		if (isFullBleed) {
			$('.brady').css('top', 0);
			$('.brady').height(canvasHeight);
		};

		if (isActive) { //thumbnail mode

			thumbnailTop = $('.activeParticipant:visible').not('.pinned').eq(0).position().top;
			$('#activeSpeakerContainer').width(canvasWidth).height(thumbnailTop);



		}
	}
});