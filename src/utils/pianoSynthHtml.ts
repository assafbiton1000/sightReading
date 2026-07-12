// Shared WebView-injected piano synth, used by PracticeScreen (feedback on
// correct notes) and PlaybackScreen (free listening). A single struck string
// is modeled as: a slow-decaying fundamental (the string's main energy) +
// several fast-decaying, slightly-detuned upper partials (inharmonicity, like
// a real piano string under tension — pure integer harmonics is what makes
// additive synths read as an organ/pluck instead) + a short, dull, low
// bandpass-filtered noise burst (the hammer strike) + a gentle output lowpass
// to tame harshness. `brightness`/`sustain` are baked in as defaults, but
// every `play` message can override them so a live Settings change (piano
// sound theme) takes effect on the very next note without reloading the
// WebView.
export function buildSynthHtml(brightness: number, sustain: number): string {
  return `<!DOCTYPE html><html><body><script>
var _ctx=null,BR=${brightness},SU=${sustain};
function _play(freq,dur,br,su){
  if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();
  var brightness=(typeof br==='number')?br:BR;
  var sustain=(typeof su==='number')?su:SU;
  var t=_ctx.currentTime,tc=Math.max(dur*0.35,sustain);

  var master=_ctx.createGain();master.gain.value=1;
  var lp=_ctx.createBiquadFilter();lp.type='lowpass';
  lp.frequency.value=Math.min(8000,freq*9+1200);lp.Q.value=0.4;
  master.connect(lp);lp.connect(_ctx.destination);

  // Fundamental — most of the energy, long natural decay
  var o1=_ctx.createOscillator(),g1=_ctx.createGain();
  o1.type='sine';o1.frequency.value=freq;
  g1.gain.setValueAtTime(0,t);g1.gain.linearRampToValueAtTime(0.62,t+0.006);
  g1.gain.setTargetAtTime(0,t+0.006,tc);
  o1.connect(g1);g1.connect(master);o1.start(t);o1.stop(t+tc*6+0.15);

  // Upper partials — slightly stretched (inharmonic) like a real struck
  // string, each decaying much faster than the fundamental
  var partials=[2,3,4,5,6];
  var amps=[0.85,0.5,0.28,0.16,0.09];
  var decays=[0.09,0.05,0.032,0.022,0.016];
  for(var i=0;i<partials.length;i++){
    var n=partials[i];
    var o=_ctx.createOscillator(),g=_ctx.createGain();
    o.type='sine';o.frequency.value=freq*n*(1+0.0003*n*n);
    var peak=brightness*amps[i];
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+0.003);
    g.gain.setTargetAtTime(0,t+0.003,decays[i]);
    o.connect(g);g.connect(master);
    o.start(t);o.stop(t+decays[i]*6+0.1);
  }

  // Hammer thump — short, dull, bandpass-filtered noise burst (the
  // mechanical strike), not a bright click (which reads as a guitar pluck)
  try{
    var sr=_ctx.sampleRate,len=Math.floor(sr*0.018),buf=_ctx.createBuffer(1,len,sr),d=buf.getChannelData(0);
    for(var j=0;j<len;j++)d[j]=(Math.random()*2-1)*Math.pow(1-j/len,2);
    var src=_ctx.createBufferSource();src.buffer=buf;
    var bp=_ctx.createBiquadFilter();bp.type='bandpass';
    bp.frequency.value=Math.min(1800,freq*1.5+200);bp.Q.value=0.6;
    var ng=_ctx.createGain();ng.gain.value=0.045;
    src.connect(bp);bp.connect(ng);ng.connect(master);
    src.start(t);
  }catch(e){}
}
function onMsg(e){try{var m=JSON.parse(e.data);if(m.cmd==='play')_play(m.freq,m.dur,m.br,m.su);}catch(_){}}
document.addEventListener('message',onMsg);window.addEventListener('message',onMsg);
</script></body></html>`;
}
