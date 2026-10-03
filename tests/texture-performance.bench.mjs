import {performance} from 'node:perf_hooks';
import {object} from '../dist/document/model.js';
import {artwork} from '../dist/renderer/svg.js';
import {PreviewImageAssets} from '../dist/scene/texture.js';
const src='data:image/png;base64,'+'AAAA'.repeat(512*1024),n=object('rectangle',{texture:{src,width:1024,height:1024,mode:'cover',scale:1,x:0,y:0},shadowEnabled:true,motionBlur:{enabled:true,shutterAngle:360,samples:7},tracks:{x:[{id:'a',time:0,value:0,easing:'linear'},{id:'b',time:5,value:500,easing:'linear'}]}}),assets=new PreviewImageAssets();assets.begin();assets.href(src);const frames=60;
function measure(short){let bytes=0;const start=performance.now();for(let i=0;i<frames;i++){if(short)assets.begin();const markup=artwork(n,1+i/24,false,false,undefined,{fps:24,duration:5,...(short?{imageHref:s=>assets.href(s)}:{})});bytes+=Buffer.byteLength(markup);if(short)assets.sweep();}return {millisecondsPerFrame:(performance.now()-start)/frames,bytesPerFrame:bytes/frames};}
const embedded=measure(false),live=measure(true);console.log(JSON.stringify({frames,embedded,live,speedup:embedded.millisecondsPerFrame/live.millisecondsPerFrame,payloadReduction:embedded.bytesPerFrame/live.bytesPerFrame},null,2));assets.dispose();
