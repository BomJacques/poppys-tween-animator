import test from 'node:test';import assert from 'node:assert/strict';
import {inspectorBounds,inspectorWidth,readInspectorWidth,bindInspectorResize} from '../dist/ui/inspector-resize.js';
test('inspector width leaves canvas space and remains usable at narrow viewport sizes',()=>{
 for(const width of [320,600,699,700,768,900,901,1024,1920]){const limits=inspectorBounds(width);assert.ok(limits.min<=limits.max);assert.ok(limits.max<=520);assert.ok(limits.max<=width-64-24);const panel=inspectorWidth(9999,limits);if(width>=700)assert.ok(width-panel-64-8>=320);assert.equal(inspectorWidth(-20,limits),limits.min);}
 assert.equal(readInspectorWidth({getItem:()=>null}),300);assert.equal(readInspectorWidth({getItem:()=>'{broken'}),300);assert.equal(readInspectorWidth({getItem:()=> '440'}),440);assert.equal(readInspectorWidth({getItem(){throw Error();}}),300);
});
test('resizing persists only committed preference; viewport clamp and pointer cancellation retain it',()=>{
 const saved={};const previous=Object.fromEntries(['document','window','localStorage','requestAnimationFrame','MutationObserver'].map(k=>[k,globalThis[k]]));let raf=[];const windowListeners={};
 function node(){const listeners={},attrs={},classes=new Set();return {style:{setProperty(k,v){this[k]=v;}},attrs,listeners,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},addEventListener(k,fn){listeners[k]=fn;},setAttribute(k,v){attrs[k]=String(v);},getBoundingClientRect:()=>({width:64}),setPointerCapture(id){this.capture=id;},hasPointerCapture(id){return this.capture===id;},releasePointerCapture(){this.capture=null;listeners.lostpointercapture?.();}};}
 const handle=node(),panel=node(),workspace=node(),rail=node();panel.classList.add('open');let layouts=0,flushes=0;
 globalThis.document={querySelector:s=>({'#inspector-resize':handle,'#properties-panel':panel,'.workspace':workspace,'.tools':rail})[s]};globalThis.window={innerWidth:1200,addEventListener(k,fn){windowListeners[k]=fn;}};globalThis.localStorage={getItem:()=> '440',setItem(k,v){saved[k]=v;}};globalThis.requestAnimationFrame=fn=>(raf.push(fn),raf.length);globalThis.MutationObserver=class {observe(){}};
 const event=(extra={})=>({preventDefault(){},button:0,pointerId:7,clientX:600,...extra});const flush=()=>{raf.splice(0).forEach(fn=>fn());};
 try{bindInspectorResize({stage:{layout(){layouts++;}},properties:{flush(){flushes++;}}});flush();assert.equal(panel.style.width,'440px');
  window.innerWidth=700;windowListeners.resize();flush();assert.equal(panel.style.width,'308px');window.innerWidth=400;windowListeners.resize();flush();assert.equal(panel.style.width,'312px');assert.deepEqual(saved,{});window.innerWidth=1200;windowListeners.resize();flush();assert.equal(panel.style.width,'440px');
  handle.listeners.pointerdown(event());handle.listeners.pointermove(event({clientX:540}));assert.equal(panel.style.width,'500px');handle.listeners.pointercancel(event());assert.equal(panel.style.width,'440px');assert.deepEqual(saved,{});
  handle.listeners.pointerdown(event());handle.listeners.pointermove(event({clientX:560}));handle.listeners.pointerup(event());assert.equal(panel.style.width,'480px');assert.equal(saved['poppy-properties-width'],'480');
  handle.listeners.keydown(event({key:'ArrowRight'}));assert.equal(panel.style.width,'464px');handle.listeners.keydown(event({key:'ArrowLeft',shiftKey:true}));assert.equal(panel.style.width,'520px');assert.equal(handle.attrs['aria-valuenow'],'520');assert.equal(flushes,2);flush();assert.ok(layouts>=4);
 }finally{for(const [k,value] of Object.entries(previous))if(value===undefined)delete globalThis[k];else globalThis[k]=value;}
});
