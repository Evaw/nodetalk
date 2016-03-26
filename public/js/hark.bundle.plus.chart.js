define(['js/third-party/smoothie-charts/smoothie-require-modification.js', "js/hark.bundle"],
  function(Charts, hark) {
    var harkCanvasWrap = function(stream, opts) {
      var usualHark = hark.call(hark, stream, opts);
      var chartLine;
      var minLine;
      var charter;
      var zeroLine;
      var speakingLine;
      var maybeLine;
      var canvas = opts.canvas;
      var freqCanvas = opts.freqCanvas;
      if (canvas) {
        charter = new Charts.SmoothieChart({
          maxValue: 1,
          minValue: 0
        });
        charter.streamTo(canvas);
        chartLine = new Charts.TimeSeries();
        charter.addTimeSeries(chartLine);

        speakingLine = new Charts.TimeSeries();
        charter.addTimeSeries(speakingLine);

        maybeLine = new Charts.TimeSeries();
        charter.addTimeSeries(maybeLine);
      }
      if (freqCanvas) {

      }
      usualHark.on('volume_change', function(extra) {
        extra = extra || {};
        var fftBins = extra.fftBins;
        var i;
        var frequencyBinCount;

        var WIDTH, HEIGHT;
        if (canvas) {
          //chartLine.append(new Date().getTime(), currentVolume);
          chartLine.append(new Date().getTime(), extra.curSpeakPercentConfidence);
          maybeLine.append(new Date().getTime(), 0.08);
          speakingLine.append(new Date().getTime(), 0.15);
        }
        if (freqCanvas) {
          WIDTH = freqCanvas.width;
          HEIGHT = freqCanvas.height;
          var drawContext = freqCanvas.getContext('2d');
          drawContext.fillStyle = 'black';
          drawContext.fillRect(0, 0, WIDTH, HEIGHT);

          if (fftBins) {
            frequencyBinCount = extra.frequencyBinCount;
            for (i = 0; i < frequencyBinCount; i += 1) {
              frequencyBinCount = extra.frequencyBinCount;
              var value = fftBins[i];
              var percent = (value + 100) / 100 * Math.log(1 + Math.min(i / (fftBins.length * 0.03), 8)); //value goes from roughly -130 to 0

              var height = (HEIGHT * percent);
              var offset = HEIGHT - height - 1;
              var barWidth = WIDTH / frequencyBinCount;
              var hue = i / frequencyBinCount * 360;
              drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
              drawContext.fillRect(i * barWidth, offset, barWidth, height);
            }
          }
        }

      });
      return usualHark;
    }
    return harkCanvasWrap;
  });