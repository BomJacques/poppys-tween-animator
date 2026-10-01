import {clone,walk,find,selectionRoots,isLocked,uid} from '../document/model.js';
import {evaluateTrack} from './evaluate.js';
export function copySequence(p,ids=[]){
 const roots=ids.length?selectionRoots(p,ids):p.layers,tracks=[],overrides=[];
 walk(roots,n=>{if(n.blocks||n.blockCuts)overrides.push({object:n.id,blocks:clone(n.blocks||[]),cuts:clone(n.blockCuts||[])});for(const [prop,keys] of Object.entries(n.tracks)){if(!keys.length)continue;const copy=clone(keys);if(copy[0].time>0)copy.unshift({id:uid(),time:0,value:clone(evaluateTrack(keys,0,n[prop])),easing:'hold'});if(copy.at(-1).time<p.duration)copy.push({id:uid(),time:p.duration,value:clone(evaluateTrack(keys,p.duration,n[prop])),easing:'hold'});tracks.push({object:n.id,prop,keys:copy});}});
 return {duration:p.duration,fps:p.fps,tracks,overrides};
}
export function pasteSequence(p,sequence,start){
 if(!sequence?.tracks.length)throw Error('Copy an animated sequence first.');if(!Number.isFinite(start)||start<0)throw Error('Choose a valid paste time.');
 const duration=start+sequence.duration;if(duration>600)throw Error('The pasted sequence would exceed 10 minutes.');
 const targets=sequence.tracks.map(t=>({t,n:find(p,t.object)})).filter(({n})=>n&&!isLocked(p,n.id));if(!targets.length)throw Error('The copied layers are missing or locked.');
 p.duration=Math.max(p.duration,Math.ceil(duration*p.fps)/p.fps);const added=[];
 for(const {t,n} of targets){const track=n.tracks[t.prop]||=[];
  const preceding=Math.max(0,Math.round(start*p.fps)/p.fps-1/p.fps),held=clone(evaluateTrack(track,preceding,n[t.prop]));
  if(start>0&&track.length&&track.at(-1).time<preceding)track.push({id:uid(),time:preceding,value:held,easing:'hold'});
  for(const source of t.keys){const time=Math.round((start+source.time)*p.fps)/p.fps,index=track.findIndex(k=>Math.abs(k.time-time)<.00001),key={...clone(source),id:uid(),time};if(index>=0)track[index]=key;else track.push(key);added.push(key.id);}track.sort((a,b)=>a.time-b.time);}
 for(const entry of sequence.overrides||[]){const n=find(p,entry.object);if(!n||isLocked(p,n.id))continue;n.blocks||=[];for(const original of entry.blocks){const b=clone(original);b.id=uid();b.start+=start;b.end+=start;for(const keys of Object.values(b.tracks||{}))for(const k of keys){k.id=uid();k.time+=start;}n.blocks.push(b);}n.blockCuts||=[];n.blockCuts.push(...entry.cuts.map(c=>({...clone(c),start:c.start+start,end:c.end+start})));}return added;
}
export function extendDuration(p,seconds){if(!Number.isFinite(seconds)||seconds<=0||p.duration+seconds>600)throw Error('Add a positive duration, up to a total of 600 seconds.');p.duration=Math.round((p.duration+seconds)*p.fps)/p.fps;return p.duration;}
