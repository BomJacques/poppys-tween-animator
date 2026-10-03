import test from 'node:test';import assert from 'node:assert/strict';
import {createRubberHose,rubberHoseGeometry,rubberHoseRig,solveRubberHose,updateRubberHose} from '../dist/scene/rubberhose.js';
import {configureAutoKey,evaluated} from '../dist/animation/evaluate.js';
import {project,History,clone} from '../dist/document/model.js';
import {validate} from '../dist/document/validate.js';
import {applyRubberHoseControl,rubberHoseControls} from '../dist/ui/rubberhose-rig.js';
import {editorControls,editorAction} from '../dist/ui/editor.js';
import {propertyPanels} from '../dist/ui/properties.js';
import {sceneSVG} from '../dist/renderer/svg.js';
const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);
function app(n=createRubberHose(),auto=true){const a={doc:project(),time:2,autoKey:auto,ease:'linear',pause(){},render(){},properties:{flush(){}}};a.doc.layers=[n];configureAutoKey(a.doc,auto,'linear');a.history=new History(()=>a.doc,p=>{a.doc=p;configureAutoKey(p,auto,'linear');});return a;}
test('new limbs use IK while existing rubberhose paths retain independent point editing',()=>{
 const n=createRubberHose(),r=rubberHoseRig(n);assert.equal(r.enabled,true);assert.equal(r.stretch,false);delete n.rubberhoseRig;updateRubberHose(n,{bend:{x:35,y:120}});assert.deepEqual(rubberHoseGeometry(n).bend,{x:35,y:120});assert.equal(rubberHoseRig(n).enabled,false);updateRubberHose(n,{ik:true});assert.equal(rubberHoseRig(n).enabled,true);
});
test('endpoint posing preserves both lengths and bend side, including rotated roots and asymmetric segments',()=>{
 for(const direction of [-1,1])for(const end of [{x:150,y:80},{x:-80,y:100},{x:0,y:0}]){const g=solveRubberHose({start:{x:25,y:30},end,length1:110,length2:70,direction});near(distance(g.start,g.bend),110);near(distance(g.bend,g.end),70);assert.ok(Number.isFinite(g.bend.x)&&Number.isFinite(g.bend.y));const cross=(g.end.x-g.start.x)*(g.bend.y-g.start.y)-(g.end.y-g.start.y)*(g.bend.x-g.start.x);assert.ok(direction*cross>=-1e-7);}
});
test('far and near unreachable targets clamp safely; equal coincident endpoints fold without NaNs',()=>{
 const far=solveRubberHose({start:{x:0,y:0},end:{x:500,y:0},length1:100,length2:60});assert.equal(far.clamped,true);near(far.end.x,160);near(far.bend.x,100);
 const nearTarget=solveRubberHose({start:{x:0,y:0},end:{x:1,y:0},length1:100,length2:60});near(nearTarget.end.x,40);near(distance(nearTarget.bend,nearTarget.end),60);
 const folded=solveRubberHose({start:{x:0,y:0},end:{x:0,y:0},length1:100,length2:100,fallback:{x:0,y:0}});near(distance(folded.start,folded.bend),100);near(distance(folded.bend,folded.end),100);assert.deepEqual(folded.end,{x:0,y:0});
 for(const bad of [0,-1,NaN,Infinity])assert.throws(()=>solveRubberHose({start:{x:0,y:0},end:{x:10,y:0},length1:bad,length2:10}));assert.throws(()=>solveRubberHose({start:{x:0,y:0},end:{x:1e308,y:0},length1:10,length2:10}));
});
test('stretch reaches a distant target proportionally and original gesture nodes restore rest lengths on return',()=>{
 const n=createRubberHose({stretch:true}),a=app(n),source=clone(n.nodes),r=rubberHoseRig(n);updateRubberHose(n,{end:{x:500,y:0}},2,source);const stretched=rubberHoseRig(n,2);near(distance(stretched.start,stretched.bend)+distance(stretched.bend,stretched.end),500);near(distance(stretched.start,stretched.bend)/distance(stretched.bend,stretched.end),r.length1/r.length2);near(stretched.length1,r.length1);near(stretched.length2,r.length2);updateRubberHose(n,{end:{x:120,y:20}},2,source);const returned=rubberHoseRig(n,2);near(returned.length1,r.length1);near(returned.length2,r.length2);assert.deepEqual(rubberHoseGeometry(n,0).end,{x:180,y:0});
});
test('direction flip changes the joint without moving endpoints or altering segment lengths',()=>{
 const n=createRubberHose(),a=app(n),before=rubberHoseRig(n);updateRubberHose(n,{direction:-1},2);const after=rubberHoseRig(n,2);near(after.bend.x,before.bend.x);near(after.bend.y,-before.bend.y);assert.deepEqual(after.start,before.start);assert.deepEqual(after.end,before.end);near(after.length1,before.length1);updateRubberHose(n,{bend:{x:90,y:100}},2);assert.equal(rubberHoseRig(n,2).direction,1);
});
test('length and bend controls key the current pose even with Auto Key off; seeking, save/reload and undo preserve earlier geometry',()=>{
 const n=createRubberHose(),a=app(n,false),before=clone(n.nodes);assert.match(rubberHoseControls(n,2),/Upper length \(px\)/);assert.match(rubberHoseControls(n,2),/data-hose="direction"/);applyRubberHoseControl(a,n,'length1',140);assert.deepEqual(evaluated(n,0).nodes,before);near(rubberHoseRig(n,2).length1,140);assert.deepEqual(n.tracks.nodes.map(k=>k.time),[0,2]);const at2=clone(evaluated(n,2).nodes),saved=validate(JSON.parse(JSON.stringify(a.doc)));assert.deepEqual(evaluated(saved.layers[0],2).nodes,at2);assert.deepEqual(evaluated(saved.layers[0],0).nodes,before);a.history.undo();assert.deepEqual(a.doc.layers[0].nodes,before);assert.equal(a.doc.layers[0].tracks.nodes,undefined);
});
test('invalid length control is atomic and preserves document and history',()=>{
 const n=createRubberHose(),a=app(n),before=clone(a.doc);assert.throws(()=>applyRubberHoseControl(a,n,'length1',-5));assert.deepEqual(a.doc,before);assert.equal(a.history.undoStack.length,0);assert.equal(a.history.before,null);
});
test('straight and stretched keyed poses retain rest lengths and chosen bend side for subsequent independent drags',()=>{
 const n=createRubberHose({stretch:true}),a=app(n),r=rubberHoseRig(n);updateRubberHose(n,{direction:-1,end:{x:500,y:0}},2);assert.equal(rubberHoseRig(n,2).direction,-1);near(rubberHoseRig(n,2).length1,r.length1);a.time=3;updateRubberHose(n,{end:{x:100,y:0}},3);const returned=rubberHoseRig(n,3);near(distance(returned.start,returned.bend),r.length1);near(distance(returned.bend,returned.end),r.length2);assert.ok(returned.bend.y<0);const saved=validate(JSON.parse(JSON.stringify(a.doc)));assert.equal(rubberHoseRig(saved.layers[0],2).direction,-1);assert.deepEqual(rubberHoseGeometry(saved.layers[0],0).bend,{x:90,y:60});
});
test('rig settings and keyed rest lengths reject corrupt projects while valid legacy and IK projects reload',()=>{
 const a=app();validate(clone(a.doc));for(const patch of [{enabled:'yes',stretch:false},{enabled:true,stretch:1},null]){const p=clone(a.doc);p.layers[0].rubberhoseRig=patch;assert.throws(()=>validate(p));}for(const value of [-1,Infinity,'100']){const p=clone(a.doc);p.layers[0].nodes[1].ikLength1=value;assert.throws(()=>validate(p));}const p=clone(a.doc);p.layers[0].nodes[1].ikDirection=0;assert.throws(()=>validate(p));delete p.layers[0].rubberhoseRig;delete p.layers[0].nodes[1].ikDirection;validate(p);
});
test('start and end gesture moves always solve from original points: overreach and return equal a single final solve',()=>{
 for(const key of ['start','end'])for(const stretch of [false,true]){
  const n=createRubberHose({stretch}),single=createRubberHose({stretch}),a=app(n),b=app(single),source=clone(n.nodes),singleSource=clone(single.nodes),final={x:55,y:35};
  for(const target of [{x:500,y:300},{x:-350,y:-150},{x:180,y:0},final])updateRubberHose(n,{[key]:target},2,source);
  updateRubberHose(single,{[key]:final},2,singleSource);assert.deepEqual(evaluated(n,2).nodes,evaluated(single,2).nodes,`${key}, stretch ${stretch}`);
  const opposite=key==='start'?'end':'start';assert.deepEqual(rubberHoseGeometry(n,2)[opposite],rubberHoseGeometry(single,2)[opposite]);assert.deepEqual(evaluated(n,0).nodes,source);
 }
});
test('coincident endpoint gestures with equal or unequal lengths preserve finite solutions and original opposite point',()=>{
 for(const lengths of [[100,100],[100,60]]){const n=createRubberHose(),a=app(n);updateRubberHose(n,{length1:lengths[0],length2:lengths[1]},2);const source=clone(evaluated(n,2).nodes),end={x:source[2].x,y:source[2].y};updateRubberHose(n,{start:end},2,source);const g=rubberHoseGeometry(n,2);near(distance(g.start,g.bend),lengths[0]);near(distance(g.bend,g.end),lengths[1]);for(const p of [g.start,g.bend,g.end])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));updateRubberHose(n,{start:{x:source[0].x,y:source[0].y}},2,source);assert.deepEqual(rubberHoseGeometry(n,2).end,end);}
});
test('IK inspector exposes rig controls and conversion, hides generic topology and refuses stale destructive commands',()=>{
 const n=createRubberHose(),a=app(n),before=clone(a.doc);Object.assign(a,{selected:[n.id],activeNode:1,toast(){},mutate:(label,fn)=>a.history.run(label,fn)});
 const controls=editorControls(a,n),shape=propertyPanels(a,n).shape;assert.match(controls,/Convert to free path/);assert.match(shape,/Limb rig/);assert.doesNotMatch(controls,/Add midpoint|Delete point|Convert to curve|Selected point bevel/);assert.doesNotMatch(shape,/id="close-path"/);
 for(const action of ['split','curve','smooth','corner','delete-point','toggle-close','reverse'])editorAction(a,action);assert.deepEqual(a.doc,before);assert.equal(a.history.undoStack.length,0);
});
test('explicit free-path conversion preserves rendered appearance and all poses, then adding a fourth point renders safely',()=>{
 const n=createRubberHose(),a=app(n);updateRubberHose(n,{end:{x:100,y:40}},2);Object.assign(a,{selected:[n.id],activeNode:1,toast(){},mutate:(label,fn)=>a.history.run(label,fn)});const zero=sceneSVG(a.doc,0),current=sceneSVG(a.doc,2);
 editorAction(a,'detach-hose');assert.equal(n.rubberhose,undefined);assert.equal(n.rubberhoseRig,undefined);assert.equal(sceneSVG(a.doc,0),zero);assert.equal(sceneSVG(a.doc,2),current);assert.ok(n.tracks.nodes.every(k=>k.value.every(p=>p.ikLength1===undefined&&p.ikDirection===undefined)));
 a.activeNode=1;editorAction(a,'split');assert.equal(evaluated(n,2).nodes.length,4);assert.doesNotThrow(()=>propertyPanels(a,n));assert.equal(rubberHoseControls(n,2),'');validate(clone(a.doc));
});
test('free-curve midpoint insertion detaches the hose in the same undo transaction and cannot crash the next properties render',()=>{
 const n=createRubberHose({ik:false}),a=app(n);Object.assign(a,{selected:[n.id],activeNode:1,toast(){},mutate:(label,fn)=>a.history.run(label,fn),render(){propertyPanels(a,n);}});editorAction(a,'split');assert.equal(evaluated(n,2).nodes.length,4);assert.equal(n.rubberhose,undefined);assert.equal(n.rubberhoseRig,undefined);assert.doesNotThrow(()=>a.render());assert.equal(a.history.undoStack.length,1);a.history.undo();assert.equal(a.doc.layers[0].rubberhose,true);assert.equal(a.doc.layers[0].nodes.length,3);
});
