import {object} from '../document/model.js';

export const VIDEO_REFERENCE_LIMITS={seconds:10,frames:600,fileBytes:250*1024*1024,frameBytes:40*1024*1024,maxDimension:768};
const abort=()=>new DOMException('Video import cancelled.','AbortError');
const check=signal=>{if(signal?.aborted)throw abort();};

export function videoReferencePlan(project,source,{sourceStart=0,duration=2,start=0,fps=12,maxDimension=512}={}){
 for(const [name,value] of Object.entries({sourceDuration:source.duration,width:source.width,height:source.height,sourceStart,duration,start,fps,maxDimension}))if(!Number.isFinite(value))throw Error(`Invalid video ${name}.`);
 if(source.duration<=0||source.width<1||source.height<1)throw Error('The video has no readable duration or picture. Try an MP4 supported by this browser.');
 if(![12,24].includes(fps)||maxDimension<64||maxDimension>VIDEO_REFERENCE_LIMITS.maxDimension)throw Error('Choose 12 or 24 fps and a reference size from 64 to 768 pixels.');
 if(sourceStart<0||sourceStart>=source.duration||duration<=0||duration>VIDEO_REFERENCE_LIMITS.seconds||sourceStart+duration>source.duration+1e-6)throw Error('Choose a clip of up to 10 seconds within the source video.');
 if(start<0||start>600||!Number.isFinite(project.fps)||project.fps<=0)throw Error('Choose a valid timeline start.');
 const frameCount=Math.floor(duration*fps+1e-7),seconds=frameCount/fps;
 if(!frameCount||frameCount>VIDEO_REFERENCE_LIMITS.frames)throw Error('Choose at least one reference frame and no more than 600.');
 start=Math.round(start*project.fps)/project.fps;
 if(start+seconds>600+1e-7)throw Error('This clip would extend the composition beyond 10 minutes.');
 const scale=Math.min(1,maxDimension/Math.max(source.width,source.height));
 return {sourceStart,duration:seconds,start,fps,frameCount,width:Math.max(1,Math.round(source.width*scale)),height:Math.max(1,Math.round(source.height*scale)),sourceDuration:source.duration};
}

export function videoReferenceLayer(project,plan,{frames,sourceName='Imported video',exportIncluded=false}={}){
 if(!Array.isArray(frames)||frames.length!==plan.frameCount||frames.some(src=>typeof src!=='string'||!/^data:image\/png;base64,/.test(src)))throw Error('The baked video frame count or format is invalid.');
 const fit=Math.min(1,project.width*.8/plan.width,project.height*.8/plan.height),width=plan.width*fit,height=plan.height*fit;
 return object('image',{name:String(sourceName).slice(0,150)+' · video reference',width,height,x:(project.width-width)/2,y:(project.height-height)/2,fill:'none',locked:true,opacity:.55,reference:true,exportIncluded,
  referenceFrames:{kind:'video',motion:'video',rotation:0,start:plan.start,duration:plan.duration,fps:plan.fps,frames,sourceName:String(sourceName).slice(0,250),sourceStart:plan.sourceStart,sourceDuration:plan.sourceDuration,width:plan.width,height:plan.height}});
}

function mediaEvent(video,event,{signal,timeout=20000,ready}={}){
 check(signal);if(ready?.())return Promise.resolve();
 return new Promise((resolve,reject)=>{
  let timer;const cleanup=()=>{clearTimeout(timer);video.removeEventListener(event,success);video.removeEventListener('error',failed);signal?.removeEventListener('abort',cancel);};
  const success=()=>{cleanup();resolve();},failed=()=>{cleanup();reject(Error('This browser cannot decode the video. Try an H.264 MP4 or another supported clip.'));},cancel=()=>{cleanup();reject(abort());};
  video.addEventListener(event,success,{once:true});video.addEventListener('error',failed,{once:true});signal?.addEventListener('abort',cancel,{once:true});
  timer=setTimeout(()=>{cleanup();reject(Error('Video decoding timed out. Try a shorter MP4 clip.'));},timeout);
 });
}
export function loadVideoMetadata(video,options={}){return mediaEvent(video,'loadedmetadata',{...options,ready:()=>video.readyState>=1&&Number.isFinite(video.duration)&&video.duration>0});}
const presentationTick=()=>new Promise(resolve=>{const timer=setTimeout(resolve,100);if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>{clearTimeout(timer);resolve();});});
export async function seekVideoFrame(video,time,{signal,timeout=20000,settle=presentationTick}={}){
 check(signal);video.pause();
 if(video.readyState<2)await mediaEvent(video,'loadeddata',{signal,timeout,ready:()=>video.readyState>=2});
 if(video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-time)<1e-6){await settle();check(signal);return;}
 // Register before assigning currentTime: very short clips can seek immediately.
 const ready=mediaEvent(video,'seeked',{signal,timeout});video.currentTime=time;await ready;
 if(video.readyState<2)await mediaEvent(video,'loadeddata',{signal,timeout,ready:()=>video.readyState>=2});
 // seeked denotes a decoded current frame; allow presentation to settle before
 // drawImage. No playback clock or requestAnimationFrame frame counting is used.
 await settle();check(signal);
}

export async function bakeVideoFrames(video,plan,{signal,onProgress=()=>{},seek=seekVideoFrame,createCanvas=()=>document.createElement('canvas'),yieldControl=()=>new Promise(resolve=>setTimeout(resolve,0)),byteLimit=VIDEO_REFERENCE_LIMITS.frameBytes}={}){
 check(signal);const canvas=createCanvas();canvas.width=plan.width;canvas.height=plan.height;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas image capture is unavailable.');
 const frames=[];let bytes=0;
 try{for(let frame=0;frame<plan.frameCount;frame++){
  check(signal);const time=plan.sourceStart+frame/plan.fps;await seek(video,time,{signal});check(signal);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const image=canvas.toDataURL('image/png');if(!image.startsWith('data:image/png;base64,'))throw Error('The browser could not capture this video frame.');
  bytes+=image.length;if(bytes>byteLimit)throw Error('Reference frames exceed 40 MB. Choose a shorter clip, 12 fps, or a smaller picture.');
  frames.push(image);onProgress({completed:frame+1,total:plan.frameCount,time,bytes});await yieldControl();
 }check(signal);return frames;}finally{canvas.width=canvas.height=1;}
}

export function showVideoReference(a){
 a.pause();a.properties.flush();a.stage.finishPath();
 const d=a.dialog('Import film reference',`<p>Choose a local film to trace. Bake a short clip into reference frames that follow the playhead and travel with your saved project.</p><label>Video file<input data-video-file type="file" accept="video/*,.mp4,.mov,.webm,.m4v"></label><video data-video-preview muted playsinline controls preload="auto" style="width:100%;height:240px;object-fit:contain;background:#111"></video><div class="dialog-grid"><label>Source start (seconds)<input data-video-source-start type="number" min="0" step=".01" value="0"></label><label>Clip length (seconds)<input data-video-duration type="number" min=".042" max="10" step=".01" value="2"></label><label>Reference frame rate<select data-video-fps><option value="12">12 fps · smaller project</option><option value="24">24 fps · smoother motion</option></select></label><label>Longest picture side<select data-video-size><option value="384">384 px</option><option value="512" selected>512 px</option><option value="768">768 px</option></select></label><label>Insert at<select data-video-start><option value="playhead">Playhead (${a.time.toFixed(3)}s)</option><option value="zero">Composition start</option></select></label><label>Reference opacity<input data-video-opacity type="number" min=".05" max="1" step=".05" value=".55"></label></div><label>Source position<input data-video-scrub type="range" min="0" max="1" step=".01" value="0" disabled></label><label><input data-video-export type="checkbox"> Include reference in exports</label><p class="subtle">Processing stays on this device. This imports pictures, without film audio or background removal. Frames retain the source background; lower opacity helps tracing. The original video is not kept after baking.</p><p data-video-status role="status" aria-live="polite">Choose a video file. MP4 support depends on your browser's codecs.</p><progress data-video-progress max="1" value="0" hidden style="width:100%"></progress><div class="dialog-actions"><button data-video-cancel>Cancel</button><button data-video-bake class="primary" disabled>Bake film reference</button></div>`);
 const video=d.querySelector('[data-video-preview]'),status=d.querySelector('[data-video-status]'),bake=d.querySelector('[data-video-bake]'),scrub=d.querySelector('[data-video-scrub]');
 const field=name=>d.querySelector(`[data-video-${name}]`);let source,file,url,controller,loading=false,baking=false,closed=false;
 const dispose=()=>{controller?.abort();video.pause();video.removeAttribute('src');video.load();if(url)URL.revokeObjectURL(url);url=null;};
 const settings=()=>({sourceStart:Number(field('source-start').value),duration:Number(field('duration').value),fps:Number(field('fps').value),maxDimension:Number(field('size').value),start:field('start').value==='zero'?0:a.time});
 const summary=()=>{if(!source)return;try{const p=videoReferencePlan(a.doc,source,settings());status.textContent=`${p.duration.toFixed(3)}s · ${p.frameCount} frames · ${p.width} × ${p.height} · inserted at ${p.start.toFixed(3)}s. Reference pictures only.`;bake.disabled=false;}catch(e){status.textContent=e.message;bake.disabled=true;}};
 for(const name of ['source-start','duration','fps','size','start'])field(name).onchange=()=>{summary();if(name==='source-start'&&source&&!baking){video.pause();video.currentTime=Math.max(0,Math.min(source.duration-.001,Number(field(name).value)||0));}};
 field('file').onchange=async()=>{
  const chosen=field('file').files?.[0];if(!chosen)return;dispose();source=null;file=chosen;bake.disabled=true;scrub.disabled=true;controller=new AbortController();const own=controller;loading=true;
  try{if(chosen.size>VIDEO_REFERENCE_LIMITS.fileBytes)throw Error('Choose a local video smaller than 250 MB.');status.textContent='Reading video…';url=URL.createObjectURL(chosen);video.src=url;video.load();await loadVideoMetadata(video,{signal:own.signal});if(closed||controller!==own)return;
   source={duration:video.duration,width:video.videoWidth,height:video.videoHeight};if(!Number.isFinite(source.duration)||source.duration<=0||!source.width||!source.height)throw Error('This video has no readable picture or duration.');
   field('source-start').value=0;field('source-start').max=source.duration;field('duration').value=Math.max(1/12,Math.min(2,Math.floor(source.duration*12)/12));scrub.max=source.duration;scrub.value=0;scrub.disabled=false;summary();
  }catch(e){if(e.name!=='AbortError'){status.textContent=e.message;source=null;}}finally{if(controller===own)loading=false;}
 };
 scrub.oninput=()=>{if(!source||baking)return;video.pause();video.currentTime=Math.max(0,Math.min(source.duration-.001,Number(scrub.value)));};video.ontimeupdate=()=>{if(!baking)scrub.value=video.currentTime;};
 field('cancel').onclick=()=>{controller?.abort();if(!baking)d.close();else status.textContent='Cancelling video import…';};
 d.addEventListener('cancel',()=>controller?.abort());d.addEventListener('close',()=>{closed=true;dispose();},{once:true});
 bake.onclick=async()=>{
  if(!source||loading||baking)return;let plan;try{plan=videoReferencePlan(a.doc,source,settings());}catch(e){status.textContent=e.message;return;}
  const opacity=Number(field('opacity').value);if(!Number.isFinite(opacity)||opacity<.05||opacity>1){status.textContent='Choose reference opacity from 0.05 to 1.';return;}
  baking=true;video.pause();controller=new AbortController();const own=controller,projectId=a.doc.id,progress=field('progress');progress.hidden=false;progress.value=0;
  d.querySelectorAll('input,select,button').forEach(el=>el.disabled=el!==field('cancel'));video.controls=false;
  try{const frames=await bakeVideoFrames(video,plan,{signal:own.signal,onProgress:p=>{progress.value=p.completed/p.total;status.textContent=`Baking ${p.completed} of ${p.total} frames · ${(p.bytes/1024/1024).toFixed(1)} MB`;}});check(own.signal);if(closed)return;if(a.doc.id!==projectId)throw Error('The project changed. Import the reference into the active project again.');
   const n=videoReferenceLayer(a.doc,plan,{frames,sourceName:file.name,exportIncluded:field('export').checked});n.opacity=opacity;a.mutate('Import film reference',()=>{a.doc.duration=Math.max(a.doc.duration,plan.start+plan.duration);a.doc.layers.unshift(n);a.selected=[n.id];});
   d.close();a.toast(`${frames.length} film frames saved as a locked reference layer. Draw above it; use the playhead to compare poses.`);
  }catch(e){if(!closed)status.textContent=e.name==='AbortError'?'Video import cancelled. No reference layer was added.':e.message;}
  finally{baking=false;if(!closed){d.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);video.controls=true;bake.disabled=!source;progress.hidden=true;}}
 };
 return d;
}
