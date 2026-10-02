import test from 'node:test';import assert from 'node:assert/strict';
import {project,object,History,clone} from '../dist/document/model.js';
import {evaluated,putKey} from '../dist/animation/evaluate.js';
import {motionPresetPlan,applyMotionPreset} from '../dist/animation/presets.js';
import {timing,setLoop,setTempo,normalizeTiming,loopRange,toSeconds,fromSeconds} from '../dist/animation/timing.js';
import {validate} from '../dist/document/validate.js';
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);
function scene(){const p=project(),n=object('ellipse',{x:100,y:200});p.layers=[n];return {p,n};}

test('tempo and measurement persist without retiming keys, audio or loop seconds',()=>{
 const {p,n}=scene();putKey(n,'x',0,100);putKey(n,'x',2,300);p.audio={assetId:globalThis.crypto.randomUUID(),name:'Voice',duration:3,trimStart:0,trimEnd:3,offset:1,volume:1,muted:false};setLoop(p,1,3,'seconds',120,4);const keys=clone(n.tracks),audio=clone(p.audio),range=loopRange(p);setTempo(p,90,3,'bars');assert.deepEqual(n.tracks,keys);assert.deepEqual(p.audio,audio);near(p.playback.start,range.start);near(p.playback.end,range.end);near(toSeconds(p,1,'bars'),2);near(fromSeconds(p,2,'bars'),1);assert.equal(p.duration,6);const restored=validate(JSON.parse(JSON.stringify(p)));assert.equal(restored.playback.measurement,'bars');assert.equal(restored.playback.bpm,90);normalizeTiming(p);assert.equal(p.playback.measurement,'bars');setLoop(p,0,2,'seconds',100,3);assert.equal(p.playback.measurement,'bars');
 const invalid=clone(p);invalid.playback.measurement='minutes';assert.throws(()=>validate(invalid));const older=clone(p);delete older.playback.measurement;validate(older);
});
test('tempo edits are reversible and invalid settings leave the project intact',()=>{
 let p=project();const history=new History(()=>p,value=>p=value);history.run('Tempo',()=>setTempo(p,140,5,'frames'));assert.equal(history.undoStack.length,1);history.undo();assert.equal(p.playback,undefined);history.redo();assert.equal(p.playback.bpm,140);assert.equal(p.playback.measurement,'frames');for(const values of [[0,4,'bars'],[120,1.5,'seconds'],[120,4,'minutes']]){const before=clone(p);assert.throws(()=>setTempo(p,...values));assert.deepEqual(p,before);}
});
test('tempo updates also retain imported fractional loop times exactly',()=>{const p=project();p.playback={start:.13,end:2.17,bpm:120,beatsPerBar:4};setTempo(p,95,3,'bars');assert.equal(p.playback.start,.13);assert.equal(p.playback.end,2.17);});
test('bounce rebounds diminish, return to the starting position and keep other tracks',()=>{
 const {p,n}=scene();putKey(n,'rotation',0,20);putKey(n,'rotation',2,80);const rotation=clone(n.tracks.rotation),result=applyMotionPreset(p,[n.id],0,{type:'bounce',duration:1,distance:100,direction:'up'}),keys=n.tracks.y;assert.equal(keys.length,7);assert.equal(result.frames,24);near(evaluated(n,keys[0].time).y,200);near(evaluated(n,keys.at(-1).time).y,200);const heights=[1,3,5].map(i=>200-evaluated(n,keys[i].time).y);assert.ok(heights[0]>heights[1]&&heights[1]>heights[2]&&heights[2]>0);assert.deepEqual(n.tracks.rotation,rotation);assert.equal(p.duration,6);
});
test('speed ramps have the requested acceleration and direction',()=>{
 for(const ramp of ['accelerate','decelerate','both']){const {p,n}=scene();applyMotionPreset(p,[n.id],0,{type:'ramp',duration:2,distance:100,direction:'right',ramp});const span=2-1/p.fps,early=evaluated(n,span*.25).x-100,late=200-evaluated(n,span*.75).x;if(ramp==='accelerate')assert.ok(early<late);if(ramp==='decelerate')assert.ok(early>late);if(ramp==='both')near(early,late);near(evaluated(n,span).x,200);assert.equal(n.tracks.x.length,2);}
});
test('fade endpoints occur on the last rendered frame and double fade has a middle hold',()=>{
 for(const type of ['fadeIn','fadeOut','fadeBoth']){const {p,n}=scene();n.opacity=.6;const result=applyMotionPreset(p,[n.id],0,{type,duration:1});near(evaluated(n,result.end-1/p.fps).opacity,type==='fadeIn'?.6:0);if(type!=='fadeOut')near(evaluated(n,0).opacity,0);else near(evaluated(n,0).opacity,.6);if(type==='fadeBoth'){near(evaluated(n,.45).opacity,.6);near(evaluated(n,.55).opacity,.6);}}
});
test('later presets preserve the preceding static pose and report affected-key collisions',()=>{
 const {p,n}=scene();putKey(n,'y',2.25,300);putKey(n,'y',5,400);const later=clone(n.tracks.y.at(-1));const plan=motionPresetPlan(p,[n.id],2,{type:'ramp',duration:1,direction:'down',distance:100});assert.equal(plan.collisions,1);applyMotionPreset(p,[n.id],2,{type:'ramp',duration:1,direction:'down',distance:100});assert.deepEqual(n.tracks.y.find(k=>k.id===later.id),later);assert.ok(!n.tracks.y.some(k=>k.time===2.25));
 const second=scene();applyMotionPreset(second.p,[second.n.id],2,{type:'fadeIn',duration:1});near(evaluated(second.n,0).opacity,1);near(evaluated(second.n,2-1/24).opacity,1);near(evaluated(second.n,2).opacity,0);
});
test('active block presets keep outside animation and unrelated parameter overrides exact',()=>{
 const {p,n}=scene();putKey(n,'x',0,0);putKey(n,'x',6,600,'linear');putKey(n,'rotation',0,0);putKey(n,'rotation',6,90,'linear');n.blocks=[{id:globalThis.crypto.randomUUID(),name:'Middle',kind:'animation',start:1,end:3,props:['x','rotation']}];const outside=[0,.5,3,4,5].map(t=>evaluated(n,t)),base=clone(n.tracks),result=applyMotionPreset(p,[n.id],1.5,{type:'ramp',duration:1,direction:'right',distance:80});assert.deepEqual(n.tracks,base);assert.equal(result.entries[0].blockId,n.blocks[0].id);for(const [i,t] of [0,.5,3,4,5].entries()){near(evaluated(n,t).x,outside[i].x);near(evaluated(n,t).rotation,outside[i].rotation);}assert.deepEqual(n.blocks[0].tracks.rotation,base.rotation.map((k,i)=>({...k,id:n.blocks[0].tracks.rotation[i].id})));validate(p);
});
test('scope errors and short durations fail atomically; minimum bounce still has distinct frames',()=>{
 const {p,n}=scene(),other=object('rectangle');p.layers.push(other);other.blocks=[{id:globalThis.crypto.randomUUID(),name:'Short',kind:'animation',start:1,end:1.5,props:[]}];const before=clone(p);assert.throws(()=>applyMotionPreset(p,[n.id,other.id],1,{type:'fadeOut',duration:1}),/fit inside/);assert.deepEqual(p,before);assert.throws(()=>applyMotionPreset(p,[n.id],0,{type:'bounce',duration:1/24}),/7 frames/);assert.deepEqual(p,before);applyMotionPreset(p,[n.id],0,{type:'bounce',duration:7/24});assert.equal(new Set(n.tracks.y.map(k=>k.time)).size,7);
});
test('multiple selected layers extend duration with one undo operation and skip locked references',()=>{
 let {p,n}=scene();const second=object('rectangle'),locked=object('ellipse',{locked:true}),reference=object('image',{reference:true});p.layers.push(second,locked,reference);const ids=p.layers.map(n=>n.id),before=clone(p),history=new History(()=>p,value=>p=value);let result;history.run('Preset',()=>result=applyMotionPreset(p,ids,5,{type:'fadeOut',duration:2}));assert.equal(result.entries.length,2);assert.equal(result.skipped,2);assert.equal(p.duration,7);assert.equal(history.undoStack.length,1);assert.deepEqual(locked.tracks,{});history.undo();assert.deepEqual(p,before);history.redo();assert.equal(p.duration,7);assert.equal(p.layers[0].tracks.opacity.at(-1).value,0);
});
test('an existing incoming eased segment is explicitly flagged rather than claimed unchanged',()=>{
 const {p,n}=scene();putKey(n,'x',0,0,'easeOut');putKey(n,'x',2,200);putKey(n,'y',0,20,'easeIn');putKey(n,'y',2,100);const originalX=evaluated(n,.5).x,originalY=evaluated(n,.5).y,plan=motionPresetPlan(p,[n.id],1,{type:'ramp',duration:1,direction:'right',distance:100});assert.equal(plan.incomingAdjustments,1);applyMotionPreset(p,[n.id],1,{type:'ramp',duration:1,direction:'right',distance:100});assert.ok(Math.abs(evaluated(n,.5).x-originalX)>.01);near(evaluated(n,.5).y,originalY);near(evaluated(n,1-1/24).x,200*(1-(1-(1-1/24)/2)**2));
});
