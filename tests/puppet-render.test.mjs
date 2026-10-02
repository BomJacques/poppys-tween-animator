import test from 'node:test';
import assert from 'node:assert/strict';
import {puppetSVG,puppetViews,pose,motions} from '../dist/reference/puppet.js';
import {showPuppet} from '../dist/ui/puppet.js';

const parts=svg=>[...svg.matchAll(/data-puppet-part="([^"]+)" data-depth="([^"]+)"/g)].map(m=>({name:m[1],depth:Number(m[2])}));

test('all mannequin primitives, including joint circles, follow painter depth order in every view',()=>{
 for(const motion of motions)for(const rotation of [0,45,90,180,270])for(const phase of [0,.16,.31,.74]){
  const svg=puppetSVG(motion,phase,rotation,false),list=parts(svg);
  assert.ok(list.some(p=>p.name==='torso'));assert.ok(list.some(p=>p.name==='pelvis'));
  assert.ok(list.filter(p=>p.name.startsWith('joint:')).length>=8);
  assert.ok(list.every((p,i)=>Number.isFinite(p.depth)&&(!i||p.depth>=list[i-1].depth)));
  assert.doesNotMatch(svg,/NaN|Infinity/);
 }
 const side=parts(puppetSVG('walk',.25,90,false));
 assert.ok(side.findIndex(p=>p.name==='joint:RKnee')<side.findIndex(p=>p.name==='limb:LHip-LKnee'),'Far knee should not paint over near leg.');
 const reverse=parts(puppetSVG('walk',.25,270,false));assert.ok(reverse.findIndex(p=>p.name==='joint:LKnee')<reverse.findIndex(p=>p.name==='limb:RHip-RKnee'));
});

test('floor guides mark only supported heel/toe contacts and disappear from transparent bake style',()=>{
 for(const motion of motions)for(const phase of [0,.15,.3,.48,.7,.9]){
  const p=pose(motion,phase),svg=puppetSVG(motion,phase,45,true);
  for(const side of ['L','R'])assert.equal(svg.includes(`data-contact="${side}"`),Math.min(p[side+'Heel'].y,p[side+'Toe'].y)<=.020001);
  const baked=puppetSVG(motion,phase,45,false);assert.doesNotMatch(baked,/data-puppet-floor|data-contact=/);
  assert.equal(svg.slice(svg.indexOf('<g data-puppet-part=')),baked.slice(baked.indexOf('<g data-puppet-part=')),'The model style must be identical in preview and baking.');
 }
});

function dialogFixture(){
 const controls=new Map(),viewButtons=puppetViews.map(v=>element({puppetView:String(v.rotation)}));
 function element(dataset={}){const attrs={};return {dataset,value:'',checked:false,innerHTML:'',textContent:'',classList:{add(){},toggle(){}},setAttribute(k,v){attrs[k]=String(v);},getAttribute:k=>attrs[k],setPointerCapture(){}};}
 const values={'[data-puppet-length]':'2','[data-puppet-unit]':'seconds','[data-puppet-tempo]':'120','[data-puppet-beats]':'4','[data-puppet-start]':'zero','[data-puppet-angle]':'90','[data-puppet-angle-number]':'90'};
 const d={classList:{add(){}},open:true,querySelector(selector){if(!controls.has(selector)){const e=element();e.value=values[selector]||'';controls.set(selector,e);}return controls.get(selector);},querySelectorAll(selector){return selector==='[data-puppet-view]'?viewButtons:[];},addEventListener(){},close(){this.open=false;}};
 const a={doc:{width:1280,height:720,fps:24,duration:6,playback:{bpm:120,beatsPerBar:4}},time:0,pause(){},properties:{flush(){}},stage:{finishPath(){}},dialog(title,html){d.title=title;d.html=html;return d;}};
 return {a,d,controls,viewButtons};
}

test('quick side/front/three-quarter views update the same preview renderer and angle inputs',()=>{
 const original=globalThis.cancelAnimationFrame;globalThis.cancelAnimationFrame=()=>{};
 try{const {a,d,viewButtons}=dialogFixture();showPuppet(a);assert.equal(d.querySelector('.puppet-preview').innerHTML,puppetSVG('walk',0,90));
  for(const button of viewButtons){button.onclick();const rotation=Number(button.dataset.puppetView);assert.equal(Number(d.querySelector('[data-puppet-angle]').value),rotation);assert.equal(Number(d.querySelector('[data-puppet-angle-number]').value),rotation);assert.equal(d.querySelector('.puppet-preview').innerHTML,puppetSVG('walk',0,rotation));assert.equal(button.getAttribute('aria-pressed'),'true');}
  assert.match(d.html,/Quaternius CC0/);assert.match(d.html,/not bundled/);assert.match(d.html,/does not import GLB rigs/);
 }finally{globalThis.cancelAnimationFrame=original;}
});
