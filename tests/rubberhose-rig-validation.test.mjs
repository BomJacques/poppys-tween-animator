import test from 'node:test';
import assert from 'node:assert/strict';
import {object,project} from '../dist/document/model.js';
import {validate} from '../dist/document/validate.js';
test('rubber hose rig metadata is optional for old paths and accepts boolean controls',()=>{const p=project(),n=object('path',{rubberhose:true,nodes:[{x:0,y:0},{x:50,y:50},{x:100,y:0}]});p.layers=[n];validate(p);n.rubberhoseRig={enabled:true,stretch:false};validate(p);n.rubberhoseRig={enabled:false,stretch:true};validate(p);});
test('rig validator rejects malformed controls, dynamic lengths and incompatible layer kinds',()=>{const p=project(),n=object('path',{rubberhose:true});p.layers=[n];for(const value of [null,true,[],{}, {enabled:true},{enabled:'true',stretch:false},{enabled:true,stretch:1},{enabled:true,stretch:false,lengths:[1,2]}]){n.rubberhoseRig=value;assert.throws(()=>validate(p),/rubber hose rig/);}n.rubberhoseRig={enabled:true,stretch:false};n.rubberhose=false;assert.throws(()=>validate(p),/rubber hose rig/);n.type='rectangle';delete n.rubberhose;assert.throws(()=>validate(p),/rubber hose rig/);});
