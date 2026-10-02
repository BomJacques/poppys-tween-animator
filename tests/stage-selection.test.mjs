import test from 'node:test';import assert from 'node:assert/strict';
import {StageInput} from '../dist/input/stage.js';import {project,object,History} from '../dist/document/model.js';
import {createMesh} from '../dist/scene/mesh.js';
function fixture(tool='select'){
 const a={doc:project(),tool,selected:[],multi:false,tapSelect:false,time:0,audio:{},properties:{flush(){}},pause(){},render(){},renderStage(){},toast(){}};
 a.history=new History(()=>a.doc,p=>a.doc=p);const stage=Object.create(StageInput.prototype);Object.assign(stage,{a,pointers:new Map(),view:{zoom:1,x:0,y:0},fitScale:1,el:{setPointerCapture(){}},coord:e=>({x:e.clientX,y:e.clientY}),layout(){}});return stage;
}
const event=(x,y,hit,type='touch')=>({button:0,pointerId:1,pointerType:type,clientX:x,clientY:y,preventDefault(){},target:{closest:s=>s==='[data-id]'&&hit?{dataset:{id:hit}}:null}});
test('graph editing owns history and prevents a simultaneous canvas gesture',()=>{const stage=fixture();stage.a.graphGestureActive=true;stage.down(event(50,50));assert.equal(stage.g,undefined);assert.equal(stage.pointers.size,0);assert.equal(stage.a.history.before,null);});
function clock(fn){const oldTimeout=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldDoc=globalThis.document;let callback,delay;globalThis.setTimeout=(cb,ms)=>{callback=cb;delay=ms;return 1;};globalThis.clearTimeout=()=>{callback=null;};globalThis.document={activeElement:null};try{fn(()=>{const c=callback;assert.ok(c,'hold timer is armed');c();},()=>delay,()=>callback);}finally{globalThis.setTimeout=oldTimeout;globalThis.clearTimeout=oldClear;if(oldDoc===undefined)delete globalThis.document;else globalThis.document=oldDoc;}}
test('shape tools select the top hit object even with the old tap-selection preference disabled',()=>clock(()=>{
 const stage=fixture('rect'),back=object('rectangle',{x:20,y:20,width:100,height:100}),front=object('ellipse',{x:40,y:40,width:100,height:100});stage.a.doc.layers=[back,front];const e=event(70,70,front.id);stage.down(e);assert.deepEqual(stage.a.selected,[front.id]);assert.equal(stage.g.type,'move');stage.up(e);assert.equal(stage.a.doc.layers.length,2);assert.equal(stage.a.history.undoStack.length,0);
}));
test('medium touch hold then drag makes a marquee in a shape tool without adding artwork',()=>clock((fire,delay)=>{
 const stage=fixture('ellipse'),n=object('rectangle',{x:20,y:20,width:40,height:40});stage.a.doc.layers=[n];stage.down(event(5,5));assert.equal(delay(),350);assert.equal(stage.a.doc.layers.length,1);fire();assert.equal(stage.g.type,'marquee');stage.move(event(80,80));stage.up(event(80,80));assert.deepEqual(stage.a.selected,[n.id]);assert.equal(stage.a.doc.layers.length,1);assert.equal(stage.a.history.undoStack.length,0);
}));
test('a quick empty-space finger drag pans Select mode and cancels the marquee dwell',()=>clock((fire,delay,timer)=>{
 const stage=fixture();stage.down(event(5,5));assert.equal(stage.g.type,'blank-touch');stage.move(event(25,35));assert.equal(stage.g.type,'pan');assert.deepEqual(stage.view,{zoom:1,x:20,y:30});assert.equal(timer(),null);stage.up(event(25,35));assert.deepEqual(stage.a.selected,[]);
}));
test('early drawing movement, release and a second finger cancel pending marquee activation',()=>clock((fire,delay,timer)=>{
 const stage=fixture('rect');stage.down(event(5,5));stage.move(event(40,40));assert.equal(stage.g.type,'draw');assert.equal(timer(),null);stage.up(event(40,40));assert.equal(stage.a.doc.layers.length,1);
 const second=fixture();second.down(event(5,5));second.down({...event(50,5),pointerId:2});assert.equal(second.g.type,'pinch');assert.equal(timer(),null);
 const third=fixture();third.down(event(5,5));third.up(event(5,5));assert.equal(timer(),null);assert.equal(third.g,null);
}));

const meshEvent=(x,y,index)=>({...event(x,y),target:{closest:s=>s==='[data-mesh]'?{dataset:{mesh:String(index)}}:null}});
function meshFixture(props={}){
 const stage=fixture('mesh'),n=object('rectangle',{width:100,height:100,...props});
 n.mesh=createMesh({x:0,y:0,width:100,height:100},n.fill,3,3);stage.a.doc.layers=[n];stage.a.selected=[n.id];return {stage,n};
}
test('the transparent mesh-point target does not swallow an area insertion away from its visible point',()=>clock(()=>{
 const {stage,n}=meshFixture({x:10,y:20,scaleX:2,scaleY:2});stage.a.meshInsert=true;
 // The centre point is at world (110,120). A point 15 CSS pixels away is
 // inside its 22px transparent hit circle, but outside the visible-point zone.
 const tap=meshEvent(125,120,4),before=structuredClone(n.mesh);stage.down(tap);
 assert.equal(stage.g.type,'mesh-insert-tap');assert.equal(stage.a.history.before,null);
 stage.up(tap);assert.equal(n.mesh.rows,3);assert.equal(n.mesh.cols,4);
 const inserted=n.mesh.points[stage.a.activeMesh];assert.ok(Math.abs(inserted.x-57.5)<1e-6);assert.ok(Math.abs(inserted.y-50)<1e-6);
 for(const original of before.points)assert.ok(n.mesh.points.some(p=>p.x===original.x&&p.y===original.y&&p.color===original.color),'existing shading point is preserved');
 assert.equal(stage.a.history.undoStack.length,1);assert.equal(stage.g,null);assert.equal(stage.pointers.size,0);
}));
test('a tap on the visible mesh point still selects it without inserting a row or column',()=>clock((fire,delay,timer)=>{
 const {stage,n}=meshFixture({x:10,y:20,scaleX:2,scaleY:2});stage.a.meshInsert=true;
 const before=structuredClone(n.mesh),tap=meshEvent(112,120,4);stage.down(tap);
 assert.equal(stage.g.type,'mesh');assert.equal(stage.a.activeMesh,4);assert.equal(delay(),550);
 stage.up(tap);assert.deepEqual(n.mesh,before);assert.equal(timer(),null);assert.equal(stage.a.history.undoStack.length,0);
}));
test('mesh bounds taps use local coordinates and commit one undoable edit preserving shading keys',()=>clock(()=>{
 const {stage,n}=meshFixture({x:50,y:30,scaleX:2,scaleY:2});
 const first=structuredClone(n.mesh),last=structuredClone(n.mesh);last.points[4].color='#ff0000';
 n.tracks.mesh=[{id:'mesh-start',time:0,value:first,easing:'linear'},{id:'mesh-end',time:2,value:last,easing:'linear'}];
 const before=structuredClone(stage.a.doc);stage.a.meshPlacement={id:n.id};
 const one=meshEvent(70,70,0);stage.down(one);assert.equal(stage.g.type,'mesh-place');stage.up(one);
 assert.deepEqual(stage.a.meshPlacement,{id:n.id,first:{x:10,y:20}});
 assert.deepEqual(stage.a.doc,before);assert.equal(stage.a.history.before,null);assert.equal(stage.a.history.undoStack.length,0);
 const two=meshEvent(230,190,8);stage.down(two);stage.up(two);
 assert.equal(stage.a.meshPlacement,null);assert.equal(stage.a.history.undoStack.length,1);
 const expected={x:10,y:20,width:80,height:60};assert.deepEqual(n.mesh.manualBounds,expected);
 for(const key of n.tracks.mesh){assert.deepEqual(key.value.manualBounds,expected);assert.equal(key.value.rows,3);assert.equal(key.value.cols,3);}
 assert.equal(n.tracks.mesh[1].value.points[4].color,'#ff0000');assert.deepEqual(n.tracks.mesh.map(k=>k.time),[0,2]);
 assert.equal(stage.g,null);assert.equal(stage.pointers.size,0);stage.a.history.undo();assert.deepEqual(stage.a.doc,before);
}));
test('invalid, dragged and canceled mesh bounds taps leave document and history intact and allow retry',()=>clock(()=>{
 const {stage,n}=meshFixture(),messages=[];stage.a.toast=message=>messages.push(message);stage.a.meshPlacement={id:n.id};
 const before=structuredClone(stage.a.doc),tap=(x,y)=>{const e=event(x,y);stage.safe(()=>stage.down(e));stage.safe(()=>stage.up(e));};
 tap(-5,50);assert.match(messages.at(-1),/inside/);assert.equal(stage.a.meshPlacement.first,undefined);
 stage.down(event(10,10));stage.cancel(event(10,10));assert.equal(stage.a.meshPlacement.first,undefined);
 stage.down(event(10,10));stage.move(event(30,30));stage.up(event(30,30));assert.equal(stage.a.meshPlacement.first,undefined);
 tap(10,10);assert.deepEqual(stage.a.meshPlacement.first,{x:10,y:10});
 tap(10,10);assert.match(messages.at(-1),/different/);assert.deepEqual(stage.a.meshPlacement.first,{x:10,y:10});
 tap(120,80);assert.match(messages.at(-1),/inside/);assert.deepEqual(stage.a.meshPlacement.first,{x:10,y:10});
 stage.down(event(90,90));stage.cancel(event(90,90));
 assert.deepEqual(stage.a.doc,before);assert.equal(stage.a.history.undoStack.length,0);assert.equal(stage.a.history.before,null);assert.equal(stage.pointers.size,0);
 tap(90,90);assert.equal(stage.a.meshPlacement,null);assert.equal(stage.a.history.undoStack.length,1);assert.deepEqual(stage.a.doc.layers[0].mesh.manualBounds,{x:10,y:10,width:80,height:80});
}));
