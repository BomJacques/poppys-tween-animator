import test from 'node:test';
import assert from 'node:assert/strict';
import {StageInput} from '../dist/input/stage.js';
import {project,object,History,clone} from '../dist/document/model.js';
import {configureAutoKey} from '../dist/animation/evaluate.js';

function fixture(){
 const n=object('rectangle'),a={doc:project(),selected:[n.id],tool:'select',time:2,autoKey:true,ease:'linear',multi:false,nodeEdit:false,snap:false,audio:{},properties:{flush(){}},pause(){},render(){},renderStage(){},toast(){},menus:[],showObjectMenu(id){this.menus.push(id);}};
 a.doc.layers=[n];a.history=new History(()=>a.doc,p=>{a.doc=p;configureAutoKey(a.doc,a.autoKey,a.ease);});configureAutoKey(a.doc,true,'linear');
 const s=Object.create(StageInput.prototype);Object.assign(s,{a,fitScale:1,pointers:new Map(),view:{zoom:1,x:0,y:0},el:{setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:200,height:200})},coord:e=>({x:e.clientX,y:e.clientY}),layout(){this.layouts=(this.layouts||0)+1;}});return s;
}
function ev(s,id,x=40,y=40,type='touch'){return {button:0,pointerId:id,pointerType:type,clientX:x,clientY:y,preventDefault(){},target:{closest:q=>q==='[data-id]'?{dataset:{id:s.a.selected[0]}}:null}};}
function clock(fn){const original={document:globalThis.document,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,now:Date.now},timers=new Map();let now=0,id=0;globalThis.document={activeElement:null};Date.now=()=>now;globalThis.setTimeout=(f,ms)=>{timers.set(++id,{f,at:now+ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);try{fn({elapse(ms){now+=ms;},advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.f();}},timers});}finally{globalThis.document=original.document;globalThis.setTimeout=original.setTimeout;globalThis.clearTimeout=original.clearTimeout;Date.now=original.now;}}
function pair(s){s.down(ev(s,1));s.down(ev(s,2,80));}

test('stationary two-finger hold locks zoom and pans even with separate finger events; no artwork keys or undo',()=>clock(c=>{
 const s=fixture();s.a.history.run('Earlier edit',()=>s.a.doc.layers[0].name='Earlier edit');const before=clone(s.a.doc);pair(s);c.advance(300);assert.equal(s.g.heldPan,true);assert.equal(s.g.tapCandidate,false);assert.equal(s.a.history.before,null);
 s.move(ev(s,1,70,60));assert.deepEqual(s.view,{zoom:1,x:15,y:10});s.move(ev(s,2,110,60));assert.deepEqual(s.view,{zoom:1,x:30,y:20});
 s.up(ev(s,1,70,60));s.move(ev(s,2,150,80));assert.deepEqual(s.view,{zoom:1,x:30,y:20});s.up(ev(s,2,150,80));c.advance(1000);assert.equal(s.g,null);assert.equal(c.timers.size,0);assert.deepEqual(s.a.doc,before);assert.equal(s.a.history.undoStack.length,1);assert.equal(s.a.menus.length,0);
}));
test('a quick stationary two-finger tap undoes once; first release cannot arm a held pan',()=>clock(c=>{
 const s=fixture();s.a.history.run('Earlier edit',()=>s.a.doc.layers[0].x=99);pair(s);c.advance(100);s.up(ev(s,2,80));assert.equal(s.a.doc.layers[0].x,99);assert.equal(c.timers.size,0);s.up(ev(s,1));assert.equal(s.a.doc.layers[0].x,0);assert.equal(s.a.history.undoStack.length,0);assert.equal(s.a.history.redoStack.length,1);s.up(ev(s,1));c.advance(1000);assert.equal(s.a.history.redoStack.length,1);
}));
test('pre-hold movement keeps pinch zoom and midpoint pan; movement cancels hold and undo',()=>clock(c=>{
 const s=fixture();pair(s);s.move(ev(s,2,100));assert.equal(s.view.zoom,1.5);const previous={...s.view};c.advance(300);assert.notEqual(s.g.heldPan,true);s.move(ev(s,1,60));s.move(ev(s,2,120));assert.equal(s.view.zoom,1.5);assert.equal(s.view.x,previous.x+20);s.up(ev(s,1,60));s.up(ev(s,2,120));assert.equal(s.a.history.redoStack.length,0);assert.equal(c.timers.size,0);
}));
test('second finger rolls back a keyed artwork drag before held panning; next single-finger drag still commits',()=>clock(c=>{
 const s=fixture(),before=clone(s.a.doc);s.down(ev(s,1));s.move(ev(s,1,60));assert.ok(s.a.doc.layers[0].tracks.x.length);s.down(ev(s,2,100));assert.deepEqual(s.a.doc,before);c.advance(300);s.move(ev(s,1,90));s.move(ev(s,2,130));s.up(ev(s,1,90));s.up(ev(s,2,130));assert.deepEqual(s.a.doc,before);assert.equal(s.a.history.undoStack.length,0);
 s.down(ev(s,3));s.move(ev(s,3,65));s.up(ev(s,3,65));assert.equal(s.a.history.undoStack.length,1);assert.equal(s.a.doc.layers[0].tracks.x.at(-1).time,2);
}));
test('pointer cancellation and third touches freeze multitouch until all contacts lift, with no late hold or undo',()=>clock(c=>{
 for(const kind of ['cancel','third']){const s=fixture();pair(s);if(kind==='cancel')s.cancel(ev(s,2,80));else s.down(ev(s,3,120));c.advance(1000);s.move(ev(s,1,65));s.move(ev(s,2,105));assert.deepEqual(s.view,{zoom:1,x:0,y:0});assert.equal(c.timers.size,0);if(kind==='cancel')s.down(ev(s,4,120));else s.up(ev(s,3,120));s.move(ev(s,1,90));assert.deepEqual(s.view,{zoom:1,x:0,y:0});s.up(ev(s,1,90));s.up(ev(s,2,105));if(kind==='cancel')s.up(ev(s,4,120));assert.equal(s.g,null);assert.equal(s.a.history.undoStack.length,0);assert.equal(s.a.history.redoStack.length,0);}
}));
test('pen artwork dragging ignores palm touches and never arms a two-finger hold',()=>clock(c=>{
 const s=fixture();s.down(ev(s,1,40,40,'pen'));s.down(ev(s,2,80));assert.equal(s.pointers.size,1);assert.equal(s.pairHoldTimer,undefined);s.move(ev(s,1,70,40,'pen'));s.up(ev(s,1,70,40,'pen'));c.advance(1000);assert.equal(s.a.history.undoStack.length,1);assert.equal(s.a.menus.length,0);
}));
test('release after the hold deadline cannot undo even when the hold timer has not run yet',()=>clock(c=>{
 const s=fixture();s.a.history.run('Earlier edit',()=>s.a.doc.layers[0].x=99);pair(s);c.elapse(310);s.up(ev(s,1));s.up(ev(s,2,80));assert.equal(s.a.doc.layers[0].x,99);assert.equal(s.a.history.undoStack.length,1);assert.equal(s.a.history.redoStack.length,0);c.advance(1000);assert.equal(s.g,null);
}));
test('small stationary touch jitter is rebased when hold arms, then even a small drag pans without zoom',()=>clock(c=>{
 const s=fixture();pair(s);s.move(ev(s,1,43,42));s.move(ev(s,2,83,42));assert.deepEqual(s.view,{zoom:1,x:0,y:0});c.advance(300);s.move(ev(s,1,47,44));s.move(ev(s,2,87,44));assert.deepEqual(s.view,{zoom:1,x:4,y:2});s.cancel(ev(s,1,47,44));s.up(ev(s,2,87,44));assert.equal(s.a.history.undoStack.length,0);
}));
