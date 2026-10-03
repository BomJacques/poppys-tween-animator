import test from 'node:test';import assert from 'node:assert/strict';
import {StageInput} from '../dist/input/stage.js';import {object,project,History,clone,find} from '../dist/document/model.js';import {configureAutoKey,evaluated} from '../dist/animation/evaluate.js';import {world,point} from '../dist/scene/matrix.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} differs from ${b}`);
function fixture(){
 const path=props=>object('path',{closed:false,nodes:[{x:0,y:0,in:{x:-15,y:0},out:{x:15,y:0}},{x:150,y:100}],...props});
 const left=path({x:20,y:30,rotation:17,scaleX:1.2,scaleY:.7}),right=path({x:260,y:50,rotation:-40,scaleX:.6,scaleY:1.4});
 const nested=object('group',{x:15,y:10,rotation:-12,scaleX:1.1,children:[right]}),group=object('group',{x:180,y:130,rotation:29,scaleX:1.3,scaleY:.8,children:[left,nested]});
 const a={doc:project(),selected:[],tool:'direct',nodeEdit:true,time:2,multi:false,audio:{},properties:{flush(){}},pause(){},render(){s.handles();},renderStage(){s.handles();},toast(){}};a.doc.width=1000;a.doc.height=600;a.doc.layers=[group];configureAutoKey(a.doc,true,'linear');a.history=new History(()=>a.doc,p=>{a.doc=p;configureAutoKey(a.doc,true,'linear');});
 const s=Object.assign(Object.create(StageInput.prototype),{a,fitScale:1,pointers:new Map(),view:{zoom:1.5,x:20,y:-10,rotation:35},el:{setPointerCapture(){}},overlay:{innerHTML:''},layout(){}});
 // Real SVG CTM inverse: canvas view rotation, zoom and page offset are all active.
 const angle=35*Math.PI/180,c=Math.cos(angle)*1.5,d=Math.sin(angle)*1.5;
 s.svg={getScreenCTM:()=>({inverse:()=>({a:c/2.25,b:-d/2.25,c:d/2.25,d:c/2.25,e:-(c*250+d*120)/2.25,f:(d*250-c*120)/2.25})})};
 s.screen=p=>({clientX:c*p.x-d*p.y+250,clientY:d*p.x+c*p.y+120});return {s,a,left,right,group,nested};
}
function event(s,p,target={},extra={}){return {button:0,pointerId:1,pointerType:'touch',...s.screen(p),preventDefault(){},target:{closest:q=>q==='[data-node]'&&target.node!==undefined?{dataset:{node:String(target.node),object:target.id,side:target.side}}:q==='[data-id]'&&target.shape?{dataset:{id:target.shape}}:null},...extra};}
function env(fn){const old=globalThis.document;globalThis.document={activeElement:null};try{fn();}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}}
function marquee(s,p,q,extra={}){s.down(event(s,p,{},extra));assert.equal(s.g.type,'marquee');s.move(event(s,q,{},extra));s.up(event(s,q,{},extra));}
test('Direct touch marquee selects actual anchors across nested group transforms and drags the cohort with AutoKey in one undo',()=>env(()=>{
 const {s,a,left,right,group,nested}=fixture(),before=clone(a.doc),l=point(world(a.doc,left.id,2),left.nodes[0]),r=point(world(a.doc,right.id,2),right.nodes[0]);
 const min={x:Math.min(l.x,r.x)-5,y:Math.min(l.y,r.y)-5},max={x:Math.max(l.x,r.x)+5,y:Math.max(l.y,r.y)+5};marquee(s,min,max);
 assert.deepEqual(a.selected,[left.id,right.id]);assert.deepEqual(a.pointSelection,{[left.id]:[0],[right.id]:[0]});assert.equal(a.history.undoStack.length,0);assert.deepEqual(a.doc,before);
 assert.match(s.overlay.innerHTML,new RegExp(`data-object="${left.id}" data-node="0"`));assert.match(s.overlay.innerHTML,new RegExp(`data-object="${right.id}" data-node="0"`));
 const delta={x:26,y:-19},target={x:r.x+delta.x,y:r.y+delta.y};s.down(event(s,r,{id:right.id,node:0}));assert.equal(s.g.pointItems.length,2);s.move(event(s,target,{id:right.id,node:0}));s.up(event(s,target,{id:right.id,node:0}));
 for(const n of [left,right]){const original=point(world(a.doc,n.id,0),evaluated(n,0).nodes[0]),moved=point(world(a.doc,n.id,2),evaluated(n,2).nodes[0]);near(moved.x-original.x,delta.x);near(moved.y-original.y,delta.y);assert.deepEqual(evaluated(n,0).nodes,find(before,n.id).nodes);assert.deepEqual(evaluated(n,2).nodes[1],n.nodes[1]);assert.deepEqual(n.tracks.nodes.map(k=>k.time),[0,2]);}
 assert.equal(a.doc.layers[0],group);assert.equal(group.children[1],nested);assert.equal(nested.children[0],right);assert.equal(a.history.undoStack.length,1);a.history.undo();assert.deepEqual(a.doc,before);
}));
test('Direct marquee ignores shape bounds without enclosed anchors, hidden descendants and locked ancestors',()=>env(()=>{
 const {s,a,left,right,nested}=fixture(),p=point(world(a.doc,left.id,2),{x:75,y:50});marquee(s,{x:p.x-10,y:p.y-10},{x:p.x+10,y:p.y+10});assert.deepEqual(a.selected,[]);
 left.visible=false;nested.locked=true;marquee(s,{x:0,y:0},{x:1000,y:600});assert.deepEqual(a.selected,[]);assert.equal(a.history.undoStack.length,0);
 left.visible=true;nested.locked=false;nested.visible=false;marquee(s,{x:0,y:0},{x:1000,y:600});assert.deepEqual(a.selected,[left.id]);assert.deepEqual(a.pointSelection[left.id],[0,1]);assert.ok(!a.pointSelection[right.id]);
}));
test('additive Direct marquee preserves earlier point selection and cancellation restores a multi-shape edit',()=>env(()=>{
 const {s,a,left,right}=fixture(),l=point(world(a.doc,left.id,2),left.nodes[0]),r=point(world(a.doc,right.id,2),right.nodes[0]);
 marquee(s,{x:l.x-6,y:l.y-6},{x:l.x+6,y:l.y+6});marquee(s,{x:r.x-6,y:r.y-6},{x:r.x+6,y:r.y+6},{shiftKey:true});assert.deepEqual(a.pointSelection,{[left.id]:[0],[right.id]:[0]});
 const before=clone(a.doc);s.down(event(s,l,{id:left.id,node:0}));s.move(event(s,{x:l.x+30,y:l.y+10},{id:left.id,node:0}));s.cancel(event(s,l,{id:left.id,node:0}));assert.deepEqual(a.doc,before);assert.equal(a.history.undoStack.length,0);
}));
test('marquee converts only hit primitive children, leaves grouping intact and exposes their anchors',()=>env(()=>{
 const {s,a,group}=fixture(),rect=object('rectangle',{x:30,y:20,width:120,height:80}),untouched=object('ellipse',{x:600,y:300});group.children=[rect,untouched];const p=point(world(a.doc,rect.id,2),{x:0,y:0}),before=clone(a.doc);marquee(s,{x:p.x-8,y:p.y-8},{x:p.x+8,y:p.y+8});assert.equal(rect.type,'path');assert.equal(untouched.type,'ellipse');assert.deepEqual(a.pointSelection,{[rect.id]:[0]});assert.equal(group.children.length,2);assert.match(s.overlay.innerHTML,new RegExp(`data-object="${rect.id}" data-node="0"`));a.history.undo();assert.deepEqual(a.doc,before);
}));
test('Direct dragging a path body without a point cohort retains whole-object drag semantics',()=>env(()=>{
 const {s,a,left}=fixture(),p=point(world(a.doc,left.id,2),{x:50,y:30}),before=clone(left.nodes);s.down(event(s,p,{shape:left.id}));assert.equal(s.g.type,'move');s.move(event(s,{x:p.x+20,y:p.y+10},{shape:left.id}));s.up(event(s,{x:p.x+20,y:p.y+10},{shape:left.id}));assert.deepEqual(evaluated(left,2).nodes,before);assert.ok(left.tracks.x.length);assert.equal(a.history.undoStack.length,1);
}));
