import {clone,find,walk,isLocked,locate} from '../document/model.js';

function timingEdges(n){
 const times=[];for(const track of Object.values(n.tracks||{}))for(const k of track)times.push(k.time);
 for(const b of n.blocks||[]){times.push(b.start,b.end);for(const track of Object.values(b.tracks||{}))for(const k of track)times.push(k.time);}
 for(const c of n.blockCuts||[])times.push(c.start,c.end);
 if(n.referenceFrames){const r=n.referenceFrames;times.push(r.start,r.start+r.duration);for(const range of r.visibleRanges||[])times.push(range.start,range.end);}
 return times.filter(Number.isFinite);
}
function targets(p,id){const n=find(p,id);if(!n)throw Error('Select a layer first.');const nodes=[];walk([n],child=>nodes.push(child));return nodes;}
export function layerAnimationRange(p,id){
 const nodes=targets(p,id),times=nodes.flatMap(timingEdges);if(!times.length)return null;
 const start=times.reduce((min,t)=>Math.min(min,t),Infinity),end=times.reduce((max,t)=>Math.max(max,t),-Infinity);return {start,end,duration:end-start,layers:nodes.filter(n=>timingEdges(n).length).length,keys:nodes.reduce((count,n)=>count+Object.values(n.tracks||{}).reduce((sum,t)=>sum+t.length,0)+(n.blocks||[]).reduce((sum,b)=>sum+Object.values(b.tracks||{}).reduce((total,t)=>total+t.length,0),0),0),references:nodes.filter(n=>n.referenceFrames).length};
}
function locked(p,n){const parent=locate(p,n.id)?.parent;return n.reference?!!parent&&isLocked(p,parent.id):isLocked(p,n.id);}
/** Preview an affine time map about the earliest animated time. No document writes. */
export function layerStretchPlan(p,id,factor){
 if(!Number.isFinite(factor)||factor<=0)throw Error('Choose a positive stretch percentage.');
 const range=layerAnimationRange(p,id);if(!range||range.duration<=0)throw Error('This layer needs animation at two different times to stretch.');
 const nodes=targets(p,id),root=nodes[0];if(locked(p,root)||nodes.some(n=>timingEdges(n).length&&locked(p,n)))throw Error('Unlock the layer and its animated contents before stretching.');
 const end=range.start+range.duration*factor;if(end>600)throw Error('The stretched animation would exceed 10 minutes.');
 if(range.duration*factor<1/p.fps-1e-8)throw Error('Keep an animation range of at least one composition frame.');
 const time=t=>factor===1?t:range.start+(t-range.start)*factor,updates=[];
 for(const n of nodes){if(!timingEdges(n).length)continue;const update={id:n.id};
  const tracks=source=>Object.fromEntries(Object.entries(source||{}).map(([prop,track])=>[prop,track.map(k=>({...clone(k),time:time(k.time)}))]));
  if(n.tracks)update.tracks=tracks(n.tracks);
  if(n.blocks)update.blocks=n.blocks.map(b=>({...clone(b),start:time(b.start),end:time(b.end),...(b.tracks?{tracks:tracks(b.tracks)}:{})}));
  if(n.blockCuts)update.blockCuts=n.blockCuts.map(c=>({...clone(c),start:time(c.start),end:time(c.end)}));
  if(n.referenceFrames){const r=clone(n.referenceFrames);r.start=time(r.start);r.duration*=factor;if(factor!==1||r.playbackRate!==undefined)r.playbackRate=(r.playbackRate??1)/factor;if(r.visibleRanges)r.visibleRanges=r.visibleRanges.map(b=>({...b,start:time(b.start),end:time(b.end)}));update.referenceFrames=r;}
  updates.push(update);
 }
 const duration=Math.max(p.duration,Math.min(600,Math.ceil(end*p.fps)/p.fps));
 return {...range,id,factor,end,duration:range.duration*factor,compositionDuration:duration,extended:duration>p.duration,updates};
}
export function stretchLayerAnimation(p,id,factor){
 const plan=layerStretchPlan(p,id,factor);for(const update of plan.updates){const n=find(p,update.id);const {id:_,...fields}=update;Object.assign(n,fields);}p.duration=plan.compositionDuration;return plan;
}
