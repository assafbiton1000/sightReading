import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export interface PitchDetectorHandle {
  start: () => void;
  stop: () => void;
}

interface Props {
  onPitchDetected: (frequency: number) => void;
  onError?: (msg: string) => void;
}

// Self-contained HTML that uses Web Audio API + YIN algorithm
// Posts detected frequency back to RN via postMessage
const PITCH_HTML = `<!DOCTYPE html>
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
  var YIN_THRESHOLD = 0.15; // was 0.10 — more permissive, picks up piano fundamentals
  var SILENCE_RMS = 0.003;  // was 0.01 — piano at distance is quieter than 0.01

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
    for (var tau = 2; tau < half; tau++) {
      if (yb[tau] < YIN_THRESHOLD) {
        while (tau + 1 < half && yb[tau + 1] < yb[tau]) tau++;
        var x0 = tau > 0 ? tau - 1 : tau;
        var x2 = tau + 1 < half ? tau + 1 : tau;
        var better = tau;
        if (x0 !== tau && x2 !== tau) {
          var s0 = yb[x0], s1 = yb[tau], s2 = yb[x2];
          better = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }
        return audioContext.sampleRate / better;
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
          if (rms(buf) < SILENCE_RMS) return;
          var freq = yin(buf);
          if (freq > 50 && freq < 2100) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pitch', freq: freq }));
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

const PitchDetectorView = forwardRef<PitchDetectorHandle, Props>(
  ({ onPitchDetected, onError }, ref) => {
    const webviewRef = useRef<WebView>(null);

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
          source={{ html: PITCH_HTML, baseUrl: 'http://localhost' }}
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
