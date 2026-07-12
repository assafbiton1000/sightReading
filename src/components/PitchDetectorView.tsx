import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface PitchDetectorHandle {
  start: () => void;
  stop: () => void;
}

interface Props {
  onPitchDetected: (frequency: number) => void;
  onError?: (msg: string) => void;
  /** 0 (least sensitive, filters more background noise) .. 1 (most sensitive). Defaults to 0.5. */
  sensitivity?: number;
}

// Self-contained HTML that uses Web Audio API + YIN algorithm
// Posts detected frequency back to RN via postMessage
function buildPitchHtml(silenceRms: number, yinThreshold: number): string {
  return `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
<script>
(function() {
  // ── Polyfill: ensure navigator.mediaDevices.getUserMedia exists.
  // With baseUrl='http://localhost' this should already be defined,
  // but we add a legacy fallback for older Android WebViews.
  if (!navigator.mediaDevices) { navigator.mediaDevices = {}; }
  if (!navigator.mediaDevices.getUserMedia) {
    var _legacyGUM = navigator.getUserMedia
                  || navigator.webkitGetUserMedia
                  || navigator.mozGetUserMedia;
    navigator.mediaDevices.getUserMedia = _legacyGUM
      ? function(c) { return new Promise(function(res,rej){ _legacyGUM.call(navigator,c,res,rej); }); }
      : function() { return Promise.reject(new Error('microphone not available — check app permissions')); };
  }

  var audioContext = null;
  var scriptProcessor = null;
  var stream = null;
  var running = false;

  var BUFFER_SIZE = 4096;   // larger = better low-freq accuracy for piano bass notes
  // Both derived from the single mic-sensitivity setting: higher sensitivity
  // lowers the silence gate (RMS) AND raises how permissive YIN's dip
  // threshold is — which is what lets it lock onto the quieter, weaker
  // fundamentals typical of high right-hand notes instead of missing them.
  var YIN_THRESHOLD = ${yinThreshold};
  var SILENCE_RMS = ${silenceRms};

  // ── Hann window, precomputed once ───────────────────────────────────
  // Applied to a copy of each raw buffer before YIN's difference function.
  // Without it, the hard edges of the buffer act like a click/discontinuity,
  // which shows up as spurious energy at short lags (tau) — exactly the
  // range that maps to right-hand/high notes, where the true period is
  // already short. That's what was making high notes noisier than bass
  // notes to begin with.
  var HANN = new Float32Array(BUFFER_SIZE);
  for (var hi = 0; hi < BUFFER_SIZE; hi++) {
    HANN[hi] = 0.5 - 0.5 * Math.cos(2 * Math.PI * hi / (BUFFER_SIZE - 1));
  }

  function rms(buf) {
    var s = 0;
    for (var i = 0; i < buf.length; i++) s += buf[i] * buf[i];
    return Math.sqrt(s / buf.length);
  }

  function yin(buffer) {
    var half = buffer.length >> 1;
    var yb = new Float32Array(half);
    var runningSum = 0;
    yb[0] = 1;
    for (var tau = 1; tau < half; tau++) {
      var sum = 0;
      for (var i = 0; i < half; i++) {
        var d = buffer[i] - buffer[i + tau];
        sum += d * d;
      }
      yb[tau] = sum;
      runningSum += sum;
      yb[tau] = yb[tau] * tau / runningSum;
    }

    var tauEstimate = -1;
    for (var t = 2; t < half; t++) {
      if (yb[t] < YIN_THRESHOLD) {
        while (t + 1 < half && yb[t + 1] < yb[t]) t++;
        tauEstimate = t;
        break;
      }
    }
    if (tauEstimate === -1) return -1;

    // Parabolic interpolation for better accuracy
    var x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
    var x2 = tauEstimate + 1 < half ? tauEstimate + 1 : tauEstimate;
    var better = tauEstimate;
    if (x0 !== tauEstimate && x2 !== tauEstimate) {
      var s0 = yb[x0], s1 = yb[tauEstimate], s2 = yb[x2];
      better = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
    }
    return audioContext.sampleRate / better;
  }

  // ── Majority-of-3 smoothing ──────────────────────────────────────────
  // Keeps the last 3 raw YIN readings and only reports a pitch once at
  // least 2 of them agree (within 35 cents — tighter than the 50-cent
  // note-match tolerance, so this can't blur two real adjacent notes
  // together). A single noisy/octave-glitched buffer can no longer flip
  // the detector on its own; it just gets outvoted. Trade-off: the very
  // first note of a phrase needs 2 agreeing buffers (~1 extra ~93ms tick)
  // before it's confirmed.
  var HIST_LEN = 3;
  var VOTE_CENTS = 35;
  var history = [];
  function centsDiff(a, b) { return 1200 * Math.abs(Math.log(a / b) / Math.LN2); }
  function voteFreq(freq) {
    history.push(freq);
    if (history.length > HIST_LEN) history.shift();
    for (var i = 0; i < history.length; i++) {
      var agree = [history[i]];
      for (var j = 0; j < history.length; j++) {
        if (j === i) continue;
        if (centsDiff(history[i], history[j]) <= VOTE_CENTS) agree.push(history[j]);
      }
      if (agree.length >= 2) {
        var sum = 0;
        for (var k = 0; k < agree.length; k++) sum += agree[k];
        return sum / agree.length;
      }
    }
    return -1;
  }

  function start() {
    if (running) return;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(function(s) {
        stream = s;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioContext.createMediaStreamSource(stream);
        scriptProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
        scriptProcessor.onaudioprocess = function(e) {
          var buf = e.inputBuffer.getChannelData(0);
          if (rms(buf) < SILENCE_RMS) { history.length = 0; return; }

          var windowed = new Float32Array(buf.length);
          for (var wi = 0; wi < buf.length; wi++) windowed[wi] = buf[wi] * HANN[wi];

          var freq = yin(windowed);
          if (freq > 50 && freq < 2100) {
            var stable = voteFreq(freq);
            if (stable > 0) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pitch', freq: stable }));
            }
          } else {
            history.length = 0; // reset so a stale reading can't bleed into the next note
          }
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);
        running = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      })
      .catch(function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', msg: e.message || String(e) }));
      });
  }

  function stop() {
    if (scriptProcessor) { scriptProcessor.disconnect(); scriptProcessor = null; }
    if (stream) { stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    if (audioContext) { audioContext.close(); audioContext = null; }
    running = false;
  }

  function onCmd(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.cmd === 'start') start();
      if (msg.cmd === 'stop') stop();
    } catch(_) {}
  }
  document.addEventListener('message', onCmd);
  window.addEventListener('message', onCmd);
})();
</script>
</body>
</html>`;
}

const PitchDetectorView = forwardRef<PitchDetectorHandle, Props>(
  ({ onPitchDetected, onError, sensitivity = 0.5 }, ref) => {
    const webviewRef = useRef<WebView>(null);
    const silenceRms = useMemo(() => 0.01 * Math.pow(0.08, sensitivity), [sensitivity]);
    // 0.10 (low sensitivity, strict) .. 0.25 (high sensitivity, permissive) —
    // lets high/quiet right-hand fundamentals still cross the YIN dip threshold.
    const yinThreshold = useMemo(() => 0.10 + 0.15 * sensitivity, [sensitivity]);
    const pitchHtml = useMemo(() => buildPitchHtml(silenceRms, yinThreshold), [silenceRms, yinThreshold]);

    useImperativeHandle(ref, () => ({
      start: () => {
        webviewRef.current?.injectJavaScript(
          `window.dispatchEvent(new MessageEvent('message', { data: '{"cmd":"start"}' })); true;`
        );
      },
      stop: () => {
        webviewRef.current?.injectJavaScript(
          `window.dispatchEvent(new MessageEvent('message', { data: '{"cmd":"stop"}' })); true;`
        );
      },
    }));

    function handleMessage(e: WebViewMessageEvent) {
      try {
        const data = JSON.parse(e.nativeEvent.data);
        if (data.type === 'pitch') onPitchDetected(data.freq);
        if (data.type === 'error') onError?.(data.msg);
      } catch (_) {}
    }

    // onPermissionRequest is Android-only and not in the TS types for this webview version
    const androidMicGrant = { onPermissionRequest: (r: any) => r.grant(r.resources) };

    return (
      <View style={styles.hidden}>
        <WebView
          ref={webviewRef}
          source={{ html: pitchHtml, baseUrl: 'http://localhost' }}
          onMessage={handleMessage}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          allowFileAccess
          allowUniversalAccessFromFileURLs
          {...(androidMicGrant as any)}
          style={styles.hidden}
        />
      </View>
    );
  }
);

export default PitchDetectorView;

const styles = StyleSheet.create({
  hidden: { width: 1, height: 1, opacity: 0 },
});
