import {find} from '../document/model.js';
import {escape} from '../renderer/svg.js';
import {layerAnimationRange} from '../animation/layer-stretch.js';
import {layerMovePlan,moveLayerSequence} from '../animation/layer-move.js';
import {formatTime} from '../animation/timing.js';
export function showLayerMove(a,id=a.selected[0]){
 const n=find(a.doc,id);if(!n)return a.toast('Select an animated layer first.');a.pause();a.properties.flush();a.stage?.finishPath?.();
 let range,initial;try{range=layerAnimationRange(a.doc,id);if(!range)throw Error('This layer has no saved animation to move.');initial=range.start<0?1/a.doc.fps:range.start;layerMovePlan(a.doc,id,initial);}catch(e){return a.toast(e.message);}
 const fps=a.doc.fps,fmt=t=>Number(t.toFixed(5)),d=a.dialog('Move sequence · '+escape(n.name),`<p>Move all animation for this ${n.type==='group'?'group':'layer'} together. Current range: <strong>${fmt(range.start)}–${fmt(range.end)} seconds</strong>${a.timeline?.measurement==='bars'?' · '+formatTime(a.doc,range.start,'bars')+'–'+formatTime(a.doc,range.end,'bars'):''}. </p><form><div class="dialog-grid"><label>New start (seconds)<input name="start" data-move-seconds type="number" min="0" max="600" step="any" value="${initial}" required></label><label>New start (frames)<input data-move-frames type="number" min="0" max="${600*fps}" step="any" value="${initial*fps}" required></label></div><p data-move-preview role="status"></p><p class="subtle">Keeps the sequence length and easing. Other layers and audio stay in place. Moving a sequence does not hide its layer before the first keyframe. Reference pictures use their moved visibility window.</p><div class="dialog-actions"><button type="button" data-close>Cancel</button><button type="submit" class="primary" data-move-apply>Apply move</button></div></form>`,(form,dialog)=>{
  let plan;a.mutate('Move layer sequence',()=>{plan=moveLayerSequence(a.doc,id,Number(form.get('start')));});if(!plan)return;dialog.close();a.toast(plan.frames===0?'Sequence timing unchanged.':'Sequence moved '+plan.frames+' frames. Undo restores its timing.');
 },{modal:false});
 const seconds=d.querySelector('[data-move-seconds]'),frames=d.querySelector('[data-move-frames]'),status=d.querySelector('[data-move-preview]'),apply=d.querySelector('[data-move-apply]');
 const preview=()=>{try{const plan=layerMovePlan(a.doc,id,Number(seconds.value));status.textContent=`${fmt(plan.start)}–${fmt(plan.end)} seconds · ${plan.frames>=0?'+':''}${plan.frames} frames · ${plan.keys} keys on ${plan.layers} animated layer${plan.layers===1?'':'s'}${plan.extended?' · composition extends to '+fmt(plan.compositionDuration)+' seconds':''}`;apply.disabled=!seconds.checkValidity()||!frames.checkValidity();}catch(e){status.textContent=e.message;apply.disabled=true;}};
 seconds.oninput=()=>{frames.value=Number(seconds.value)*fps;preview();};frames.oninput=()=>{seconds.value=Number(frames.value)/fps;preview();};preview();return d;
}
