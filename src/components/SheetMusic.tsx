import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { GeneratedNote } from '../utils/noteGenerator';
import { VEXFLOW_BASE64 } from '../constants/vexflowBundle';
import { DURATION_BEATS } from '../constants/notes';

export type NotePosition = { idx: number; x: number; lineIdx: number };

interface Props {
  notes: GeneratedNote[];
  /** Indices that should be highlighted blue (current note/s) */
  highlightedIndices: number[];
  noteResults: ('correct' | 'wrong' | 'pending')[];
  keySignature: string;
  timeSignature: [number, number];
  /** Called once after VexFlow renders with the absolute x-position of each note */
  onNotePositions?: (positions: NotePosition[]) => void;
}

function buildHtml(
  notes: GeneratedNote[],
  highlightedIndices: number[],
  noteResults: ('correct' | 'wrong' | 'pending')[],
  keySignature: string,
  timeSignature: [number, number]
): string {
  const notesJson = JSON.stringify(notes);
  const resultsJson = JSON.stringify(noteResults);
  const highlightJson = JSON.stringify(highlightedIndices);
  const [beats, beatValue] = timeSignature;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<style>
  body{margin:0;padding:4px;background:#fff;overflow:hidden;}
  #error{color:red;font-family:sans-serif;font-size:11px;padding:4px;}
  svg{max-width:100%;}
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
  var keySig="${keySignature}";
  var beats=${beats};
  var beatValue=${beatValue};
  var timeSig=beats+"/"+beatValue;
  var BEATS_PER_LINE=8;
  var BEAT_VALUES={w:4,h:2,q:1,"8":0.5};

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
    var lines=[],cur=[],beats=0;
    for(var i=0;i<items.length;i++){
      var nb=BEAT_VALUES[items[i].note.duration]||1;
      if(beats+nb>BEATS_PER_LINE&&cur.length>0){lines.push(cur);cur=[items[i]];beats=nb;}
      else{cur.push(items[i]);beats+=nb;}
    }
    if(cur.length>0)lines.push(cur);
    return lines;
  }

  var tLines=isGrand?splitLines(trebleItems):splitLines(singleItems);
  var bLines=isGrand?splitLines(bassItems):[];
  var numLines=Math.max(tLines.length,bLines.length);

  var div=document.getElementById("output");
  var W=Math.max(window.innerWidth-8,300);
  var SYSTEM_H=isGrand?200:120;
  var GRAND_GAP=90;
  var totalH=numLines*SYSTEM_H+40;

  var renderer=new VF.Renderer(div,VF.Renderer.Backends.SVG);
  renderer.resize(W,totalH);
  var ctx=renderer.getContext();
  ctx.setFont("Arial",10,"");

  function getColor(i){
    if(highlighted.has(i)) return "#1E90FF";
    if(results[i]==="correct") return "#22c55e";
    if(results[i]==="wrong") return "#ef4444";
    return "#1a1d2e";
  }

  function makeSN(item,clef){
    var sn=new VF.StaveNote({clef:clef,keys:item.note.keys,duration:item.note.duration});
    var col=getColor(item.idx);
    sn.setStyle({fillStyle:col,strokeStyle:col});
    return sn;
  }

  var allPos=[];
  function drawVoice(items,clef,stave){
    if(!items||items.length===0) return [];
    var sns=items.map(function(it){return makeSN(it,clef);});
    var v=new VF.Voice({num_beats:BEATS_PER_LINE,beat_value:beatValue})
      .setMode(VF.Voice.Mode.SOFT);
    v.addTickables(sns);
    new VF.Formatter().joinVoices([v]).format([v],W-70);
    v.draw(ctx,stave);
    return sns;
  }

  for(var li=0;li<numLines;li++){
    var yBase=li*SYSTEM_H+20;
    var isFirst=li===0;
    var sw=W-20;

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
      if(tLines[li])tLines[li].forEach(function(it,i){if(tSns[i])allPos.push({idx:it.idx,x:tSns[i].getAbsoluteX(),lineIdx:li});});
      if(bLines[li])bLines[li].forEach(function(it,i){if(bSns[i])allPos.push({idx:it.idx,x:bSns[i].getAbsoluteX(),lineIdx:li});});
    } else {
      var st=new VF.Stave(10,yBase,sw);
      st.addClef(activeClef);
      if(isFirst){st.addKeySignature(keySig);st.addTimeSignature(timeSig);}
      st.setContext(ctx).draw();
      var stSns=drawVoice(tLines[li],activeClef,st);
      if(tLines[li])tLines[li].forEach(function(it,i){if(stSns[i])allPos.push({idx:it.idx,x:stSns[i].getAbsoluteX(),lineIdx:li});});
    }
  }
  try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'positions',data:allPos}));}catch(_){}

}catch(e){document.getElementById("error").textContent="Error: "+e.message;}
})();
</script>
</body>
</html>`;
}

export default function SheetMusic({ notes, highlightedIndices, noteResults, keySignature, timeSignature, onNotePositions }: Props) {
  const html = useMemo(
    () => buildHtml(notes, highlightedIndices, noteResults, keySignature, timeSignature),
    [notes, highlightedIndices, noteResults, keySignature, timeSignature]
  );

  const isGrand = notes.some(n => n.clef === 'treble') && notes.some(n => n.clef === 'bass');
  // For grand staff, base line count on one clef only (treble); both staves share systems.
  const referenceNotes = isGrand ? notes.filter(n => n.clef === 'treble') : notes;
  const totalBeats = referenceNotes.reduce((s, n) => s + (DURATION_BEATS[n.duration] ?? 1), 0);
  const numLines = Math.max(1, Math.ceil(totalBeats / 8));
  const height = isGrand ? Math.max(220, numLines * 200 + 40) : Math.max(170, numLines * 120 + 40);

  function handleMessage(e: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'positions') onNotePositions?.(msg.data);
    } catch (_) {}
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  webview: { flex: 1, backgroundColor: '#fff' },
});
