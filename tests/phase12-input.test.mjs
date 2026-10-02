import test from 'node:test';import assert from 'node:assert/strict';
import {StageInput,curveHandlePosition} from '../dist/input/stage.js';
import {editorAction} from '../dist/ui/editor.js';import {contextControls} from '../dist/ui/context.js';
import {project,object,History,clone} from '../dist/document/model.js';
import {configureAutoKey,compatible,evaluated} from '../dist/animation/evaluate.js';
import {world,point} from '../dist/scene/matrix.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} differs from ${expected}`);
function withDocument(fn){const old=globalThis.document;globalThis.document={activeElement:null};try{fn();}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}}
function fixture(tool='select',n){
 const a={doc:project(),tool,selected:n?[n.id]:[],time:0,multi:false,snap:false,nodeEdit:false,audio:{},properties:{flush(){}},pause(){},toast(){},ease:'linear',render(){},renderStage(){}};if(n)a.doc.layers=[n];
 a.history=new History(()=>a.doc,p=>a.doc=p);a.mutate=(label,fn)=>a.history.run(label,fn);
 const stage=Object.create(StageInput.prototype);Object.assign(stage,{a,pointers:new Map(),view:{zoom:1,x:0,y:0},fitScale:1,el:{setPointerCapture(){}},overlay:{innerHTML:''},coord:e=>({x:e.clientX,y:e.clientY}),layout(){}});return stage;
}
function event(x,y,target={},extra={}){return {button:0,pointerId:1,pointerType:'pen',clientX:x,clientY:y,preventDefault(){},target:{closest:s=>s==='[data-node]'&&target.node!==undefined?{dataset:{node:String(target.node),side:target.side}}:s==='[data-handle]'&&target.handle?{dataset:{handle:target.handle}}:null},...extra};}
const ink=()=>object('freehand',{nodes:[{x:0,y:0},{x:50,y:40},{x:100,y:0}],fill:'none',strokeWidth:4});
test('Pencil, Path and Direct point modes show anchors without an object box; Select retains scale handles',()=>{
 const n=ink(),s=fixture('pencil',n);s.a.nodeEdit=true;s.a.activeNode=1;
 for(const tool of ['pencil','path','direct']){s.a.tool=tool;s.handles();assert.doesNotMatch(s.overlay.innerHTML,/<polygon|data-handle=/);assert.match(s.overlay.innerHTML,/data-node="1"/);}
 s.a.tool='select';s.handles();assert.match(s.overlay.innerHTML,/<polygon/);assert.match(s.overlay.innerHTML,/data-handle="resize-se"/);assert.doesNotMatch(s.overlay.innerHTML,/data-node=/);
});
test('finishing Pencil enables anchor editing without silently adding Bézier curvature',()=>withDocument(()=>{
 const s=fixture('pencil');s.down(event(20,20));s.move(event(60,40));s.move(event(100,20));s.up(event(100,20));
 const n=s.a.doc.layers[0];assert.equal(n.type,'freehand');assert.equal(s.a.nodeEdit,true);assert.ok(Number.isInteger(s.a.activeNode));assert.equal(n.nodes.length,3);assert.ok(n.nodes.every(p=>!p.in&&!p.out));assert.equal(s.a.history.undoStack.length,1);
 const original=clone(n.nodes);s.down(event(60,40,{node:1}));s.move(event(70,45,{node:1}));s.up(event(70,45,{node:1}));assert.equal(s.a.doc.layers.length,1);close(n.nodes[1].x,original[1].x+10);close(n.nodes[1].y,original[1].y+5);assert.ok(n.nodes.every(p=>!p.in&&!p.out));
}));
test('finishing a dragged Pen path exposes its constructed Bézier handles and no bounding box',()=>withDocument(()=>{
 const s=fixture('path');s.down(event(10,10));s.up(event(10,10));s.down(event(90,50));s.move(event(105,65));s.up(event(105,65));s.finishPath();s.handles();
 assert.equal(s.a.nodeEdit,true);assert.equal(s.a.activeNode,1);assert.equal(s.a.history.undoStack.length,1);assert.match(s.overlay.innerHTML,/data-side="in"/);assert.match(s.overlay.innerHTML,/data-side="out"/);assert.doesNotMatch(s.overlay.innerHTML,/<polygon/);
}));
test('explicit curve and corner actions preserve initial geometry, AutoKey, compatible shape tracks and undo',()=>{
 const n=ink(),s=fixture('direct',n);s.a.nodeEdit=true;s.a.activeNode=1;s.a.time=2;configureAutoKey(s.a.doc,true,'linear');const original=clone(n.nodes);
 editorAction(s.a,'curve');assert.deepEqual(n.tracks.nodes.map(k=>k.time),[0,2]);assert.equal(s.a.history.undoStack.length,1);assert.ok(compatible(n.tracks.nodes[0].value,n.tracks.nodes[1].value));
 const initial=evaluated(n,0).nodes;initial.forEach((p,i)=>{close(p.x,original[i].x);close(p.y,original[i].y);});assert.deepEqual(initial[1].in,{x:50,y:40});assert.deepEqual(initial[1].out,{x:50,y:40});assert.ok(evaluated(n,1).nodes[1].out.x>50);
 s.a.time=3;editorAction(s.a,'corner');const corner=evaluated(n,3).nodes[1];assert.deepEqual(corner.in,{x:corner.x,y:corner.y});assert.deepEqual(corner.out,{x:corner.x,y:corner.y});assert.ok(compatible(n.tracks.nodes[1].value,n.tracks.nodes[2].value));s.a.history.undo();assert.ok(evaluated(s.a.doc.layers[0],3).nodes[1].out.x>50);
 const controls=contextControls(s.a).body;assert.match(controls,/Convert to curve/);assert.match(controls,/Smooth point/);assert.match(controls,/Corner point/);
});
test('curve conversion with AutoKey off edits the base and undo restores the untouched pencil data',()=>{
 const n=ink(),s=fixture('direct',n),before=clone(n);s.a.activeNode=0;s.a.nodeEdit=true;configureAutoKey(s.a.doc,false);editorAction(s.a,'curve');assert.deepEqual(n.tracks,{});assert.ok(Math.hypot(n.nodes[0].out.x,n.nodes[0].out.y)>0);s.a.history.undo();assert.deepEqual(s.a.doc.layers[0],before);
});
test('short Bézier touch proxies preserve grab offset and drag only the selected handle under scaling',()=>withDocument(()=>{
 const n=object('freehand',{x:100,y:50,scaleX:2,scaleY:2,nodes:[{x:0,y:0},{x:3,y:2,in:{x:2,y:1},out:{x:4,y:3}},{x:6,y:0}],fill:'none'}),s=fixture('pencil',n);s.a.nodeEdit=true;s.a.activeNode=1;
 const m=world(s.a.doc,n.id,0),anchor=point(m,n.nodes[1]),control=point(m,n.nodes[1].out),proxy=curveHandlePosition(anchor,control,'out',1);close(Math.hypot(proxy.x-anchor.x,proxy.y-anchor.y),36);
 const start=event(proxy.x+2,proxy.y-1,{node:1,side:'out'}),before=clone(n.nodes);s.down(start);s.move(start);assert.deepEqual(n.nodes,before);
 const end=event(start.clientX+10,start.clientY-4,{node:1,side:'out'});s.move(end);s.up(end);assert.equal(s.a.doc.layers.length,1);close(n.nodes[1].out.x,9);close(n.nodes[1].out.y,1);assert.deepEqual(n.nodes[1].in,before[1].in);close(n.nodes[1].x,3);close(n.nodes[1].y,2);assert.equal(s.a.history.undoStack.length,1);
}));
test('Uniform size and Shift draw square rectangles and circles in either drag direction',()=>withDocument(()=>{
 for(const tool of ['rect','ellipse'])for(const shift of [false,true]){const s=fixture(tool);s.a.constrain=!shift;s.down(event(100,100));s.move(event(70,112,{}, {shiftKey:shift}));s.up(event(70,112));const n=s.a.doc.layers[0];assert.equal(n.width,30);assert.equal(n.height,30);assert.equal(n.x,70);assert.equal(n.y,100);}
}));
test('uniform edge and centre-corner resizing can shrink arbitrary aspect ratios without jumps or drift',()=>withDocument(()=>{
 for(const centre of [false,true]){const n=object('rectangle',{x:30,y:40,width:200,height:100,scaleX:2,scaleY:3,rotation:30,anchorX:20,anchorY:10}),s=fixture('select',n);s.a.constrain=true;s.a.fromCenter=centre;
  const m=world(s.a.doc,n.id,0),tip={x:200,y:centre?100:50},base=centre?{x:100,y:50}:{x:0,y:50},oldBase=point(m,base),grab=point(m,tip),start=event(grab.x+5,grab.y-3,{handle:centre?'resize-se':'resize-e'}),before=clone(n);
  s.down(start);s.move(start);close(n.x,before.x);close(n.y,before.y);close(n.scaleX,2);close(n.scaleY,3);
  const dx=centre?-20:-40,dy=centre?-10:0,end=event(start.clientX+m[0]*dx+m[2]*dy,start.clientY+m[1]*dx+m[3]*dy,{handle:centre?'resize-se':'resize-e'});
  s.move(end);const after=clone(n);s.move(end);close(n.x,after.x);close(n.y,after.y);close(n.scaleX,1.6);close(n.scaleY,2.4);const now=point(world(s.a.doc,n.id,0),base);close(now.x,oldBase.x);close(now.y,oldBase.y);close(n.width*n.scaleX/(n.height*n.scaleY),4/3);s.up(end);assert.equal(s.a.history.undoStack.length,1);s.a.history.undo();assert.deepEqual(s.a.doc.layers[0],before);
 }
}));
