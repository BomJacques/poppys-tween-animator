import test from 'node:test';
import assert from 'node:assert/strict';
import {object,project,History,clone} from '../dist/document/model.js';
import {bevelPathData} from '../dist/scene/bevel.js';
import {texturePlacement,textureSVG,importTexture} from '../dist/scene/texture.js';
import {interpolate,putKey,evaluated} from '../dist/animation/evaluate.js';
import {pathData,sceneSVG} from '../dist/renderer/svg.js';
import {beginTexturePreview} from '../dist/ui/texture.js';
import {showShapes,chooseShape} from '../dist/ui/shapes-menu.js';
import {renderContext} from '../dist/ui/context.js';
import {StageInput} from '../dist/input/stage.js';
const texture={src:'data:image/png;base64,QUJD',width:400,height:200,mode:'cover',scale:1,x:0,y:0};

test('point radii trim only the chosen corner, retain editable source points, and export the same geometry',()=>{
 const n=object('path',{closed:true,nodes:[{x:0,y:0},{x:100,y:0,bevelRadius:10},{x:100,y:100},{x:0,y:100}]}),before=clone(n.nodes),d=bevelPathData(n);
 assert.match(d,/L 90 0 Q 100 0 100 10/);assert.deepEqual(n.nodes,before);
 assert.equal(pathData(n),d);const p=project();p.layers=[n];assert.ok(sceneSVG(p,0).includes(d));
 n.nodes[1].bevelStyle='bevel';assert.match(pathData(n),/L 90 0 L 100 10/);assert.doesNotMatch(pathData(n),/ Q /);
 n.nodes[1].bevelRadius=2000;assert.doesNotMatch(pathData(n),/NaN|Infinity/);assert.match(pathData(n),/L 55 0/);
});

test('bevels preserve cubic segments, open endpoints, and compound subpath closure',()=>{
 const n={closed:false,nodes:[{x:0,y:0,bevelRadius:12,out:{x:30,y:0}},{x:100,y:0,in:{x:70,y:0},bevelRadius:12},{x:100,y:100,bevelRadius:12}]},d=bevelPathData(n);
 assert.match(d,/^M 0 0 C /);assert.match(d,/ Q 100 0 /);assert.match(d,/L 100 100$/);assert.doesNotMatch(d,/NaN|Infinity| Z/);
 const compound={nodes:[{x:0,y:0,bevelRadius:5},{x:50,y:0},{x:0,y:50,close:true},{x:100,y:100,move:true,bevelRadius:5},{x:150,y:100},{x:100,y:150,close:true}]};
 assert.equal((bevelPathData(compound).match(/ Z/g)||[]).length,2);assert.equal((bevelPathData(compound).match(/M /g)||[]).length,2);
});

test('animated point bevel radius interpolates while source geometry remains unchanged',()=>{
 const n=object('path',{closed:true,nodes:[{x:0,y:0},{x:100,y:0,bevelRadius:0},{x:100,y:100}]}),later=clone(n.nodes);later[1].bevelRadius=20;
 putKey(n,'nodes',0,n.nodes,'linear');putKey(n,'nodes',2,later);const v=evaluated(n,1);assert.equal(v.nodes[1].bevelRadius,10);assert.equal(n.nodes[1].bevelRadius,0);assert.match(pathData(v),/Q 100 0/);
 assert.equal(interpolate([{x:0,y:0}],[{x:0,y:0,bevelRadius:20}],.5)[0].bevelRadius,10);
});

test('texture fitting keeps cover cropping, fit letterboxing, stretch, and offsets distinct',()=>{
 const b={x:10,y:20,width:100,height:100};
 assert.deepEqual(texturePlacement(texture,b),{mode:'cover',width:200,height:100,x:-40,y:20});
 assert.deepEqual(texturePlacement({...texture,mode:'fit'},b),{mode:'fit',width:100,height:50,x:10,y:45});
 assert.deepEqual(texturePlacement({...texture,mode:'stretch'},b),{mode:'stretch',width:100,height:100,x:10,y:20});
 const moved=texturePlacement({...texture,mode:'tile',scale:2,x:7,y:-3},b);assert.equal(moved.width,200);assert.equal(moved.height,100);assert.equal(moved.x,-33);assert.equal(moved.y,17);
});

test('textures export embedded PNG with clipping, tiles and strokes; unsafe sources never render',()=>{
 const p=project(),n=object('ellipse',{texture,stroke:'#ff0000',strokeWidth:4,shadowEnabled:true});p.layers=[n];const svg=sceneSVG(p,0);
 assert.match(svg,/texture-clip-/);assert.match(svg,/data:image\/png;base64,QUJD/);assert.match(svg,/<g fill="none"><ellipse/);assert.match(svg,/filter=/);
 const tile=textureSVG({...texture,mode:'tile'},{x:0,y:0,width:100,height:100},'<path d="M0 0L100 0L0 100Z"/>','test');assert.match(tile,/<pattern /);assert.match(tile,/patternUnits="userSpaceOnUse"/);
 assert.match(textureSVG(texture,{x:0,y:0,width:100,height:100},'<path/>','holes',false,'evenodd'),/clip-rule="evenodd"/);
 for(const src of ['https://example.com/image.png','data:image/svg+xml,<svg/>','data:image/png;base64,QUJD" onload="bad'])assert.equal(textureSVG({...texture,src},{x:0,y:0,width:100,height:100},'<rect/>','test'),'');
});

test('texture preview applies one undo step and cancellation restores the original',()=>{
 let doc=project();doc.layers=[object('rectangle',{texture:{...texture,mode:'fit'}})];let saves=0;
 const a={get doc(){return doc;},properties:{flush(){}},stage:{finishPath(){}},pause(){},render(){},renderStage(){},scheduleSave(){saves++;}};
 a.history=new History(()=>doc,p=>doc=p);const id=doc.layers[0].id,initial=clone(doc.layers[0].texture);
 let session=beginTexturePreview(a,id,texture);session.preview({scale:2});session.preview({x:18,mode:'tile'});assert.equal(a.history.undoStack.length,0);session.apply();assert.equal(a.history.undoStack.length,1);a.history.undo();assert.deepEqual(doc.layers[0].texture,initial);
 session=beginTexturePreview(a,id,texture);session.preview({scale:3});session.cancel();assert.deepEqual(doc.layers[0].texture,initial);assert.equal(a.history.undoStack.length,0);assert.equal(saves,1);
 delete doc.layers[0].texture;session=beginTexturePreview(a,id,texture);session.cancel();assert.equal(doc.layers[0].texture,undefined);
});

test('raster import resamples to at most 2048 and revokes the temporary URL',async()=>{
 const saved={Image:globalThis.Image,document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL};let size,revoked;
 try{URL.createObjectURL=()=> 'blob:temporary';URL.revokeObjectURL=url=>revoked=url;globalThis.Image=class{naturalWidth=4000;naturalHeight=2000;async decode(){}};globalThis.document={createElement(){return {set width(v){size={...size,width:v};},set height(v){size={...size,height:v};},getContext(){return {drawImage(){}};},toDataURL(type){assert.equal(type,'image/png');return 'data:image/png;base64,QUJD';}};}};
  const result=await importTexture({size:100,type:'image/jpeg'});assert.deepEqual(size,{width:2048,height:1024});assert.equal(result.width,2048);assert.equal(result.height,1024);assert.equal(revoked,'blob:temporary');await assert.rejects(()=>importTexture({size:100,type:'image/svg+xml'}),/Choose a PNG/);
 }finally{globalThis.Image=saved.Image;globalThis.document=saved.document;URL.createObjectURL=saved.create;URL.revokeObjectURL=saved.revoke;}
});

test('Shapes opens inline without changing tools or dialogs, and scaffold hides all handles',()=>{
 let renders=0;const a={tool:'select',render(){renders++;},stage:{finishPath(){}},dialog(){throw Error('No shape dialog');}};
 showShapes(a);assert.equal(a.shapesOpen,true);assert.equal(a.tool,'select');chooseShape(a,'star');assert.equal(a.tool,'star');assert.equal(a.shapesOpen,true);assert.equal(renders,2);
 const stage={a:{showScaffold:false,tool:'direct',selected:['test']},overlay:{innerHTML:'old handles'}};StageInput.prototype.handles.call(stage);assert.equal(stage.overlay.innerHTML,'');assert.equal(stage.a.tool,'direct');
 const previous=globalThis.document,el={contains(){return false;},innerHTML:''};globalThis.document={querySelector(){return el;},activeElement:null};
 try{renderContext({...a,doc:project(),selected:[],showScaffold:false});assert.match(el.innerHTML,/shape-dock/);assert.match(el.innerHTML,/data-shape="star" aria-pressed="true"/);assert.match(el.innerHTML,/Scaffold off/);}finally{globalThis.document=previous;}
});
