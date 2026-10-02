import test from 'node:test';
import assert from 'node:assert/strict';
import {object,clone,project} from '../dist/document/model.js';
import {validate} from '../dist/document/validate.js';
import {evaluated} from '../dist/animation/evaluate.js';
import {fitMesh} from '../dist/scene/contour.js';
import {meshSample,createMesh,meshCellAt,splitMesh,rasterMesh} from '../dist/scene/mesh.js';
import {insertMeshPoint} from '../dist/scene/mesh-edit.js';
import {meshOverlay} from '../dist/scene/mesh-overlay.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} differs from ${b}`);

test('new contour meshes start sparse and use smooth nonuniform curve geometry',()=>{
 const n=object('ellipse',{width:200,height:100}),m=fitMesh(n);
 assert.equal(m.rows,3);assert.equal(m.cols,3);assert.equal(m.points.length,9);assert.equal(m.curved,true);assert.deepEqual(m.rowKnots,[0,.5,1]);assert.deepEqual(m.colKnots,[0,.5,1]);
 const a=m.points[0],b=m.points[1],mid=meshSample(m,0,0,.5,0);assert.ok(Math.abs(mid.y-(a.y+b.y)/2)>.1);
 const square=fitMesh(object('rectangle',{width:200,height:100}));assert.equal(square.curved,true);near(meshSample(square,0,0,.4,.7).x,40);near(meshSample(square,0,0,.4,.7).y,35);
});

test('asymmetric contour taps add intersecting curved grid lines at the exact point',()=>{
 const n=object('ellipse',{width:200,height:100});n.mesh=fitMesh(n);const tap={x:74,y:34},result=insertMeshPoint(n,0,tap);
 assert.equal(result.inserted,true);assert.equal(n.mesh.rows,4);assert.equal(n.mesh.cols,4);near(n.mesh.points[result.index].x,tap.x);near(n.mesh.points[result.index].y,tap.y);
 assert.ok(n.mesh.rowKnots[1]>0&&n.mesh.rowKnots[1]<.5);assert.ok(n.mesh.colKnots[1]>0&&n.mesh.colKnots[1]<.5);
 const q=meshSample(n.mesh,0,1,.5,0),a=n.mesh.points[1],b=n.mesh.points[2];assert.ok(Math.abs(q.y-(a.y+b.y)/2)>.01);
 const raster=rasterMesh(n.mesh,100);assert.ok(raster.pixels.some((v,i)=>i%4===3&&v===255));
});

test('knot spacing preserves a regular field after repeated unequal subdivisions',()=>{
 let m=fitMesh(object('rectangle',{width:200,height:100}));
 m=splitMesh(m,0,0,.12,.84);m=splitMesh(m,1,2,.77,.21);
 for(const p of [{x:5,y:5},{x:199,y:99},{x:74,y:34},{x:135,y:81}]){const cell=meshCellAt(m,p);assert.ok(cell);const q=meshSample(m,cell.row,cell.col,cell.u,cell.v);near(q.x,p.x);near(q.y,p.y);}
 assert.ok(m.rowKnots.every((v,i)=>!i||v>m.rowKnots[i-1]));assert.ok(m.colKnots.every((v,i)=>!i||v>m.colKnots[i-1]));
});

test('legacy meshes keep existing geometry until explicitly refitted',()=>{
 const m=createMesh({x:0,y:0,width:100,height:100},'#444444');near(meshSample(m,0,0,.5,.5).x,25);m.curved=true;near(meshSample(m,0,0,.5,.5).x,21.875);near(meshSample(m,0,0,.5,.5).y,21.875);
 const split=splitMesh(m,0,0,.3,.7);assert.equal(split.rowKnots,undefined);assert.equal(split.colKnots,undefined);
 const saved=JSON.parse(JSON.stringify(m));assert.deepEqual(meshSample(saved,0,0,.7,.3),meshSample(m,0,0,.7,.3));
});

test('curve knot insertion preserves topology in every base, block and cut mesh state',()=>{
 const p=project(),n=object('ellipse',{width:200,height:100});p.layers=[n];n.mesh=fitMesh(n);
 n.tracks.mesh=[{id:'first',time:0,easing:'linear',value:clone(n.mesh)},{id:'last',time:4,easing:'linear',value:clone(n.mesh)}];n.tracks.mesh[1].value.points[4].color='#ffffff';
 n.blocks=[{id:'block',kind:'animation',name:'Shading',start:1,end:3,props:['mesh'],tracks:{mesh:[{id:'override',time:1,easing:'linear',value:clone(n.mesh)}]}}];n.blockCuts=[{start:4,end:5,values:{mesh:clone(n.mesh)}}];
 const result=insertMeshPoint(n,2,{x:74,y:34}),all=[n.mesh,...n.tracks.mesh.map(k=>k.value),n.blocks[0].tracks.mesh[0].value,n.blockCuts[0].values.mesh];
 all.forEach(m=>{assert.equal(m.rows,4);assert.equal(m.cols,4);assert.deepEqual(m.rowKnots,n.mesh.rowKnots);assert.deepEqual(m.colKnots,n.mesh.colKnots);});
 near(evaluated(n,2).mesh.points[result.index].x,74);assert.deepEqual(validate(JSON.parse(JSON.stringify(p))),p);
});

test('overlay uses contrasting clipped curves with small dots and 44px screen targets',()=>{
 const n=object('ellipse',{width:200,height:100}),m=fitMesh(n);m.points.forEach(p=>p.color='#555555');
 const markup=meshOverlay(m,[1,0,0,1,20,30],2,{activeIndex:4,node:n,id:'shape-test'});
 assert.match(markup,/stroke="#ffffff"/);assert.match(markup,/stroke="#1660d8"/);assert.match(markup,/clip-path="url\(#mesh-scaffold-shape-test\)"/);
 assert.equal((markup.match(/class="node-handle mesh-point"/g)||[]).length,9);
 assert.equal((markup.match(/data-mesh-hit="\d+"[^>]*r="11"/g)||[]).length,9);
 assert.match(markup,/data-mesh="4"/);assert.match(markup,/fill="#555555"/);assert.match(markup,/cx="120" cy="80"/);
 assert.match(markup,/data-mesh-line="row-1"/);assert.match(markup,/data-mesh-line="column-1"/);
 assert.doesNotMatch(markup,/NaN|Infinity/);
});

test('compound-hole clip rules and extreme zoom keep overlay geometry finite',()=>{
 const n=object('path',{fillRule:'evenodd',nodes:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100,close:true},{x:35,y:35,move:true},{x:65,y:35},{x:65,y:65},{x:35,y:65,close:true}]});
 const m=fitMesh(n),markup=meshOverlay(m,[1.2,.1,.4,.8,10,20],.05,{node:n,id:'holes'});assert.match(markup,/clip-rule="evenodd"/);assert.doesNotMatch(markup,/NaN|Infinity/);assert.match(markup,/r="440"/);
});
