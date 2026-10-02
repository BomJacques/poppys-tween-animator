// Blur is renderer metadata: evaluation never writes back to the document.
export const MOTION_BLUR_SAMPLE_COUNTS=[3,5,7,9,11];
export function hasLayerAnimation(n){
 const animated=tracks=>Object.values(tracks||{}).some(keys=>Array.isArray(keys)&&keys.length>0);
 return animated(n.tracks)||(n.blocks||[]).some(b=>animated(b.tracks))||(n.blockCuts||[]).some(c=>Object.keys(c.values||{}).length>0)||(n.referenceFrames?.frames?.length>1)||(n.children||[]).some(hasLayerAnimation);
}
export function motionBlurSettings(n){const value=n.motionBlur||{};return {enabled:value.enabled===true,shutterAngle:Number.isFinite(value.shutterAngle)?Math.max(0,Math.min(360,value.shutterAngle)):180,samples:MOTION_BLUR_SAMPLE_COUNTS.includes(value.samples)?value.samples:7};}
export function motionBlurSamples(n,time,fps=24,duration=600){
 fps=Number.isFinite(fps)&&fps>0?fps:24;duration=Number.isFinite(duration)&&duration>=0?duration:600;time=Number.isFinite(time)?Math.max(0,Math.min(duration,time)):0;
 const settings=motionBlurSettings(n);
 if(!settings.enabled||settings.shutterAngle===0||!hasLayerAnimation(n))return [{time,weight:1,center:true}];
 const exposure=settings.shutterAngle/(360*fps),middle=(settings.samples-1)/2,result=[];
 for(let i=0;i<settings.samples;i++){const t=Math.max(0,Math.min(duration,time+(i-middle)/(settings.samples-1)*exposure)),existing=result.find(s=>Math.abs(s.time-t)<1e-12);
  if(existing){existing.weight+=1/settings.samples;if(i===middle)existing.center=true;}else result.push({time:t,weight:1/settings.samples,center:i===middle});
 }
 const total=result.reduce((sum,s)=>sum+s.weight,0);return result.map(s=>({...s,weight:s.weight/total}));
}
