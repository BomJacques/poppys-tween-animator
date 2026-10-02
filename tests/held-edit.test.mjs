import test from 'node:test';import assert from 'node:assert/strict';
import {object,project,clone,History} from '../dist/document/model.js';
import {validate} from '../dist/document/validate.js';
import {putKey,setProperty,enableTrack,evaluated,configureAutoKey,activeTracks} from '../dist/animation/evaluate.js';
import {isolateBlock,layerBlocks,trimBlock} from '../dist/animation/blocks.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);
function fixture(){const p=project(),n=object('rectangle',{x:100,y:20});p.layers=[n];for(const [prop,from,to] of [['x',100,200],['y',20,80],['opacity',1,.4]]){putKey(n,prop,0,from,'linear');putKey(n,prop,4,to,'linear');}const block=isolateBlock(n,p,layerBlocks(n,p)[0].id);trimBlock(n,p,block.id,0,2);return {p,n};}
test('AutoKey edits in a trimmed tail record visibly while preserving the previous hold and outside animation',()=>{
 const {p,n}=fixture(),before=clone(n),cuts=clone(n.blockCuts),tracks=clone(n.tracks);configureAutoKey(p,true,'linear');const held=evaluated(n,3).x;setProperty(n,'x',held+50,3);
 near(evaluated(n,3).x,held+50);near(evaluated(n,3.75).x,held+50);assert.deepEqual(n.tracks,tracks);assert.deepEqual(n.blockCuts,cuts);
 for(let f=0;f<72;f++){const time=f/24;near(evaluated(n,time).x,evaluated(before,time).x);}for(let f=96;f<=144;f++)near(evaluated(n,f/24).x,evaluated(before,f/24).x);
 for(let f=0;f<=144;f++){near(evaluated(n,f/24).y,evaluated(before,f/24).y);near(evaluated(n,f/24).opacity,evaluated(before,f/24).opacity);}
 const edit=n.blocks.at(-1);assert.equal(edit.start,3);assert.equal(edit.end,4);assert.deepEqual(edit.props,['x']);assert.equal(edit.tracks.x[0].value,held+50);validate(JSON.parse(JSON.stringify(p)));
});
test('simultaneous x/y edits share one override and repeated samples update keys instead of adding blocks',()=>{
 const {p,n}=fixture();configureAutoKey(p,true);const count=n.blocks.length,hold=evaluated(n,3);setProperty(n,'x',hold.x+10,3);setProperty(n,'y',hold.y+20,3);
 assert.equal(n.blocks.length,count+1);assert.deepEqual(n.blocks.at(-1).props,['x','y']);
 for(let i=0;i<20;i++){setProperty(n,'x',hold.x+i,3);setProperty(n,'y',hold.y+i*2,3);}assert.equal(n.blocks.length,count+1);assert.equal(n.blocks.at(-1).tracks.x.length,1);assert.equal(n.blocks.at(-1).tracks.y.length,1);near(evaluated(n,3).x,hold.x+19);near(evaluated(n,3).y,hold.y+38);
 setProperty(n,'x',hold.x+39,3.5);assert.equal(n.blocks.length,count+1);assert.equal(n.blocks.at(-1).tracks.x.length,2);near(evaluated(n,3.5).x,hold.x+39);validate(clone(p));
});
test('direct putKey and Add Key enableTrack use the same bounded cut-edit route',()=>{
 for(const mode of ['put','enable']){const {p,n}=fixture(),before=clone(n),held=evaluated(n,3).x,key=mode==='put'?putKey(n,'x',3,held+30,'linear'):enableTrack(n,'x',3,'linear');
  assert.equal(key.time,3);assert.equal(n.blocks.at(-1).start,3);assert.equal(n.blocks.at(-1).end,4);assert.deepEqual(n.tracks,before.tracks);
  if(mode==='enable'){near(evaluated(n,3).x,held);setProperty(n,'x',held+30,3);assert.equal(n.blocks.at(-1).tracks.x.length,1);}near(evaluated(n,3).x,held+30);near(evaluated(n,2.9).x,evaluated(before,2.9).x);near(evaluated(n,4).x,evaluated(before,4).x);validate(clone(p));
 }
});
test('an unchanged held parameter stays untracked during a one-axis drag while explicit Add Key records it',()=>{
 const {p,n}=fixture(),held=evaluated(n,3),before=clone(n);configureAutoKey(p,true);setProperty(n,'y',held.y,3);assert.deepEqual(n,before);
 setProperty(n,'x',held.x+25,3);setProperty(n,'y',held.y,3);assert.equal(n.blocks.length,before.blocks.length+1);assert.deepEqual(n.blocks.at(-1).props,['x']);assert.deepEqual(Object.keys(n.blocks.at(-1).tracks),['x']);near(evaluated(n,3).y,held.y);
 enableTrack(n,'y',3);assert.deepEqual(n.blocks.at(-1).props,['x','y']);assert.equal(n.blocks.at(-1).tracks.y[0].value,held.y);assert.equal(n.blocks.length,before.blocks.length+1);validate(clone(p));
});
test('editing a cut-only imported parameter with AutoKey off does not alter its base outside the cut',()=>{
 const p=project(),n=object('rectangle',{x:5});p.layers=[n];n.blocks=[];n.blockCuts=[{start:1,end:4,values:{x:50,y:20}}];configureAutoKey(p,false);setProperty(n,'x',75,2);
 near(evaluated(n,2).x,75);near(evaluated(n,1.9).x,50);near(evaluated(n,4).x,5);assert.equal(n.x,5);assert.deepEqual(n.tracks,{});assert.equal(n.blocks[0].tracks.x.length,1);validate(clone(p));
});
test('an edit stops at later cut or animation boundaries without stealing their parameter values',()=>{
 const p=project(),n=object('rectangle');p.layers=[n];n.blockCuts=[{start:1,end:5,values:{x:10,y:20}},{start:3,end:4,values:{x:30}}];n.blocks=[{id:'later',name:'Later',kind:'animation',start:2.5,end:3,props:['x'],tracks:{x:[{id:'later-x',time:2.5,value:90,easing:'hold'}]}}];
 const before=clone(n);putKey(n,'x',2,50,'linear');assert.equal(n.blocks.at(-1).end,2.5);near(evaluated(n,2.25).x,50);
 for(const t of [1,1.9,2.5,2.75,3,3.5,4,4.5,5])near(evaluated(n,t).x,evaluated(before,t).x);near(evaluated(n,2.25).y,20);validate(clone(p));
 const other=object('rectangle');other.blockCuts=[{start:1,end:5,values:{x:10}},{start:3,end:4,values:{x:30}}];putKey(other,'x',2,50);assert.equal(other.blocks[0].end,3);near(evaluated(other,3).x,30);
});
test('overlapping parameter overrides keep their own track writers and activeTracks mirrors evaluation',()=>{
 const p=project(),n=object('rectangle');p.layers=[n];n.blockCuts=[{start:1,end:4,values:{x:10}},{start:1,end:3,values:{y:20}}];putKey(n,'x',2,50,'linear');putKey(n,'y',2,70,'linear');assert.equal(n.blocks.length,2);
 const x=n.blocks[0],y=n.blocks[1];assert.equal(x.end,4);assert.equal(y.end,3);assert.deepEqual(Object.keys(x.tracks),['x']);assert.deepEqual(Object.keys(y.tracks),['y']);setProperty(n,'x',90,2.5);setProperty(n,'y',100,2.5);
 assert.deepEqual(Object.keys(y.tracks),['y']);assert.equal(x.tracks.x.length,2);assert.equal(y.tracks.y.length,2);assert.equal(activeTracks(n,2.5).x,x.tracks.x);assert.equal(activeTracks(n,2.5).y,y.tracks.y);near(evaluated(n,2.5).x,90);near(evaluated(n,2.5).y,100);near(evaluated(n,3).x,90);near(evaluated(n,3).y,0);validate(clone(p));
});
test('existing active block tracks already override cuts and retain ordinary in-block key routing',()=>{
 const {p,n}=fixture();const before=clone(n),block=n.blocks[0];n.blockCuts.push({start:1,end:2,values:{x:500}});putKey(n,'x',1.5,300,'linear');assert.equal(n.blocks.length,1);assert.equal(block.tracks.x.find(k=>k.time===1.5).value,300);near(evaluated(n,1.5).x,300);assert.deepEqual(n.tracks,before.tracks);validate(clone(p));
});
test('history undo restores all original cuts and tracks and JSON reload retains the bounded edit',()=>{
 let {p,n}=fixture();const before=clone(p),h=new History(()=>p,value=>p=value);h.run('Edit held range',()=>setProperty(n,'x',300,3));const saved=validate(JSON.parse(JSON.stringify(p)));near(evaluated(saved.layers[0],3).x,300);near(evaluated(saved.layers[0],2.9).x,evaluated(before.layers[0],2.9).x);h.undo();assert.deepEqual(p,before);h.redo();near(evaluated(p.layers[0],3).x,300);
});
