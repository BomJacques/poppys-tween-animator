import test from 'node:test';
import assert from 'node:assert/strict';
import {project} from '../dist/document/model.js';
import {referenceIndex} from '../dist/reference/puppet.js';
import {videoReferencePlan,videoReferenceLayer,seekVideoFrame,loadVideoMetadata,bakeVideoFrames} from '../dist/reference/video.js';
import {sceneSVG,artwork} from '../dist/renderer/svg.js';
import {portable,importPortable} from '../dist/persistence/store.js';
const source={duration:20,width:1920,height:1080},png=i=>'data:image/png;base64,'+Buffer.from(String(i)).toString('base64');
const tinyPlan=()=>videoReferencePlan(project(),source,{duration:.25,sourceStart:2,fps:12});
const fixture=()=>{const draws=[],canvas={width:0,height:0,getContext:()=>({clearRect(){},drawImage(v){draws.push(v.currentTime);}}),toDataURL:()=>png(draws.at(-1))};return {draws,canvas,video:{currentTime:0}};};

test('video plans sample a trimmed source on reference time, independently of project fps',()=>{
 const p=project(),plan=videoReferencePlan(p,source,{sourceStart:3.5,duration:2.03,start:1.13,fps:12});
 assert.equal(plan.frameCount,24);assert.equal(plan.duration,2);assert.equal(plan.start,27/24);assert.equal(plan.width,512);assert.equal(plan.height,288);
 const layer=videoReferenceLayer(p,plan,{frames:Array.from({length:24},(_,i)=>png(i)),sourceName:'Footwork.mp4'}),r=layer.referenceFrames;
 assert.equal(referenceIndex(r,r.start-.001),-1);assert.equal(referenceIndex(r,r.start),0);assert.equal(referenceIndex(r,r.start+1/24),0);assert.equal(referenceIndex(r,r.start+1/12),1);assert.equal(referenceIndex(r,r.start+r.duration-.0001),23);assert.equal(referenceIndex(r,r.start+r.duration),-1);
 assert.equal(layer.locked,true);assert.equal(layer.reference,true);assert.equal(layer.exportIncluded,false);assert.equal(r.kind,'video');assert.equal(r.sourceStart,3.5);
});

test('video plan rejects invalid source, trim, resolution, count, and timeline placement',()=>{
 const p=project();for(const settings of [{duration:11},{sourceStart:19,duration:2},{sourceStart:-1},{fps:60},{maxDimension:4096},{duration:.01},{start:599,duration:2}])assert.throws(()=>videoReferencePlan(p,source,settings));
 assert.throws(()=>videoReferencePlan(p,{...source,duration:Infinity}),/sourceDuration/);assert.throws(()=>videoReferencePlan(p,{...source,width:0}),/readable/);
 const small=videoReferencePlan(p,{duration:2,width:100,height:200},{duration:1});assert.equal(small.width,100);assert.equal(small.height,200);
});

test('baking captures exact source frame timestamps and reports progress without accumulating clock drift',async()=>{
 const f=fixture(),plan=tinyPlan(),progress=[];
 const frames=await bakeVideoFrames(f.video,plan,{seek:async(v,time)=>v.currentTime=time,createCanvas:()=>f.canvas,yieldControl:async()=>{},onProgress:p=>progress.push(p)});
 assert.deepEqual(f.draws,[2,2+1/12,2+2/12]);assert.deepEqual(frames,f.draws.map(png));assert.deepEqual(progress.map(p=>p.completed),[1,2,3]);assert.equal(progress[2].total,3);assert.equal(f.canvas.width,1);assert.equal(f.canvas.height,1);
});

test('cancelled bake returns no partial reference and releases canvas storage',async()=>{
 const f=fixture(),controller=new AbortController();
 await assert.rejects(()=>bakeVideoFrames(f.video,tinyPlan(),{signal:controller.signal,seek:async(v,time)=>v.currentTime=time,createCanvas:()=>f.canvas,yieldControl:async()=>{},onProgress:()=>controller.abort()}),{name:'AbortError'});
 assert.equal(f.draws.length,1);assert.equal(f.canvas.width,1);
});

test('bake catches frame storage overflow before returning or adding a layer',async()=>{
 const f=fixture();await assert.rejects(()=>bakeVideoFrames(f.video,tinyPlan(),{byteLimit:1,seek:async(v,time)=>v.currentTime=time,createCanvas:()=>f.canvas,yieldControl:async()=>{}}),/40 MB/);assert.equal(f.canvas.width,1);
 const plan=tinyPlan();assert.throws(()=>videoReferenceLayer(project(),plan,{frames:[png(0)]}),/frame count/);
});

class FakeVideo extends EventTarget{
 constructor(){super();this.readyState=2;this.duration=20;this.seeking=false;this._time=0;this.mode='seeked';this.paused=false;}
 pause(){this.paused=true;}
 get currentTime(){return this._time;}
 set currentTime(time){this._time=time;this.seeking=true;if(this.mode!=='never')queueMicrotask(()=>{this.seeking=false;this.dispatchEvent(new Event(this.mode));});}
}
test('seek capture waits for decoded seek completion and allows already decoded frame zero',async()=>{
 const video=new FakeVideo();let presented=0;const settle=async()=>{assert.equal(video.seeking,false);presented++;};
 await seekVideoFrame(video,0,{settle});assert.equal(presented,1);await seekVideoFrame(video,3.25,{settle});assert.equal(video.currentTime,3.25);assert.equal(video.paused,true);assert.equal(presented,2);
 await loadVideoMetadata(video);video.mode='error';await assert.rejects(()=>seekVideoFrame(video,4,{settle}),/cannot decode/);
});

test('seek supports abort and finite decode timeout',async()=>{
 const video=new FakeVideo();video.mode='never';const controller=new AbortController(),pending=seekVideoFrame(video,3,{signal:controller.signal,timeout:20,settle:async()=>{}});controller.abort();await assert.rejects(()=>pending,{name:'AbortError'});
 await assert.rejects(()=>seekVideoFrame(video,4,{timeout:10,settle:async()=>{}}),/timed out/);
});

test('video reference appears at playhead and is excluded from export unless requested',()=>{
 const p=project(),plan=tinyPlan();plan.start=1;const layer=videoReferenceLayer(p,plan,{frames:[png('first'),png('second'),png('third')]});p.layers=[layer];
 assert.equal(artwork(layer,.9),'');assert.match(artwork(layer,1),new RegExp(png('first').replace(/[+]/g,'\\+')));assert.match(artwork(layer,1+1/12+.001),new RegExp(png('second').replace(/[+]/g,'\\+')));
 assert.equal(sceneSVG(p,1).includes('<image'),false);layer.exportIncluded=true;assert.equal(sceneSVG(p,1).includes('<image'),true);
});

test('embedded video reference frames survive a portable project export and import',async()=>{
 const p=project(),plan=tinyPlan();p.layers=[videoReferenceLayer(p,plan,{frames:[png(0),png(1),png(2)],sourceName:'Local test.mp4'})];
 const file=await portable(p,new Map()),loaded=await importPortable(file);assert.deepEqual(loaded.project,p);assert.equal(loaded.assets.size,0);assert.equal(loaded.project.layers[0].referenceFrames.sourceName,'Local test.mp4');
});

test('metadata-only video loads its initial picture before same-position capture',async()=>{
 const video=new FakeVideo();video.readyState=1;video.mode='never';const pending=seekVideoFrame(video,0,{timeout:100,settle:async()=>{}});
 queueMicrotask(()=>{video.readyState=2;video.dispatchEvent(new Event('loadeddata'));});await pending;assert.equal(video.currentTime,0);assert.equal(video.seeking,false);
});
