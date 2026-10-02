import test from 'node:test';
import assert from 'node:assert/strict';
import {object,project,clone} from '../dist/document/model.js';
import {validate} from '../dist/document/validate.js';
import {evaluated} from '../dist/animation/evaluate.js';
import {createMesh,meshSample,meshCellAt,subdivideMesh} from '../dist/scene/mesh.js';
import {manualMesh,fitMesh,constrainMeshPoint} from '../dist/scene/contour.js';
import {shapeRegion} from '../dist/scene/mesh-region.js';
import {placeMeshBounds,insertMeshPoint,currentMesh} from '../dist/scene/mesh-edit.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} differs from ${b}`);
const ring=(x,y,w,h)=>[{x,y,move:true},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h,close:true}];
const holeShape=()=>object('path',{width:100,height:100,closed:false,fillRule:'evenodd',nodes:[...ring(0,0,100,100),...ring(35,35,30,30)]});

test('two reversed corner taps place a local mesh with exact manual region',()=>{
 const n=object('rectangle',{width:200,height:100,x:900,rotation:45});
 placeMeshBounds(n,0,{x:180,y:80},{x:20,y:10});
 assert.deepEqual(n.mesh.bounds,{x:20,y:10,width:160,height:70});assert.deepEqual(n.mesh.manualBounds,n.mesh.bounds);
 assert.equal(n.mesh.contour,false);assert.equal(n.mesh.curved,false);
 assert.deepEqual(n.mesh.points[0],{x:20,y:10,color:n.fill});
 assert.throws(()=>placeMeshBounds(n,0,{x:10,y:20},{x:10,y:20}),/different/);
 assert.throws(()=>placeMeshBounds(n,0,{x:-10,y:20},{x:80,y:70}),/inside/);
});

test('manual placement and dragged points respect ellipse and compound holes',()=>{
 const ellipse=object('ellipse',{width:200,height:100});const m=manualMesh(ellipse,0,{x:20,y:30},{x:180,y:70});const region=shapeRegion(ellipse);
 assert.ok(m.points.every(p=>region.contains(p)));
 const n=holeShape();placeMeshBounds(n,0,{x:10,y:10},{x:90,y:90});
 assert.ok(n.mesh.points.every(p=>shapeRegion(n).contains(p)));
 const p=constrainMeshPoint(n,0,{x:50,y:50},n.mesh);assert.ok(shapeRegion(n).contains(p));assert.ok(p.x===35||p.x===65||p.y===35||p.y===65);
 assert.throws(()=>insertMeshPoint(n,0,{x:50,y:50}),/holes/);
});

test('nonzero rings distinguish same-direction fill from reversed holes',()=>{
 const n=holeShape();n.fillRule='nonzero';assert.ok(shapeRegion(n).contains({x:50,y:50}));
 n.nodes=[...ring(0,0,100,100),{x:35,y:35,move:true},{x:35,y:65},{x:65,y:65},{x:65,y:35,close:true}];
 assert.equal(shapeRegion(n).contains({x:50,y:50}),false);
 assert.ok(fitMesh(n).points.every(p=>shapeRegion(n).contains(p)));
});

test('arbitrary interior insertion lands at tap and preserves old points and shading',()=>{
 const n=object('rectangle',{width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100},'#000000',2,2)});
 n.mesh.points[1].color='#ff0000';n.mesh.points[2].color='#0000ff';n.mesh.points[3].color='#ff00ff';
 const old=clone(n.mesh),tap={x:3,y:77},result=insertMeshPoint(n,0,tap);
 assert.equal(result.inserted,true);assert.equal(result.index,4);assert.equal(n.mesh.rows,3);assert.equal(n.mesh.cols,3);
 near(n.mesh.points[4].x,tap.x);near(n.mesh.points[4].y,tap.y);
 for(const [i,j] of [[0,0],[1,2],[2,6],[3,8]])assert.deepEqual(n.mesh.points[j],old.points[i]);
 for(const [x,y] of [[1,20],[2,80],[50,50],[99,99]]){const before=meshSample(old,0,0,x/100,y/100),cell=meshCellAt(n.mesh,{x,y}),after=meshSample(n.mesh,cell.row,cell.col,cell.u,cell.v);before.rgb.forEach((v,i)=>assert.ok(Math.abs(v-after.rgb[i])<1));}
});

test('tap near cell edge is not clamped to five percent',()=>{
 const m=createMesh({x:0,y:0,width:100,height:100},'#000000',2,2),q=subdivideMesh(m,0,0,.001,.999).points[4];near(q.x,.1);near(q.y,99.9);
});

test('grid line taps add only one axis and existing intersections select',()=>{
 const n=object('rectangle',{width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100})});
 let result=insertMeshPoint(n,0,{x:50,y:25});assert.equal(n.mesh.cols,3);assert.equal(n.mesh.rows,4);assert.equal(result.index,4);
 result=insertMeshPoint(n,0,{x:50,y:25});assert.equal(result.inserted,false);assert.equal(result.index,4);assert.equal(n.mesh.points.length,12);
});

test('insertion applies identical subdivision to base, block keys and cut values',()=>{
 const n=object('rectangle',{width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100},'#111111',2,2)});
 const other=clone(n.mesh);other.points[3].x=90;other.points[3].color='#ffffff';
 n.tracks.mesh=[{id:'a',time:0,value:clone(n.mesh),easing:'linear'},{id:'b',time:4,value:clone(other)}];
 n.blocks=[{id:'block',start:1,end:3,props:['mesh'],tracks:{mesh:[{id:'c',time:1,value:clone(other)},{id:'d',time:3,value:clone(n.mesh)}]}}];
 n.blockCuts=[{start:4,end:5,values:{mesh:clone(other)}}];
 const all=()=>[n.mesh,...n.tracks.mesh.map(k=>k.value),...n.blocks[0].tracks.mesh.map(k=>k.value),n.blockCuts[0].values.mesh],old=all().map(clone);
 const live=currentMesh(n,2),tap=meshSample(live,0,0,.3,.7),result=insertMeshPoint(n,2,tap);assert.equal(result.index,4);
 all().forEach((mesh,i)=>{assert.equal(mesh.rows,3);assert.equal(mesh.cols,3);assert.deepEqual(mesh.points[8],old[i].points[3]);const q=meshSample(old[i],0,0,.3,.7);near(mesh.points[4].x,q.x);near(mesh.points[4].y,q.y);assert.equal(mesh.points[4].color,'#'+q.rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''));});
 near(evaluated(n,2).mesh.points[4].x,tap.x);near(evaluated(n,2).mesh.points[4].y,tap.y);
});

test('unsupported animated topology rejects atomically',()=>{
 const n=object('rectangle',{mesh:createMesh({x:0,y:0,width:100,height:100},'#333333',2,2)});
 n.tracks.mesh=[{time:0,value:clone(n.mesh)},{time:2,value:createMesh(n.mesh.bounds,'#fff',3,3)}];const before=clone(n);
 assert.throws(()=>insertMeshPoint(n,0,{x:20,y:20}),/different sizes/);assert.deepEqual(n,before);
});

test('manual region survives contour refitting and serialized reload',()=>{
 const n=object('ellipse',{width:200,height:100});placeMeshBounds(n,0,{x:30,y:30},{x:170,y:70});n.mesh.points[4].color='#ff0044';const copy=JSON.parse(JSON.stringify(n));
 const fitted=fitMesh(copy,2,copy.mesh);assert.deepEqual(fitted.bounds,n.mesh.bounds);assert.deepEqual(fitted.points,n.mesh.points);assert.equal(fitted.points[4].color,'#ff0044');
});

test('opposite side taps tolerate jitter and use shape bounds for the other axis',()=>{
 const n=object('rectangle',{width:200,height:100});
 placeMeshBounds(n,0,{x:10,y:50},{x:190,y:53});assert.deepEqual(n.mesh.bounds,{x:10,y:0,width:180,height:100});
 placeMeshBounds(n,0,{x:100,y:10},{x:103,y:90});assert.deepEqual(n.mesh.bounds,{x:0,y:10,width:200,height:80});
 const before=clone(n);assert.throws(()=>placeMeshBounds(n,0,{x:100,y:50},{x:100,y:50}),/different/);assert.deepEqual(n,before);
});

test('manual bounds and mesh state validate after JSON reload, including block and cut copies',()=>{
 const p=project(),n=object('rectangle',{width:100,height:100});p.layers=[n];placeMeshBounds(n,0,{x:10,y:10},{x:90,y:90});
 n.tracks.mesh=[{id:'baseKey',time:0,value:clone(n.mesh),easing:'linear'}];
 n.blocks=[{id:'block',name:'Shading',kind:'animation',start:1,end:3,props:['mesh'],tracks:{mesh:[{id:'blockKey',time:1,value:clone(n.mesh),easing:'hold'}]}}];
 n.blockCuts=[{start:4,end:5,values:{mesh:clone(n.mesh)}}];
 const loaded=validate(JSON.parse(JSON.stringify(p)));assert.deepEqual(loaded,p);
 for(const where of ['base','key','block','cut']){const bad=clone(p),layer=bad.layers[0],m=where==='base'?layer.mesh:where==='key'?layer.tracks.mesh[0].value:where==='block'?layer.blocks[0].tracks.mesh[0].value:layer.blockCuts[0].values.mesh;
  m.manualBounds.height=0;assert.throws(()=>validate(bad),/manual mesh bounds/);
 }
 const bad=clone(p);bad.layers[0].mesh.manualBounds.x=NaN;assert.throws(()=>validate(bad),/manual mesh bounds/);
});

test('placement remaps all existing shading keys without changing their topology or colours',()=>{
 const n=object('rectangle',{width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100},'#333333')});
 n.mesh.points[4].color='#aabbcc';n.tracks.mesh=[{time:0,value:clone(n.mesh)},{time:3,value:clone(n.mesh)}];n.tracks.mesh[1].value.points[4].color='#eeccaa';
 placeMeshBounds(n,1,{x:10,y:20},{x:90,y:80});
 for(const mesh of [n.mesh,...n.tracks.mesh.map(k=>k.value)]){assert.equal(mesh.points.length,9);assert.deepEqual(mesh.bounds,{x:10,y:20,width:80,height:60});near(mesh.points[4].x,50);near(mesh.points[4].y,50);}
 assert.equal(n.mesh.points[4].color,'#aabbcc');assert.equal(n.tracks.mesh[1].value.points[4].color,'#eeccaa');
});

test('a full axis can still split the other axis and limits reject atomically',()=>{
 const n=object('rectangle',{width:100,height:100,mesh:createMesh({x:0,y:0,width:100,height:100},'#333333',17,3)});
 insertMeshPoint(n,0,{x:25,y:50});assert.equal(n.mesh.rows,17);assert.equal(n.mesh.cols,4);
 const before=clone(n);assert.throws(()=>insertMeshPoint(n,0,{x:30,y:51}),/17/);assert.deepEqual(n,before);
});
