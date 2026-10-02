import {clone,uid,selectionRoots,isLocked} from '../document/model.js';
import {evaluated} from './evaluate.js';
import {layerBlocks,isolateBlock} from './blocks.js';

export const motionPresets=['bounce','ramp','fadeIn','fadeOut','fadeBoth'];
export const presetNames={bounce:'Bounce',ramp:'Ramp speed',fadeIn:'Fade in',fadeOut:'Fade out',fadeBoth:'Fade in / out'};
const directions={up:{prop:'y',sign:-1},down:{prop:'y',sign:1},left:{prop:'x',sign:-1},right:{prop:'x',sign:1}};
export function motionPresetPlan(p,ids,time,options={}){
 const type=options.type||'bounce',duration=options.duration??1,direction=options.direction||'up',distance=options.distance??100,ramp=options.ramp||'accelerate';
 if(!motionPresets.includes(type)||!Number.isFinite(time)||time<0||!Number.isFinite(duration)||duration<=0)throw Error('Choose a supported preset, start and duration.');
 if((type==='bounce'||type==='ramp')&&(!directions[direction]||!Number.isFinite(distance)||distance<1||distance>4096))throw Error('Choose a direction and a distance from 1 to 4096 pixels.');
 if(type==='ramp'&&!['accelerate','decelerate','both'].includes(ramp))throw Error('Choose a supported speed ramp.');
 const first=Math.round(time*p.fps),frames=Math.round(duration*p.fps),minimum=type==='bounce'?7:type==='fadeBoth'?4:2,start=first/p.fps,end=(first+frames)/p.fps,last=(first+frames-1)/p.fps;
 if(frames<minimum)throw Error(`${presetNames[type]} needs at least ${minimum} frames.`);if(end>600)throw Error('Presets must stay within the 10-minute composition limit.');
 const roots=selectionRoots(p,ids),targets=roots.filter(n=>!isLocked(p,n.id)&&!n.reference);if(!targets.length)throw Error('Select an unlocked artwork layer first.');
 const entries=targets.map(n=>{
  const selected=options.blockIds?.[n.id],block=selected?layerBlocks(n,p).find(b=>b.id===selected):n.blocks?.findLast(b=>b.kind==='animation'&&start>=b.start&&start<b.end);
  if(selected&&(!block||block.kind!=='animation'))throw Error('Choose an animation block for this preset.');
  if(block&&(start<block.start-.00001||end>block.end+.00001))throw Error(`${n.name}: the preset must fit inside its animation block. Shorten the duration or move the playhead.`);
  if(!block&&n.blocks?.some(b=>b.kind==='animation'&&b.start<end&&b.end>start))throw Error(`${n.name}: this range crosses an animation block. Apply inside that block or shorten the range.`);
  const prop=type==='bounce'||type==='ramp'?directions[direction].prop:'opacity',base=evaluated(n,start)[prop],level=base>0?base:1,span=frames-1,key=(fraction,value,easing='linear')=>({prop,time:(first+Math.round(fraction*span))/p.fps,value,easing});
  if(!block&&n.blockCuts?.some(c=>c.start<end&&c.end>start&&prop in c.values))throw Error(`${n.name}: this range contains held animation from a cut. Choose a retained animation block.`);
  let keys;if(type==='bounce'){const d=distance*directions[direction].sign;keys=[key(0,base,'easeOut'),key(.2,base+d,'easeIn'),key(.45,base,'easeOut'),key(.63,base+d*.42,'easeIn'),key(.78,base,'easeOut'),key(.89,base+d*.16,'easeIn'),key(1,base)];}
  else if(type==='ramp')keys=[key(0,base,({accelerate:'easeIn',decelerate:'easeOut',both:'easeInOut'})[ramp]),key(1,base+distance*directions[direction].sign)];
  else if(type==='fadeIn')keys=[key(0,0),key(1,level)];else if(type==='fadeOut')keys=[key(0,base),key(1,0)];else keys=[key(0,0),key(.25,level),key(.75,level),key(1,0)];
  let previous=-1;keys=keys.map((k,i)=>{const frame=Math.max(previous+1,Math.min(span-(keys.length-1-i),Math.round((k.time-start)*p.fps)));previous=frame;return {...k,time:(first+frame)/p.fps};});
  const original=block?.tracks?.[prop]||n.tracks[prop]||[],collisions=original.filter(k=>k.time>=start-.00001&&k.time<=last+.00001).length,preceding=Math.max(block?.start||0,(first-1)/p.fps),before=evaluated(n,preceding)[prop],initial=evaluated(n,block?.start||0)[prop];
  const prior=original.findLast(k=>k.time<preceding-.00001),following=original.find(k=>k.time>preceding+.00001),incomingAdjusted=!!(start>(block?.start||0)&&prior&&following&&(prior.bezier||prior.easing!=='hold'));
  return {object:n.id,name:n.name,prop,blockId:block?.id,start,end,last,keys,collisions,preceding,before,initial,incomingAdjusted};
 });
 return {type,start,end,frames,entries,collisions:entries.reduce((sum,e)=>sum+e.collisions,0),incomingAdjustments:entries.filter(e=>e.incomingAdjusted).length,skipped:roots.length-targets.length,extendsTo:Math.max(p.duration,end)};
}
export function applyMotionPreset(p,ids,time,options={}){
 // Validate every target before changing any layer, so mixed scopes fail atomically.
 const plan=motionPresetPlan(p,ids,time,options),keyIds=[];
 for(const entry of plan.entries){const n=selectionRoots(p,ids).find(n=>n.id===entry.object),block=entry.blockId?isolateBlock(n,p,entry.blockId):null,tracks=block?.tracks||n.tracks,original=tracks[entry.prop]||n.tracks[entry.prop]||[],next=clone(original.filter(k=>k.time<entry.start-.00001||k.time>entry.last+.00001));
  const put=definition=>{const k={...definition,id:uid()};delete k.prop;const index=next.findIndex(other=>Math.abs(other.time-k.time)<.00001);if(index<0)next.push(k);else next[index]=k;return k.id;};
  // A sparse hold guard prevents a new fade or movement from starting before the
  // playhead; existing out-of-range keys keep their values and identifiers.
  if(entry.start>(block?.start||0)+.00001){if(!next.some(k=>k.time<entry.start))put({time:block?.start||0,value:entry.initial,easing:'hold'});const existing=next.find(k=>Math.abs(k.time-entry.preceding)<.00001);if(existing){existing.easing='hold';delete existing.bezier;}else put({time:entry.preceding,value:entry.before,easing:'hold'});}
  for(const k of entry.keys)keyIds.push(put(k));next.sort((a,b)=>a.time-b.time);tracks[entry.prop]=next;if(block&&!block.props.includes(entry.prop))block.props.push(entry.prop);
 }
 p.duration=plan.extendsTo;return {...plan,keyIds};
}
