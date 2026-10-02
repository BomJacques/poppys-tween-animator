import test from 'node:test';import assert from 'node:assert/strict';
import {project,object,clone} from '../dist/document/model.js';
import {evaluated} from '../dist/animation/evaluate.js';
import {combineShapes} from '../dist/scene/boolean.js';
import {createMesh,rasterMesh} from '../dist/scene/mesh.js';
import {meshRenderField,artwork} from '../dist/renderer/svg.js';
const fixture=()=>{const p=project(),a=object('rectangle',{width:100,height:100}),b=object('rectangle',{x:80,width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100},'#ff0000')});p.layers=[a,b];return {p,a,b};};
const full=r=>{for(let i=3;i<r.pixels.length;i+=4)assert.equal(r.pixels[i],255);};

test('combined mesh takes evaluated source colour and transforms points while covering the union extent',()=>{
 const {p,a,b}=fixture(),blue=clone(b.mesh);blue.points.forEach(q=>q.color='#0000ff');b.tracks.mesh=[{time:0,value:clone(b.mesh),easing:'linear'},{time:2,value:blue,easing:'linear'}];const before=clone(b),n=combineShapes(p,[a.id,b.id],'union',1);
 assert.equal(n.mesh.points[0].color,'#800080');assert.equal(n.mesh.points[0].x,80);assert.equal(n.mesh.points.at(-1).x,180);assert.deepEqual(n.mesh.bounds,{x:0,y:0,width:180,height:100});assert.deepEqual(b,before);
 const r=rasterMesh(meshRenderField(evaluated(n,1)),96);full(r);assert.ok(r.pixels[0]>0&&r.pixels[2]>0,'Union area left of original mesh receives shading.');
});

test('combined manual mesh shade field follows outward shape edits beyond the old rectangle without resetting mesh points',()=>{
 const {p,a,b}=fixture();b.mesh.manualBounds={...b.mesh.bounds};const n=combineShapes(p,[a.id,b.id],'union'),before=clone(n.mesh);n.nodes.forEach(q=>{if(q.x===0)q.x=-100;});
 const field=meshRenderField(evaluated(n,0));assert.deepEqual(field.bounds,{x:-100,y:0,width:280,height:100});assert.deepEqual(field.points,before.points);assert.deepEqual(n.mesh,before);full(rasterMesh(field,96));
});

test('mesh image bounds follow evaluated geometry and mesh keys at current time, never geometry at time zero',()=>{
 const {p,a,b}=fixture(),n=combineShapes(p,[a.id,b.id],'union'),expanded=clone(n.nodes);expanded.forEach(q=>{if(q.x===0)q.x=-120;});n.mesh.contour=false;n.tracks.nodes=[{time:0,value:clone(n.nodes),easing:'linear'},{time:2,value:expanded,easing:'linear'}];const moved=clone(n.mesh);moved.points[4].x+=20;n.tracks.mesh=[{time:0,value:clone(n.mesh),easing:'linear'},{time:2,value:moved,easing:'linear'}];const before=clone(n),v=evaluated(n,2),field=meshRenderField(v);
 assert.equal(field.bounds.x,-120);assert.equal(field.bounds.width,300);assert.deepEqual(field.points,moved.points);full(rasterMesh(field,96));assert.deepEqual(n,before);
 const originalDocument=globalThis.document,originalImage=globalThis.ImageData;globalThis.ImageData=class{};globalThis.document={createElement:()=>({getContext:()=>({putImageData(){}}),toDataURL:()=> 'data:image/png;base64,AA=='})};
 try{const s=artwork(n,2,false,false,undefined,{meshResolution:96});assert.match(s,/<image[^>]* x="-120" y="0" width="300" height="100"/);assert.match(s,/<g fill="transparent" stroke="none">/);}finally{globalThis.document=originalDocument;globalThis.ImageData=originalImage;}
});
