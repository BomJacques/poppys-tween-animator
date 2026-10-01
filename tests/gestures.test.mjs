import test from 'node:test';import assert from 'node:assert/strict';import {StageInput} from '../dist/input/stage.js';
test('two-finger tap undoes once only after both fingers lift; moving and long holds do not undo',()=>{
 for(const scenario of ['tap','move','hold']){let undos=0;const points=new Map([[1,{x:100,y:100}],[2,{x:150,y:100}]]),stage={a:{history:{undo(){undos++;}},toast(){},render(){}},owner:1,pointers:new Map([[1,{}],[2,{}]]),g:{type:'pinch',tapCandidate:true,startedAt:Date.now()-(scenario==='hold'?1000:10),tapPoints:points},clearMeshHold(){}};
 StageInput.prototype.up.call(stage,{pointerId:1,clientX:scenario==='move'?120:100,clientY:100});assert.equal(undos,0);
 StageInput.prototype.up.call(stage,{pointerId:2,clientX:150,clientY:100});assert.equal(undos,scenario==='tap'?1:0);assert.equal(stage.g,null);
 }
});
test('mesh hold opens the selected colour picker; release cancels its timer',()=>{
 const oldTimeout=globalThis.setTimeout,oldClear=globalThis.clearTimeout,oldDoc=globalThis.document;let callback,delay,cleared=0,opened=0,cancelled=0;
 globalThis.setTimeout=(fn,ms)=>{callback=fn;delay=ms;return 42;};globalThis.clearTimeout=()=>{cleared++;};globalThis.document={querySelector:()=>({disabled:false,showPicker(){opened++;}})};
 try{const stage={a:{history:{cancel(){cancelled++;}},render(){}},g:{type:'mesh'},owner:1,pointers:new Map([[1,{}]]),clearMeshHold:StageInput.prototype.clearMeshHold};StageInput.prototype.startMeshHold.call(stage,{clientX:100,clientY:100});assert.equal(delay,550);callback();assert.equal(opened,1);assert.equal(cancelled,1);assert.equal(stage.g,null);
 stage.g={type:'mesh'};StageInput.prototype.startMeshHold.call(stage,{clientX:100,clientY:100});StageInput.prototype.up.call(stage,{pointerId:1,clientX:100,clientY:100});assert.ok(cleared>=2);assert.equal(stage.meshHoldTimer,undefined);
 }finally{globalThis.setTimeout=oldTimeout;globalThis.clearTimeout=oldClear;if(oldDoc===undefined)delete globalThis.document;else globalThis.document=oldDoc;}
});
