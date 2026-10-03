import {clone,find,walk,isLocked,locate} from '../document/model.js';
import {validate} from '../document/validate.js';
import {layerAnimationRange} from './layer-stretch.js';
function timing(n){return Object.values(n.tracks||{}).some(t=>t.length)||(n.blocks||[]).length||(n.blockCuts||[]).length||!!n.referenceFrames;}
function locked(p,n){const parent=locate(p,n.id)?.parent;return n.reference?!!parent&&isLocked(p,parent.id):isLocked(p,n.id);}
/** Shift every saved animation time by one integer number of composition frames. */
export function layerMovePlan(p,id,newStart){
 if(!Number.isFinite(newStart)||newStart<0||newStart>600)throw Error('Choose a new sequence start from 0 to 600 seconds.');
 const root=find(p,id);if(!root)throw Error('Select an animated layer first.');
 // Validation sorts only this detached copy. Malformed keys/ranges cannot cause a partial move.
 validate({...p,layers:[clone(root)],audio:null});
 const nodes=[];walk([root],n=>nodes.push(n));const range=layerAnimationRange(p,id);if(!range)throw Error('This layer has no saved animation to move.');
 if(locked(p,root)||nodes.some(n=>timing(n)&&locked(p,n)))throw Error('Unlock the layer and its animated contents before moving its sequence.');
 const frames=Math.round((newStart-range.start)*p.fps),offset=frames/p.fps,time=t=>frames===0?t:t+offset,start=time(range.start),end=time(range.end);
 if(start<0)throw Error('That frame offset places saved animation before zero. Choose a later start; subframe offsets are preserved.');
 if(end>600)throw Error('The moved sequence would exceed 10 minutes. Choose an earlier start.');
 const updates=[];if(frames!==0)for(const n of nodes){if(!timing(n))continue;const update={id:n.id},tracks=source=>Object.fromEntries(Object.entries(source||{}).map(([prop,keys])=>[prop,keys.map(k=>({...clone(k),time:time(k.time)}))]));
  if(n.tracks)update.tracks=tracks(n.tracks);
  if(n.blocks)update.blocks=n.blocks.map(b=>({...clone(b),start:time(b.start),end:time(b.end),...(b.tracks?{tracks:tracks(b.tracks)}:{})}));
  if(n.blockCuts)update.blockCuts=n.blockCuts.map(c=>({...clone(c),start:time(c.start),end:time(c.end)}));
  if(n.referenceFrames){const r=clone(n.referenceFrames);r.start=time(r.start);if(r.visibleRanges)r.visibleRanges=r.visibleRanges.map(b=>({...b,start:time(b.start),end:time(b.end)}));update.referenceFrames=r;}
  updates.push(update);
 }
 const compositionDuration=frames===0?p.duration:Math.max(p.duration,Math.min(600,Math.ceil(end*p.fps)/p.fps));
 return {...range,id,originalStart:range.start,originalEnd:range.end,start,end,offset,frames,newStart,compositionDuration,extended:compositionDuration>p.duration,updates};
}
export function canMoveLayerSequence(p,id){try{const range=layerAnimationRange(p,id);if(!range)return false;layerMovePlan(p,id,range.start<0?1/p.fps:range.start);return true;}catch{return false;}}
export function moveLayerSequence(p,id,newStart){const plan=layerMovePlan(p,id,newStart);for(const update of plan.updates){const n=find(p,update.id),{id:_,...fields}=update;Object.assign(n,fields);}p.duration=plan.compositionDuration;return plan;}
