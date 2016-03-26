/*global require:false, window:false, bootstrap:false, exports:false, module: false, define:false, ses:false*/
/**
  License
  MIT
  https://github.com/latentflip/hark/blob/master/README.md
*/
(function(e) {
  "use strict";
  if ("function" === typeof bootstrap){
    bootstrap("hark", e);
  } else if ("object" === typeof exports) {
    module.exports = e();
  } else if ("function" === typeof define && define.amd) {
    define(e);
  } else if ("undefined" !== typeof ses) {
    if (!ses.ok()) {
      return;
    }
    ses.makeHark = e;
  } else {
    if ("undefined" !== typeof window) {
      window.hark = e();
    } else {
      global.hark = e();
    }
  }
}(function() {
  "use strict";
  var define, ses, bootstrap, module, exports;
  return (function(e, t, n) {
    var r = typeof require === "function" && require,
      s;
    function i(n, s) {
      if (!t[n]) {
        if (!e[n]) {
          var o = typeof require === "function" && require;
          if (!s && o) {
            return o(n, true);
          }
          if (r) {
            return r(n, true);
          }
          throw new Error("Cannot find module '" + n + "'");
        }
        var u = t[n] = {
          exports: {}
        };
        e[n][0].call(u.exports, function(t) {
          var r = e[n][1][t];
          return i(r || t);
        }, u, u.exports);
      }
      return t[n].exports;
    }
    for (s = 0; s < n.length; s+=1) {
      i(n[s]);
    }
    return i;
  })({
    1: [
      function(require, module, exports) {
        var WildEmitter = require('wildemitter');

        var CircularArrayForBaseline = function (N) {
          var arr = [];
          var idx =0;
          this.push = function (elt) {
            //avoid getting bad first sample of 0
            if(arr.length === 0 && elt === 0) {
              return;
            } 
            if(arr.length<N){
              arr.push(elt);
            } else {
              arr[idx] = elt;
              idx +=1;
              idx = idx%N;
            }
          };
          this.getAverage = function () {
            var i;
            var sum = 0;
            for(i=0;i<arr.length;i+=1){
              sum += arr[i];
            }
            if(!arr.length){
              return 0;
            }
            return sum/arr.length;
          };
          this.getMin = function () {
            var i;
            var min = Infinity;
            for(i=0;i<arr.length;i+=1){
              min = min < arr[i] ? min : arr[i];
            }
            return min;
          };
          this.isFilled = function () {
            return arr.length === N;
          };
        };
        function getMaxVolume(analyser, fftBins) {
          var maxVolume = -Infinity,
            i,
            ii,
            minVolume = Infinity,
            curSpecialSum = 0,
            curSpecialVal;
          analyser.getFloatFrequencyData(fftBins);

          for (i = 0, ii = analyser.frequencyBinCount; i < ii; i+=1) {
            if (fftBins[i] > maxVolume && fftBins[i] < 0) {
              maxVolume = fftBins[i];
            }
            if (fftBins[i] < minVolume && fftBins[i] < 0) {
              minVolume = fftBins[i];
            }
            curSpecialVal = ((Math.max(fftBins[i],-100) + 100) / 100 * Math.log(1+Math.max(Math.min(i/(fftBins.length*0.03),8),1)))/(fftBins.length/2);
            curSpecialSum += curSpecialVal;
          }

          return {
            max:maxVolume,
            min: minVolume,
            specialSum: (curSpecialSum)
          };
        }


        module.exports = function(stream, options) {
          var maxSeen = -Infinity;
          var harker = new WildEmitter();
          var sampPeriod = options.interval || 100;
          var sampFreq = 1/(sampPeriod/1000);
          var REFRESH_TIME_s =  3;
          var BASELINE_SAMPLES = REFRESH_TIME_s*sampFreq;//get latest 5 seconds to get noise energy. also may be used for deviation
          var baselineArr = new CircularArrayForBaseline(BASELINE_SAMPLES);
          var creationTime = Date.now();
          var initialStabilization = false;
          // make it not break in non-supported browsers
          if (!window.webkitAudioContext) {
            return harker;
          }
          //Config
          options = options || {};
          var smoothing = (options.smoothing || 0.5),
            interval = sampPeriod,
            threshold = options.threshold,
            play = options.play,
            audioContext;

          //Setup Audio Context
          try {
            //TODO: need to add hark properties (functions) even on exceptions
            audioContext = new webkitAudioContext();

            var sourceNode, fftBins, analyser;

            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.minDecibels = -100;
            analyser.maxDecibels = 0;
            analyser.smoothingTimeConstant = smoothing;
            fftBins = new Float32Array(analyser.fftSize);

            if (stream.jquery) {
              stream = stream[0];
            }
            if (stream instanceof HTMLAudioElement) {
              //Audio Tag
              sourceNode = audioContext.createMediaElementSource(stream);
              if (typeof play === 'undefined') {
                play = true;
              }
              threshold = threshold || -65;
            } else {
              //WebRTC Stream
              sourceNode = audioContext.createMediaStreamSource(stream);
              threshold = threshold || -45;
            }

            sourceNode.connect(analyser);
            if (play) {
              analyser.connect(audioContext.destination);
            }
            harker.speaking = false;
            harker.setThreshold = function(t) {
              threshold = t;
            };
            harker.destroy = function() {
              clearTimeout(this.timeoutId);
              this.off('volume_change');
              this.off('stopped_speaking');
              this.off('speaking');
            };
            harker.setInterval = function(i) {
              interval = i;
            };
            var lastRefreshLastSeen = Date.now();
            var timeoutFn = function() {
              if(!initialStabilization && creationTime + 2*REFRESH_TIME_s < Date.now()){
                initialStabilization = true;
              }
              var currentVolume = getMaxVolume(analyser, fftBins);
              var currentMax = currentVolume.max;
              var currentMin = currentVolume.min;
              var specialSum = currentVolume.specialSum;
              baselineArr.push(specialSum);
              var emmittedVolumeVal = specialSum - baselineArr.getMin();
              if(lastRefreshLastSeen - (Date.now()) > 2*REFRESH_TIME_s){
                maxSeen = emmittedVolumeVal;
                lastRefreshLastSeen = (Date.now());
                return;
              } else {
                maxSeen = Math.max(maxSeen, emmittedVolumeVal);
              }
              var relativeIntensity = emmittedVolumeVal/maxSeen;
              var speakingStatus = "not_speaking";
              if(initialStabilization){
                if(relativeIntensity > 0.08 && relativeIntensity < 0.15) {
                  speakingStatus = "maybe_speaking";
                } 
                if(relativeIntensity >= 0.15) {
                  speakingStatus = "speaking";
                }
              }
              harker.emit('volume_change',{
                  speakingStatus: speakingStatus,
                  curSpeakPercentConfidence: relativeIntensity,
                  fftBins: fftBins,
                  frequencyBinCount: analyser.frequencyBinCount
              });

              if (currentVolume > threshold) {
                if (!harker.speaking) {
                  harker.speaking = true;
                  harker.emit('speaking');
                }
              } else {
                if (harker.speaking) {
                  harker.speaking = false;
                  harker.emit('stopped_speaking');
                }
              }

              looper();
            };
            // Poll the analyser node to determine if speaking
            // and emit events if changed
            var looper = function() {
              harker.timeoutId = setTimeout(timeoutFn, interval);
            };
            harker.pause = function () {
              clearTimeout(harker.timeoutId);
            };
            harker.resume = function () {
              looper();
            }
            looper();


            return harker;
          } catch (audioErr) {
            //may not be able to create an audio context and throw an error
            //can return an event emmitter
            return harker;
          }
        }
      }, {
        "wildemitter": 2
      }
    ],
    2: [
      function(require, module, exports) {
        /*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based 
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {
    
});

emitter.on('somenamespace*', function (eventName, payloads) {
    
});

Please note that callbacks triggered by wildcard registered events also get 
the event name as the first argument.
*/
        module.exports = WildEmitter;

        function WildEmitter() {
          this.callbacks = {};
        }

        // Listen on the given `event` with `fn`. Store a group name if present.
        WildEmitter.prototype.on = function(event, groupName, fn) {
          var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
          func._groupName = group;
          (this.callbacks[event] = this.callbacks[event] || []).push(func);
          return this;
        };

        // Adds an `event` listener that will be invoked a single
        // time then automatically removed.
        WildEmitter.prototype.once = function(event, groupName, fn) {
          var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];

          function on() {
            self.off(event, on);
            func.apply(this, arguments);
          }
          this.on(event, group, on);
          return this;
        };

        // Unbinds an entire group
        WildEmitter.prototype.releaseGroup = function(groupName) {
          var item, i, len, handlers;
          for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
              if (handlers[i]._groupName === groupName) {
                //console.log('removing');
                // remove it and shorten the array we're looping through
                handlers.splice(i, 1);
                i--;
                len--;
              }
            }
          }
          return this;
        };

        // Remove the given callback for `event` or all
        // registered callbacks.
        WildEmitter.prototype.off = function(event, fn) {
          var callbacks = this.callbacks[event],
            i;

          if (!callbacks) {
            return this;
          }
          // remove all handlers
          if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
          }

          // remove specific handler
          i = callbacks.indexOf(fn);
          callbacks.splice(i, 1);
          return this;
        };

        // Emit `event` with the given args.
        // also calls any `*` handlers
        WildEmitter.prototype.emit = function(event) {
          var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item;

          if (callbacks) {
            for (i = 0, len = callbacks.length; i < len; ++i) {
              if (callbacks[i]) {
                callbacks[i].apply(this, args);
              } else {
                break;
              }
            }
          }

          if (specialCallbacks) {
            for (i = 0, len = specialCallbacks.length; i < len; i+=1) {
              if (specialCallbacks[i]) {
                specialCallbacks[i].apply(this, [event].concat(args));
              } else {
                break;
              }
            }
          }

          return this;
        };

        // Helper for for finding special wildcard event handlers that match the event
        WildEmitter.prototype.getWildcardCallbacks = function(eventName) {
          var item,
            split,
            result = [];

          for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[1].length) === split[1])) {
              result = result.concat(this.callbacks[item]);
            }
          }
          return result;
        };

      }, {}
    ]
  }, {}, [1])(1);
}));