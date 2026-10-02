import {find} from '../document/model.js';
import {layerBlocks} from '../animation/blocks.js';
import {audioClips} from '../audio/clips.js';

const epsilon=1e-7;
function entries(n,p){
 const out=Object.entries(n.tracks||{}).map(([prop,track])=>({n,prop,track,scope:'base'}));
 for(const b of layerBlocks(n,p))for(const [prop,track] of Object.entries(b.tracks||{}))out.push({n,prop,track,scope:b.id,block:b});
 return out;
}
function owned(entry,time){
 const {n,prop,scope,block}=entry;
 if(block&&(time<block.start-epsilon||time>block.end+epsilon))return false;
 // Block end keys are editable endpoints, although playback uses a half-open range.
 let owner='base';for(const b of n.blocks||[])if(time>=b.start&&time<b.end&&b.tracks?.[prop]?.length)owner=b.id;
 if(block&&Math.abs(time-block.end)<epsilon&&owner==='base')return true;
 if(scope!==owner)return false;
 return scope!=='base'||!(n.blockCuts||[]).some(c=>time>=c.start&&time<c.end&&Object.hasOwn(c.values||{},prop));
}
/** Read-only candidates. Selected key IDs identify tracks, not just individual keys. */
export function navigationKeys(p,{selected=[],keyIds=new Set(),blockSelection=null}={}){
 const all=[];const visit=(nodes,included=false)=>{for(const n of nodes){if(n.reference||n.referenceFrames)continue;const chosen=included||selected.includes(n.id);for(const entry of entries(n,p))all.push({...entry,chosen});visit(n.children||[],chosen);}};visit(p.layers);
 const explicit=all.filter(e=>e.track.some(k=>keyIds.has(k.id))),sources=explicit.length?explicit:all.filter(e=>e.chosen);
 const block=explicit.length?null:blockSelection;
 const selectedBlock=block&&block.object!=='audio'?layerBlocks(find(p,block.object)||{tracks:{}},p).find(b=>b.id===block.id):null;
 const blockScope=selectedBlock?(selectedBlock.tracks?block.id:'base'):null;
 const result=[];for(const e of sources){if(blockScope&&(block.object!==e.n.id||e.scope!==blockScope))continue;for(const k of e.track){if(!Number.isFinite(k.time)||k.time<0||k.time>p.duration)continue;
   // Explicitly selected tracks and blocks retain their own endpoints/keys, never borrow another block's track.
   const explicitScope=explicit.length||block?.object===e.n.id;
   if(e.block&&(k.time<e.block.start-epsilon||k.time>e.block.end+epsilon))continue;
   if(selectedBlock&&(k.time<selectedBlock.start-epsilon||k.time>selectedBlock.end+epsilon))continue;
   if(!explicitScope&&!owned(e,k.time))continue;
   result.push({time:k.time,id:k.id,object:e.n.id,property:e.prop,scope:e.scope});
 }}return result.sort((a,b)=>a.time-b.time);
}
export function adjacentKeyTime(p,state,time,direction){
 const times=navigationKeys(p,state).map(k=>k.time);
 return direction<0?times.findLast(t=>t<time-epsilon)??null:times.find(t=>t>time+epsilon)??null;
}
export function selectedBlockRange(p,selection){
 if(!selection)return null;let start,end;
 if(selection.object==='audio'){const c=audioClips(p.audio).find(c=>c.id===selection.id);if(c){start=c.offset;end=c.offset+c.trimEnd-c.trimStart;}}
 else{const n=find(p,selection.object),b=n&&layerBlocks(n,p).find(b=>b.id===selection.id);if(b){start=b.start;end=b.end;}}
 if(!Number.isFinite(start)||!Number.isFinite(end))return null;start=Math.max(0,start);end=Math.min(p.duration,end);return end>start?{start,end}:null;
}
/** A view change only. Uses the timeline's actual lane width, including narrow layouts. */
export function timelineViewPlan({duration,viewportWidth,labelWidth=244,baseWidth,start=0,end=duration}){
 if(!Number.isFinite(duration)||duration<=0||!Number.isFinite(viewportWidth)||viewportWidth<=0)return null;
 const available=Math.max(1,viewportWidth-labelWidth),usable=Math.max(1,available-24),span=Math.max(1e-6,end-start),base=baseWidth||Math.max(500,available);
 const zoom=Math.max(.001,Math.min(8,usable*duration/(span*base))),width=base*zoom;
 const center=(Math.max(0,start)+Math.min(duration,end))/2;
 return {zoom,scrollLeft:Math.max(0,Math.min(Math.max(0,labelWidth+width-viewportWidth),center/duration*width-available/2))};
}
export function nextPosePlan(p,time,seconds=1){
 const fps=p.fps,limit=Math.floor(600*fps)/fps,target=Math.min(limit,Math.max(0,Math.round((time+seconds)*fps)/fps));
 return {time:target,duration:Math.max(p.duration,target),extended:target>p.duration};
}
export function stepTimelineKey(a,direction){
 const target=adjacentKeyTime(a.doc,{selected:a.selected,keyIds:a.keyIds,blockSelection:a.timeline.blockSelection},a.time,direction);
 if(target===null){a.toast?.(a.selected.length||a.keyIds?.size?'No '+(direction<0?'earlier':'later')+' key in the selected tracks.':'Select an animated layer or track first.');return null;}
 a.seek(target);revealTimelineTime(a,target);return target;
}
function revealTimelineTime(a,time){const t=a.timeline,label=t.el?.querySelector('.layer-label')?.offsetWidth||244,available=t.scroll.clientWidth-label,x=t.px(time),left=t.scroll.scrollLeft;if(x<left+12||x>left+available-12)t.scroll.scrollLeft=Math.max(0,x-available/2);}
export function revealTimelineRow(a,object){
 const t=a.timeline;if(!t.scroll.getBoundingClientRect||!t.el?.querySelectorAll)return;
 const row=object==='audio'?t.el.querySelector('.audio-row'):[...t.el.querySelectorAll('[data-layer]')].find(row=>row.dataset.layer===object&&!row.classList.contains('property-row'));if(!row)return;
 const viewport=t.scroll.getBoundingClientRect(),rect=row.getBoundingClientRect(),ruler=t.el.querySelector('.ruler'),audio=object!=='audio'?t.el.querySelector('.audio-row.has-audio'):null;
 const top=viewport.top+(ruler?.offsetHeight||44),bottom=viewport.bottom-(audio?.offsetHeight||0);
 // Avoid native scrollIntoView centering a 44px label underneath the sticky ruler.
 if(bottom-top<rect.height)return;
 if(rect.top<top)t.scroll.scrollTop=Math.max(0,t.scroll.scrollTop+rect.top-top);
 else if(rect.bottom>bottom)t.scroll.scrollTop+=rect.bottom-bottom;
}
export function frameTimelineRange(a,focus=false){
 const t=a.timeline,range=focus?selectedBlockRange(a.doc,t.blockSelection):{start:0,end:a.doc.duration};if(!range){a.toast?.('Select an animation or audio block to focus.');return false;}
 const label=t.el?.querySelector('.layer-label')?.offsetWidth||244,plan=timelineViewPlan({duration:a.doc.duration,viewportWidth:t.scroll.clientWidth,labelWidth:label,baseWidth:t.width()/t.zoom,...range});if(!plan)return false;
 t.zoom=plan.zoom;t.render();t.scroll.scrollLeft=plan.scrollLeft;if(focus)revealTimelineRow(a,t.blockSelection.object);return true;
}
export function advanceNextPose(a,seconds=1){
 a.properties?.flush?.();const plan=nextPosePlan(a.doc,a.time,seconds);if(plan.time<=a.time){a.toast?.('Composition limit: 10 minutes.');return plan;}
 if(plan.extended)a.mutate('Extend for next pose',()=>{a.doc.duration=plan.duration;});
 a.seek(plan.time);revealTimelineTime(a,plan.time);
 a.toast?.(a.autoKey?'Next pose: edit artwork to record at this time.':'Next pose: Auto Key is off. Enable it or add a keyframe before editing a new property.');return plan;
}
/** Call once after Timeline construction. Existing controls stay in their own toolbar. */
export function bindTimelineNavigation(a){
 if(document.getElementById('timeline-navigation'))return;
 const toolbar=document.querySelector('.timeline-toolbar');if(!toolbar)return;
 const group=document.createElement('div');group.id='timeline-navigation';group.className='timeline-navigation';group.setAttribute('role','group');group.setAttribute('aria-label','Keyframe navigation');
 group.innerHTML='<button id="previous-key" aria-label="Previous keyframe" title="Previous key in selected layers or tracks">‹◇</button><button id="next-key" aria-label="Next keyframe" title="Next key in selected layers or tracks">◇›</button><button id="next-pose" title="Advance one second; edit artwork for the next pose">Next pose +1s</button>';
 toolbar.insertBefore(group,document.getElementById('key-options')?.nextSibling||null);
 const fit=document.createElement('button');fit.id='timeline-fit';fit.textContent='Fit';fit.title='Fit whole sequence';fit.setAttribute('aria-label','Fit whole sequence');toolbar.insertBefore(fit,document.getElementById('timeline-minus'));
 const focus=document.createElement('button');focus.id='timeline-focus';focus.textContent='Focus block';focus.title='Focus selected animation or audio block';focus.className='timeline-focus-source';toolbar.append(focus);
 const bind=(id,fn)=>document.getElementById(id).addEventListener('click',()=>a.safe?a.safe(fn):fn());
 bind('previous-key',()=>stepTimelineKey(a,-1));bind('next-key',()=>stepTimelineKey(a,1));bind('next-pose',()=>advanceNextPose(a));bind('timeline-fit',()=>frameTimelineRange(a));bind('timeline-focus',()=>frameTimelineRange(a,true));
}
