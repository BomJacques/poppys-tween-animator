import test from 'node:test';import assert from 'node:assert/strict';
import {object,clone} from '../dist/document/model.js';
import {fitMesh,constrainMeshPoint} from '../dist/scene/contour.js';
import {meshSample,rasterMesh,meshImage} from '../dist/scene/mesh.js';
import {artwork,meshRasterSize} from '../dist/renderer/svg.js';
const coloured=type=>{const n=object(type,{width:100,height:100,fill:'#00ff00'});n.mesh=fitMesh(n);n.mesh.points.forEach((p,i)=>p.color=i%3===0?'#ff0000':i%3===1?'#800080':'#0000ff');return n;};
const full=r=>{for(let i=3;i<r.pixels.length;i+=4)assert.equal(r.pixels[i],255,`Uncovered pixel ${i/4}`);};

test('extreme boundary and interior movement cannot expose alpha holes or the original flat fill',()=>{
 for(const type of ['rectangle','ellipse']){const n=coloured(type),m=clone(n.mesh);m.points[3].x=99;m.points[4].x=98;m.points[4].y=2;const r=rasterMesh(m,96);full(r);assert.equal(r.pixels.filter((v,i)=>i%4===1&&v!==0).length,0,'Original green fill must not appear in mesh pixels.');assert.ok(r.pixels.some((v,i)=>i%4===0&&v>0));assert.ok(r.pixels.some((v,i)=>i%4===2&&v>0));}
 const n=coloured('rectangle');n.mesh.points.forEach(p=>{p.x=50;p.y=50;});full(rasterMesh(n.mesh,64));
});

test('outer contour anchors attach to the original boundary while interiors retain freedom',()=>{
 const n=coloured('ellipse'),edge=constrainMeshPoint(n,0,{x:92,y:48},n.mesh,3);assert.ok(Math.abs(((edge.x-50)/50)**2+((edge.y-50)/50)**2-1)<.01);
 const inner=constrainMeshPoint(n,0,{x:75,y:55},n.mesh,4);assert.deepEqual(inner,{x:75,y:55});
 const p=object('path',{fillRule:'evenodd',width:100,height:100,nodes:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100,close:true},{x:30,y:30,move:true},{x:70,y:30},{x:70,y:70},{x:30,y:70,close:true}]});p.mesh=fitMesh(p);const m={...p.mesh,points:clone(p.mesh.points)};m.points[3]={...m.points[3],x:0,y:50};const q=constrainMeshPoint(p,0,{x:50,y:50},m,3);assert.ok(q.x===0||q.x===100||q.y===0||q.y===100,'Outer point must not jump onto hole boundary.');
});

test('curved colour patches join with continuous derivatives and bounded RGB values',()=>{
 const n=coloured('rectangle'),m=n.mesh;for(const p of m.points)p.color=p.x===0?'#000000':p.x===50?'#808080':'#ffffff';
 const h=1e-5,span=.5,mid=meshSample(m,0,0,1,.3).rgb[0],left=(mid-meshSample(m,0,0,1-h,.3).rgb[0])/(h*span),right=(meshSample(m,0,1,h,.3).rgb[0]-mid)/(h*span);assert.ok(Math.abs(left-right)<.01,`${left} and ${right} differ at patch joint.`);
 for(let i=0;i<=100;i++)for(const q of meshSample(m,0,i<50?0:1,(i%50)/50,.5).rgb)assert.ok(q>=0&&q<=255);
 const r=rasterMesh(m,256);for(const x of [9,33,61,95,123,128,139,176,220,249]){const u=(x+.5)/256*2,c=Math.min(1,Math.floor(u)),expected=meshSample(m,0,c,u-c,.5).rgb[0],actual=r.pixels[(128*256+x)*4];assert.ok(Math.abs(actual-expected)<4,`Gradient error ${actual-expected} at ${x}`);}
});

test('adaptive raster detail tracks smooth curved colour without sharp triangle transitions',()=>{
 const n=coloured('rectangle'),m=n.mesh;m.points[4].color='#ffffff';const r=rasterMesh(m,256);let maxJump=0;
 for(let x=1;x<255;x++){const a=r.pixels[(128*256+x)*4],b=r.pixels[(128*256+x+1)*4];maxJump=Math.max(maxJump,Math.abs(a-b));}assert.ok(maxJump<=5,`Sharp gradient jump ${maxJump}`);full(r);
});

test('zoom resolution cache distinguishes physical detail and mesh rendering replaces visible original fill',()=>{
 const n=coloured('ellipse'),originalDocument=globalThis.document,originalImageData=globalThis.ImageData,sizes=[];
 globalThis.ImageData=class{constructor(p,w,h){this.data=p;this.width=w;this.height=h;}};
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({putImageData:image=>sizes.push([image.width,image.height])}),toDataURL:()=>`data:image/png;base64,${Buffer.from(String(sizes.length)).toString('base64')}`})};
 try{meshImage(n.mesh,256);meshImage(n.mesh,255);assert.equal(sizes.length,1);meshImage(n.mesh,1024);assert.equal(sizes.length,2);assert.deepEqual(sizes,[[256,256],[1024,1024]]);const s=artwork(n,0);assert.match(s,/<g fill="transparent" stroke="none"><ellipse/);assert.doesNotMatch(s,/<ellipse[^>]*fill="#00ff00"/);assert.match(s,/clip-path="url\(#mesh-/);
  assert.equal(meshRasterSize(n.mesh,[2,0,0,2,0,0],{meshPixelScale:3,meshResolution:2048}),900);assert.equal(meshRasterSize(n.mesh,[10,0,0,10,0,0],{meshPixelScale:10,meshResolution:2048}),2048);
 }finally{globalThis.document=originalDocument;globalThis.ImageData=originalImageData;}
});
