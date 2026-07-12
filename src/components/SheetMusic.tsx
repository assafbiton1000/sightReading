import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { GeneratedNote } from '../utils/noteGenerator';
import { VEXFLOW_BASE64 } from '../constants/vexflowBundle';
import { DURATION_BEATS } from '../constants/notes';

export type NotePosition = { idx: number; x: number; lineIdx: number };

// Per-system vertical layout — the ONE source of truth for how tall a line of
// notation is. Anything that needs to position something relative to a specific
// staff line (e.g. the playback cursor) must import these instead of re-guessing
// them, otherwise the two silently drift apart (as happened before this comment
// existed: the cursor kept its own stale copy of these numbers).
export const SYSTEM_H_SINGLE = 170;
export const SYSTEM_H_GRAND = 260;
export const SYSTEM_TOP_MARGIN = 50;
export const CURSOR_TOP_OFFSET = 15;      // fine-tuned to sit on the notehead vertical center
export const CURSOR_HEIGHT_SINGLE = 130;
export const CURSOR_HEIGHT_GRAND = 200;

interface Props {
  notes: GeneratedNote[];
  /** Indices that should be highlighted blue (current note/s) */
  highlightedIndices: number[];
  /** Indices rendered invisible (disappearing-measures mode). VexFlow still
   * formats them, so the layout never shifts when notes vanish. */
  hiddenIndices?: number[];
  /** 'rhythm' = right pitch, wrong relative duration — shown orange after the exercise */
  noteResults: ('correct' | 'wrong' | 'rhythm' | 'pending')[];
  keySignature: string;
  timeSignature: [number, number];
  /** Called once after VexFlow renders with the absolute x-position of each note */
  onNotePositions?: (positions: NotePosition[]) => void;
  /** Color each idle note by pitch letter instead of the default dark color */
  colorfulNotes?: boolean;
  /** Visual zoom factor for the whole staff, e.g. 0.8..1.3. Defaults to 1. */
  staffScale?: number;
  /** Render the staff/notation with dark-theme-appropriate colors */
  darkMode?: boolean;
}

function buildHtml(
  notes: GeneratedNote[],
  highlightedIndices: number[],
  hiddenIndices: number[],
  noteResults: ('correct' | 'wrong' | 'rhythm' | 'pending')[],
  keySignature: string,
  timeSignature: [number, number],
  colorfulNotes: boolean,
  staffScale: number,
  darkMode: boolean
): string {
  const notesJson = JSON.stringify(notes);
  const resultsJson = JSON.stringify(noteResults);
  const highlightJson = JSON.stringify(highlightedIndices);
  const hiddenJson = JSON.stringify(hiddenIndices);
  const [beats, beatValue] = timeSignature;
  const bgColor = darkMode ? '#1A1C25' : '#fff';
  const staffColor = darkMode ? '#F1F2F6' : '#1a1d2e';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<style>
  body{margin:0;padding:4px;background:${bgColor};overflow:hidden;}
  #error{color:red;font-family:sans-serif;font-size:11px;padding:4px;}
  svg{display:block;max-width:100%;height:auto;}
</style>
</head>
<body>
<div id="output"></div>
<div id="error"></div>
<script src="data:text/javascript;base64,${VEXFLOW_BASE64}"></script>
<script>
(function(){
try{
  var VF=Vex.Flow;
  var notes=${notesJson};
  var results=${resultsJson};
  var highlighted=new Set(${highlightJson});
  var hidden=new Set(${hiddenJson});
  var keySig="${keySignature}";
  var beats=${beats};
  var beatValue=${beatValue};
  var timeSig=beats+"/"+beatValue;
  var SCALE=${staffScale};
  var COLORFUL=${colorfulNotes ? 'true' : 'false'};
  var STAFF_COLOR="${staffColor}";
  var NOTE_COLORS={c:"#ef4444",d:"#f97316",e:"#eab308",f:"#22c55e",g:"#3b82f6",a:"#6366f1",b:"#a855f7"};
  var BEATS_PER_LINE=8;
  var MAX_WEIGHT_PER_LINE=Math.max(2.5,5.5/SCALE);
  var BEAT_VALUES={w:4,h:2,q:1,"8":0.5};
  // Chords take more horizontal room than a single note — weigh them heavier
  // than a flat item count so lines with chords wrap sooner and never overflow.
  function itemWeight(item){ return 1+(item.note.keys.length-1)*0.5; }

  // Detect grand staff
  var hasTreble=notes.some(function(n){return n.clef==="treble";});
  var hasBass=notes.some(function(n){return n.clef==="bass";});
  var isGrand=hasTreble&&hasBass;

  // Separate notes with original index
  var trebleItems=[], bassItems=[], singleItems=[];
  notes.forEach(function(n,i){
    if(isGrand){
      if(n.clef==="bass") bassItems.push({note:n,idx:i});
      else trebleItems.push({note:n,idx:i});
    } else {
      singleItems.push({note:n,idx:i});
    }
  });
  var activeClef=isGrand?"treble":(notes[0]?notes[0].clef:"treble");

  // Split by beats into lines
  function splitLines(items){
    var lines=[],cur=[],beats=0,weight=0;
    for(var i=0;i<items.length;i++){
      var nb=BEAT_VALUES[items[i].note.duration]||1;
      var w=itemWeight(items[i]);
      if(cur.length>0&&(beats+nb>BEATS_PER_LINE||weight+w>MAX_WEIGHT_PER_LINE)){lines.push(cur);cur=[items[i]];beats=nb;weight=w;}
      else{cur.push(items[i]);beats+=nb;weight+=w;}
    }
    if(cur.length>0)lines.push(cur);
    return lines;
  }

  var tLines=isGrand?splitLines(trebleItems):splitLines(singleItems);
  var bLines=isGrand?splitLines(bassItems):[];
  var numLines=Math.max(tLines.length,bLines.length);

  var div=document.getElementById("output");
  var W=Math.max(window.innerWidth-8,300);
  var effW=W/SCALE; // pre-scale layout budget — ctx.scale() magnifies it back to W on screen
  // Generous per-system budget: a bare 5-line staff is only ~40px tall, but extreme
  // notes need several ledger lines above/below it — too little room here is what let
  // one system's ledger lines crowd into the next, and clipped the last system's bottom.
  var SYSTEM_H=isGrand?${SYSTEM_H_GRAND}:${SYSTEM_H_SINGLE};
  var GRAND_GAP=90;
  var totalH=(numLines*SYSTEM_H+${SYSTEM_TOP_MARGIN})*SCALE;

  var renderer=new VF.Renderer(div,VF.Renderer.Backends.SVG);
  renderer.resize(W,totalH);
  var ctx=renderer.getContext();
  ctx.scale(SCALE,SCALE);
  ctx.setFont("Arial",10,"");
  ctx.setFillStyle(STAFF_COLOR);
  ctx.setStrokeStyle(STAFF_COLOR);

  function getColor(i){
    if(highlighted.has(i)) return "#1E90FF";
    if(results[i]==="correct") return "#22c55e";
    if(results[i]==="wrong") return "#ef4444";
    if(results[i]==="rhythm") return "#f59e0b";
    if(COLORFUL){
      var letter=notes[i].keys[0].split("/")[0];
      return NOTE_COLORS[letter]||STAFF_COLOR;
    }
    return STAFF_COLOR;
  }

  function makeSN(item,clef){
    var sn=new VF.StaveNote({clef:clef,keys:item.note.keys,duration:item.note.duration});
    if(hidden.has(item.idx)){
      var inv={fillStyle:"rgba(0,0,0,0)",strokeStyle:"rgba(0,0,0,0)"};
      sn.setStyle(inv);
      if(sn.setLedgerLineStyle)sn.setLedgerLineStyle(inv);
    } else {
      var col=getColor(item.idx);
      sn.setStyle({fillStyle:col,strokeStyle:col});
    }
    return sn;
  }

  var allPos=[];
  function drawVoice(items,clef,stave){
    if(!items||items.length===0) return [];
    var sns=items.map(function(it){return makeSN(it,clef);});
    var v=new VF.Voice({num_beats:BEATS_PER_LINE,beat_value:beatValue})
      .setMode(VF.Voice.Mode.SOFT);
    v.addTickables(sns);
    new VF.Formatter().joinVoices([v]).format([v],effW-70);
    v.draw(ctx,stave);
    return sns;
  }

  for(var li=0;li<numLines;li++){
    var yBase=li*SYSTEM_H+20;
    var isFirst=li===0;
    var sw=effW-20;

    if(isGrand){
      var ts=new VF.Stave(10,yBase,sw);
      ts.addClef("treble");
      if(isFirst){ts.addKeySignature(keySig);ts.addTimeSignature(timeSig);}
      ts.setContext(ctx).draw();

      var bs=new VF.Stave(10,yBase+GRAND_GAP,sw);
      bs.addClef("bass");
      if(isFirst){bs.addKeySignature(keySig);bs.addTimeSignature(timeSig);}
      bs.setContext(ctx).draw();

      new VF.StaveConnector(ts,bs).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw();
      new VF.StaveConnector(ts,bs).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();

      var tSns=drawVoice(tLines[li],"treble",ts);
      var bSns=drawVoice(bLines[li],"bass",bs);
      if(tLines[li])tLines[li].forEach(function(it,i){if(tSns[i])allPos.push({idx:it.idx,x:tSns[i].getAbsoluteX()*SCALE,lineIdx:li});});
      if(bLines[li])bLines[li].forEach(function(it,i){if(bSns[i])allPos.push({idx:it.idx,x:bSns[i].getAbsoluteX()*SCALE,lineIdx:li});});
    } else {
      var st=new VF.Stave(10,yBase,sw);
      st.addClef(activeClef);
      if(isFirst){st.addKeySignature(keySig);st.addTimeSignature(timeSig);}
      st.setContext(ctx).draw();
      var stSns=drawVoice(tLines[li],activeClef,st);
      if(tLines[li])tLines[li].forEach(function(it,i){if(stSns[i])allPos.push({idx:it.idx,x:stSns[i].getAbsoluteX()*SCALE,lineIdx:li});});
    }
  }
  // Safety net: if the actual drawn content (ledger lines etc.) still went past the
  // generous SYSTEM_H budget above, grow the real canvas to fit it exactly — never
  // shrink/scale, just make sure nothing after this point can be clipped — and tell
  // React Native the true final height so the wrapping View isn't left too short.
  try{
    var svgEl=div.getElementsByTagName("svg")[0];
    if(svgEl){
      var bbox=svgEl.getBBox();
      var neededH=Math.ceil(bbox.y+bbox.height)+10;
      if(neededH>totalH){
        totalH=neededH;
        renderer.resize(W,totalH);
      }
    }
  }catch(_){}
  try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"size",height:totalH}));}catch(_){}

  try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'positions',data:allPos}));}catch(_){}

}catch(e){document.getElementById("error").textContent="Error: "+e.message;}
})();
</script>
</body>
</html>`;
}

const NO_HIDDEN: number[] = []; // stable default — an inline [] would rebuild the html memo every render

export default function SheetMusic({
  notes, highlightedIndices, hiddenIndices = NO_HIDDEN, noteResults, keySignature, timeSignature, onNotePositions,
  colorfulNotes = false, staffScale = 1, darkMode = false,
}: Props) {
  const html = useMemo(
    () => buildHtml(notes, highlightedIndices, hiddenIndices, noteResults, keySignature, timeSignature, colorfulNotes, staffScale, darkMode),
    [notes, highlightedIndices, hiddenIndices, noteResults, keySignature, timeSignature, colorfulNotes, staffScale, darkMode]
  );

  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');
  // For grand staff, base line count on one clef only (treble); both staves share systems.
  const referenceNotes = isGrand ? notes.filter(n => n.clef === 'treble') : notes;
  const totalBeats = referenceNotes.reduce((s, n) => s + (DURATION_BEATS[n.duration] ?? 1), 0);
  const totalWeight = referenceNotes.reduce((s, n) => s + (1 + (n.keys.length - 1) * 0.5), 0);
  const maxWeightPerLine = Math.max(2.5, 5.5 / staffScale);
  const numLines = Math.max(1, Math.ceil(totalBeats / 8), Math.ceil(totalWeight / maxWeightPerLine));
  // Initial estimate only — the WebView reports the real measured height once it renders,
  // which overrides this and accounts for ledger lines / chord width the estimate can't predict.
  const estimatedHeight = (isGrand
    ? Math.max(SYSTEM_H_GRAND + SYSTEM_TOP_MARGIN, numLines * SYSTEM_H_GRAND + SYSTEM_TOP_MARGIN)
    : Math.max(SYSTEM_H_SINGLE + SYSTEM_TOP_MARGIN, numLines * SYSTEM_H_SINGLE + SYSTEM_TOP_MARGIN)
  ) * staffScale;
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const height = measuredHeight ?? estimatedHeight;

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'positions') onNotePositions?.(msg.data);
      if (msg.type === 'size' && typeof msg.height === 'number' && msg.height > 0) {
        setMeasuredHeight(msg.height);
      }
    } catch (_) {}
  }

  const bg = darkMode ? '#1A1C25' : '#fff';

  return (
    <View style={[styles.container, { height, backgroundColor: bg }]}>
      <WebView
        source={{ html }}
        style={[styles.webview, { backgroundColor: bg }]}
        onMessage={handleMessage}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
        mixedContentMode="always"
        cacheEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  webview: { flex: 1 },
});
