import test from 'node:test';import assert from 'node:assert/strict';
import {StageInput} from '../dist/input/stage.js';import {rotationReadout} from '../dist/input/rotation.js';
import {project,object,History,clone} from '../dist/document/model.js';
import {configureAutoKey,evaluated} from '../dist/animation/evaluate.js';import {validate} from '../dist/document/validate.js';
import {world,point} from '../dist/scene/matrix.js';import {artwork} from '../dist/renderer/svg.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
function withDocument(fn){const previous=globalThis.document;globalThis.document={activeElement:null};try{fn();}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}}
function fixture(rotation=0){const n=object('rectangle',{x:250,y:250,rotation}),a={doc:project(),selected:[n.id],tool:'select',time:2,ease:'linear',constrain:false,audio:{},properties:{flush(){}},pause(){},render(){},renderStage(){},toast(){}};a.doc.layers=[n];a.history=new History(()=>a.doc,p=>{a.doc=p;configureAutoKey(p,true,'linear');});configureAutoKey(a.doc,true,'linear');const s=Object.create(StageInput.prototype);Object.assign(s,{a,pointers:new Map(),view:{zoom:1,x:0,y:0},fitScale:1,el:{setPointerCapture(){}},coord:e=>({x:e.clientX,y:e.clientY}),layout(){}});return s;}
function event(angle,extra={}){const r=angle*Math.PI/180;return {button:0,pointerId:1,pointerType:'touch',clientX:250+80*Math.cos(r),clientY:250+80*Math.sin(r),preventDefault(){},target:{closest:q=>q==='[data-handle]'?{dataset:{handle:'rotate'}}:null},...extra};}
function spin(s,start,sweep,extra={}){s.down(event(start,extra));for(let step=1;step<=Math.ceil(Math.abs(sweep)/30);step++){const delta=Math.sign(sweep)*Math.min(step*30,Math.abs(sweep));s.move(event(start+delta,extra));}s.up(event(start+sweep,extra));}
test('clockwise and counterclockwise multi-turn drags record complete signed turns with Auto Key',()=>withDocument(()=>{
 for(const [initial,sweep] of [[0,810],[720,720],[-30,-900],[-720,-540]]){const s=fixture(initial);spin(s,-90,sweep);const n=s.a.doc.layers[0];assert.equal(n.tracks.rotation.length,2);near(n.tracks.rotation[0].value,initial);near(n.tracks.rotation[1].value,initial+sweep);near(evaluated(n,0).rotation,initial);near(evaluated(n,1).rotation,initial+sweep/2);assert.equal(s.a.history.undoStack.length,1);validate(clone(s.a.doc));s.a.history.undo();assert.deepEqual(s.a.doc.layers[0].tracks,{});near(s.a.doc.layers[0].rotation,initial);s.a.history.redo();near(evaluated(s.a.doc.layers[0],2).rotation,initial+sweep);}
}));
test('crossing atan2 boundary keeps small increments, direction reversals and new gesture offsets',()=>withDocument(()=>{
 const s=fixture(720);s.down(event(170));s.move(event(190));near(evaluated(s.a.doc.layers[0],2).rotation,740);s.move(event(175));near(evaluated(s.a.doc.layers[0],2).rotation,725);s.up(event(175));spin(s,175,450);near(evaluated(s.a.doc.layers[0],2).rotation,1175);assert.equal(s.a.doc.layers[0].tracks.rotation.length,2);assert.equal(s.a.history.undoStack.length,2);s.a.history.undo();near(evaluated(s.a.doc.layers[0],2).rotation,725);
}));
test('snapping retains the unsnapped winding and supports changing Shift within a gesture',()=>withDocument(()=>{
 const s=fixture();s.down(event(0));for(let a=30;a<=720;a+=30)s.move(event(a,{shiftKey:true}));s.move(event(727,{shiftKey:true}));near(evaluated(s.a.doc.layers[0],2).rotation,720);s.move(event(733,{shiftKey:true}));near(evaluated(s.a.doc.layers[0],2).rotation,735);s.move(event(733));near(evaluated(s.a.doc.layers[0],2).rotation,733);s.up(event(733));
}));
test('cancellation removes the whole spin and the next gesture starts from the restored pose',()=>withDocument(()=>{
 const s=fixture(40),before=clone(s.a.doc);s.down(event(0));for(let a=30;a<=900;a+=30)s.move(event(a));s.cancel(event(900));assert.deepEqual(s.a.doc,before);assert.equal(s.a.history.undoStack.length,0);spin(s,0,-720);near(evaluated(s.a.doc.layers[0],2).rotation,-680);
}));
test('saved block spins retain numerical turns and intermediate exported transforms',()=>withDocument(()=>{
 const s=fixture();s.a.doc.layers[0].blocks=[{id:'spin',name:'Spin',kind:'animation',start:1,end:3,props:[],tracks:{}}];spin(s,-90,720);const n=validate(JSON.parse(JSON.stringify(s.a.doc))).layers[0];assert.equal(n.tracks.rotation,undefined);assert.deepEqual(n.blocks[0].tracks.rotation.map(k=>k.time),[1,2]);near(n.blocks[0].tracks.rotation[0].value,0);near(n.blocks[0].tracks.rotation[1].value,720);near(evaluated(n,1.125).rotation,90);const p={...s.a.doc,layers:[n]},q=point(world(p,n.id,1.125),{x:100,y:0});near(q.x,250);near(q.y,350);assert.match(artwork(n,1.125),/matrix\([^)]*1 -1/);near(evaluated(n,0).rotation,0);
}));
test('Properties readout shows signed full turns without rounding away partial turns',()=>{assert.equal(rotationReadout(720),'2 turns · 0°');assert.equal(rotationReadout(810),'2 turns · 90°');assert.equal(rotationReadout(-450),'-1 turn · -90°');assert.equal(rotationReadout(359.99999999),'1 turn · 0°');assert.equal(rotationReadout(45.25),'0 turns · 45.25°');});
