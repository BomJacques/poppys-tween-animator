import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {showGraph,trackPanelSize,graphCoordinates,graphHitRadius} from '../dist/timeline/graph.js';
import {project,object,History,clone} from '../dist/document/model.js';
import {enableTrack,setProperty} from '../dist/animation/evaluate.js';

class Element extends EventTarget{
 constructor(){super();this.attrs={};this.style={setProperty:(k,v)=>this.style[k]=v};this.classes=new Set();this.classList={add:(...names)=>names.forEach(n=>this.classes.add(n)),remove:n=>this.classes.delete(n),toggle:n=>{if(this.classes.has(n)){this.classes.delete(n);return false;}this.classes.add(n);return true;}};this.children=new Map();this.writes=0;}
 set innerHTML(value){this.html=value;this.writes++;}get innerHTML(){return this.html||'';}
 setAttribute(k,v){this.attrs[k]=String(v);}
 querySelector(s){return this.children.get(s)||null;}querySelectorAll(){return [];}
 getBoundingClientRect(){return {left:0,top:0,width:620,height:240};}
 setPointerCapture(){}contains(){return false;}
}
function fixture(){
 const n=object('rectangle'),a={doc:project(),selected:[n.id],keyIds:new Set(),time:0,ease:'linear',playing:true,pauseCount:0,properties:{flush(){}},stage:{finishPath(){}},timeline:{measurement:'seconds',keys:()=>[]},toast(){}};
 a.doc.layers=[n];enableTrack(n,'x',0,'linear');setProperty(n,'x',100,2);
 a.history=new History(()=>a.doc,p=>a.doc=p);a.pause=()=>{a.pauseCount++;a.playing=false;};a.renderStage=()=>a.renderGraphPlayhead?.();a.render=()=>a.renderStage();a.seek=t=>{a.pause();a.time=t;a.renderStage();};a.mutate=(label,fn)=>{a.pause();a.history.run(label,fn);a.render();};
 const d=new Element();d.open=true;d.close=()=>{d.open=false;d.dispatchEvent(new Event('close'));};
 for(const s of ['.value-graph','.ease-graph','.graph-key-controls','.graph-curve-controls','.graph-parameter-lanes','.graph-hint','[aria-label="Graph track"]','[data-graph-add]','[data-graph-delete]','[data-graph-fold]','[data-graph-resize]','[data-graph-clock]'])d.children.set(s,new Element());
 const marker=new Element();d.querySelector('.value-graph').children.set('.graph-playhead',marker);
 a.dialog=(title,markup,options)=>{a.dialogOptions=options;a.dialogMarkup=markup;return d;};return {a,n,d,marker};
}
test('track editor opens modeless without pausing playback and renders circular keys with 44px hits',()=>{
 const {a,d}=fixture();showGraph(a);
 assert.deepEqual(a.dialogOptions,{modal:false});assert.equal(a.playing,true);assert.equal(a.pauseCount,0);assert.ok(d.classes.has('track-editor'));
 assert.match(a.dialogMarkup,/data-graph-fold/);assert.match(a.dialogMarkup,/<details class="track-editor-easing">/);
 const chart=d.querySelector('.value-graph'),lanes=d.querySelector('.graph-parameter-lanes');
 assert.match(lanes.innerHTML,/<circle/);assert.doesNotMatch(lanes.innerHTML,/<path/);
 assert.match(chart.innerHTML,/tabindex="0" role="button"/);
 const hit=Number(/r="([\d.]+)" fill="transparent"/.exec(chart.innerHTML)[1]);assert.ok(hit*2*620/700>=44);
});
test('playback advances the graph marker and clock without rebuilding charts or key fields',()=>{
 const {a,d,marker}=fixture();showGraph(a);const chart=d.querySelector('.value-graph'),controls=d.querySelector('.graph-key-controls'),writes=chart.writes,fieldWrites=controls.writes;
 a.time=1.5;a.renderStage();assert.equal(Number(marker.attrs.x1),52+1.5/6*620);assert.equal(marker.attrs.x1,marker.attrs.x2);
 assert.equal(d.querySelector('[data-graph-clock]').textContent,'1.5s');assert.equal(chart.writes,writes);assert.equal(controls.writes,fieldWrites);
 a.time=7;a.renderStage();assert.equal(marker.style.display,'none');
 d.close();assert.equal(a.renderGraphPlayhead,undefined);
});
test('opening block tracks preserves playback and graph edits remain inside the block',()=>{
 const {a,n,d}=fixture();n.blocks=[{id:'clip',name:'Animation',kind:'animation',start:0,end:2,props:['x']}];
 const original=clone(n.tracks.x);a.timeline.blockSelection={object:n.id,id:'clip'};showGraph(a);
 assert.equal(a.playing,true);assert.equal(a.pauseCount,0);assert.ok(n.blocks[0].tracks.x);assert.notEqual(n.blocks[0].tracks.x,n.tracks.x);
 a.time=1;d.querySelector('[data-graph-add]').onclick();assert.deepEqual(n.tracks.x,original);assert.equal(n.blocks[0].tracks.x.length,3);assert.equal(n.blocks[0].tracks.x[1].time,1);
});
test('background document replacement and locking refresh the editor instead of editing stale nodes',()=>{
 const {a,n,d}=fixture();showGraph(a);a.playing=false;a.doc=clone(a.doc);a.doc.layers[0].tracks.x[0].value=25;a.renderStage();
 d.querySelector('[data-graph-add]').onclick();assert.equal(a.doc.layers[0].tracks.x[0].value,25);assert.equal(n.tracks.x[0].value,0);
 a.doc.layers[0].locked=true;a.renderStage();assert.equal(d.querySelector('[data-graph-add]').disabled,true);
 const count=a.doc.layers[0].tracks.x.length;a.time=1;d.querySelector('[data-graph-add]').onclick();assert.equal(a.doc.layers[0].tracks.x.length,count);
 a.doc.layers=[];a.renderStage();assert.equal(d.open,false);assert.equal(a.renderGraphPlayhead,undefined);
});
test('closing the modeless editor during a key drag cancels the pending history edit',()=>{
 const {a,n,d}=fixture();showGraph(a);const chart=d.querySelector('.value-graph'),id=n.tracks.x[0].id,before=clone(a.doc);
 chart.onpointerdown({button:0,pointerId:1,clientX:52,clientY:180,preventDefault(){},target:{closest:s=>s==='[data-graph-key]'?{dataset:{graphKey:id}}:null}});
 assert.ok(a.history.before);assert.equal(a.graphGestureActive,true);chart.onpointermove({pointerId:1,clientX:130,clientY:100});assert.notDeepEqual(a.doc,before);
 d.close();assert.deepEqual(a.doc,before);assert.equal(a.history.before,null);assert.equal(a.history.undoStack.length,0);assert.equal(a.graphGestureActive,false);
});
test('graph drags cannot join an active stage or timeline gesture and flush pending field edits first',()=>{
 const {a,n,d}=fixture();showGraph(a);const chart=d.querySelector('.value-graph'),curve=d.querySelector('.ease-graph'),id=n.tracks.x[0].id;
 const down={button:0,pointerId:1,clientX:52,clientY:180,preventDefault(){},target:{closest:s=>s==='[data-graph-key]'?{dataset:{graphKey:id}}:s==='[data-curve-handle]'?{dataset:{curveHandle:'0'}}:null}};
 a.stage.g={edit:true};chart.onpointerdown(down);curve.onpointerdown(down);assert.equal(a.history.before,null);assert.equal(a.graphGestureActive,undefined);
 a.stage.g=null;a.timeline.g={type:'keys',edit:true};chart.onpointerdown(down);curve.onpointerdown(down);assert.equal(a.history.before,null);
 a.timeline.g=null;a.properties.pending=true;a.properties.flush=()=>a.properties.pending=false;
 const begin=a.history.begin.bind(a.history);a.history.begin=()=>{assert.equal(a.properties.pending,false);begin();};chart.onpointerdown(down);assert.equal(a.graphGestureActive,true);d.close();
});
test('round tween handles support a keyboard adjustment on the selected outgoing segment',()=>{
 const {a,n,d}=fixture();showGraph(a);const curve=d.querySelector('.ease-graph');assert.match(curve.innerHTML,/role="button" aria-label="Start tween handle/);
 let prevented=false;curve.onkeydown({key:'ArrowRight',preventDefault(){prevented=true;},target:{closest:s=>s==='[data-curve-handle]'?{dataset:{curveHandle:'0'}}:null}});
 assert.equal(prevented,true);assert.deepEqual(n.tracks.x[0].bezier,[1/3+.02,1/3,2/3,2/3]);assert.equal(n.tracks.x[1].bezier,undefined);assert.equal(a.history.undoStack.length,1);
});
test('folding leaves the transport accessible and resize gestures respect their owner and iPad bounds',()=>{
 const {a,d}=fixture();showGraph(a);const fold=d.querySelector('[data-graph-fold]'),resize=d.querySelector('[data-graph-resize]');
 fold.onclick();assert.ok(d.classes.has('track-editor-folded'));assert.equal(fold.attrs['aria-expanded'],'false');assert.equal(d.open,true);
 const previousWidth=globalThis.innerWidth,previousHeight=globalThis.innerHeight;globalThis.innerWidth=768;globalThis.innerHeight=1024;
 try{resize.onpointerdown({button:0,pointerId:8,clientX:500,clientY:500,preventDefault(){}});resize.onpointermove({pointerId:9,clientX:0,clientY:0,preventDefault(){}});assert.equal(d.style['--track-editor-width'],undefined);
  resize.onpointermove({pointerId:8,clientX:0,clientY:0,preventDefault(){}});assert.equal(d.style['--track-editor-width'],'468px');assert.ok(!d.classes.has('track-editor-folded'));assert.equal(fold.attrs['aria-expanded'],'true');resize.onpointercancel({pointerId:8});
 }finally{if(previousWidth===undefined)delete globalThis.innerWidth;else globalThis.innerWidth=previousWidth;if(previousHeight===undefined)delete globalThis.innerHeight;else globalThis.innerHeight=previousHeight;}
 assert.deepEqual(trackPanelSize(900,700,{width:1024,height:768}),{width:680,height:552.96});assert.deepEqual(trackPanelSize(1,1,{width:768,height:1024}),{width:320,height:180});
 assert.equal(trackPanelSize(680,410,{width:768,height:1024}).width,468);assert.equal(trackPanelSize(680,410,{width:390,height:844}).width,302);
});
test('docked CSS leaves part of the viewport uncovered and never supplies a blocking backdrop',async()=>{
 const css=await readFile(new URL('../dist/track-editor.css',import.meta.url),'utf8');
 assert.match(css,/position:fixed;inset:auto 12px 12px auto/);assert.match(css,/calc\(100vw - var\(--track-editor-reserve\)\)/);assert.match(css,/@media\(min-width:700px\)[^\n]*--track-editor-reserve:300px/);assert.match(css,/46dvh/);assert.match(css,/42dvh/);assert.doesNotMatch(css,/::backdrop|pointer-events:none/);
 assert.match(css,/\[data-theme=dark\] dialog\.graph-dialog\.track-editor\[open\]\{background:#242424;color:#eee/);
 assert.match(css,/\[data-theme=light\] dialog\.graph-dialog\.track-editor\[open\]\{background:#fff;color:#242424/);
 assert.match(css,/\.graph-parameter-lanes\{[^}]*max-height:44px;overflow-x:auto;overflow-y:hidden/);
 assert.match(css,/\.graph-parameter-lanes\{[^}]*flex-direction:row;justify-content:flex-start/);
 assert.match(css,/\.value-graph\{height:168px/);assert.match(css,/\.graph-top\{[^}]*height:44px/);
 assert.match(css,/\.graph-hint\{order:4/);assert.match(css,/\.graph-well\{order:2/);
});
test('letterboxed SVG pointer coordinates use its inverse screen transform and hits stay 44px',()=>{
 const matrix={a:.7,b:0,c:0,d:.7,e:100,f:20,inverse(){return {a:1/.7,b:0,c:0,d:1/.7,e:-100/.7,f:-20/.7};}};
 const svg={getScreenCTM:()=>matrix,getBoundingClientRect:()=>({left:0,top:0,width:620,height:168})};
 const p=graphCoordinates({clientX:170,clientY:90},svg,700,240);assert.ok(Math.abs(p.x-100)<1e-9);assert.ok(Math.abs(p.y-100)<1e-9);
 assert.ok(Math.abs(graphHitRadius(svg,700,240)*2*.7-44)<1e-9);
 delete svg.getScreenCTM;assert.deepEqual(graphCoordinates({clientX:310,clientY:84},svg,700,240),{x:350,y:120});assert.ok(Math.abs(graphHitRadius(svg,700,240)*2*.7-44)<1e-9);
});
