const widthKey='poppy-properties-width';
export function inspectorBounds(viewportWidth,railWidth=64){
 const viewport=Math.max(0,Number(viewportWidth)||0),available=Math.max(44,viewport-railWidth-(viewport>=700?328:24));
 const max=Math.min(520,available),min=Math.min(252,max);
 return {min,max};
}
export function inspectorWidth(preferred,bounds){return Math.max(bounds.min,Math.min(bounds.max,Number(preferred)||300));}
export function readInspectorWidth(storage){try{const width=Number(storage?.getItem(widthKey));return Number.isFinite(width)&&width>=100&&width<=2000?width:300;}catch{return 300;}}
export function bindInspectorResize(a){
 const handle=document.querySelector('#inspector-resize'),panel=document.querySelector('#properties-panel'),workspace=document.querySelector('.workspace'),rail=document.querySelector('.tools');if(!handle||!panel)return;
 let store;try{store=localStorage;}catch{}let preferred=readInspectorWidth(store),gesture=null,frame=null;
 const bounds=()=>inspectorBounds(window.innerWidth,rail?.getBoundingClientRect().width||64);
 const hitArea=()=>{const canvas=document.querySelector('#viewport')?.getBoundingClientRect(),edge=handle.getBoundingClientRect();if(canvas&&Number.isFinite(edge.top)&&Number.isFinite(edge.bottom)){handle.style.setProperty('--resize-hit-top',Math.max(0,canvas.top-edge.top)+'px');handle.style.setProperty('--resize-hit-bottom',Math.max(0,edge.bottom-canvas.bottom)+'px');}};
 const layout=()=>{if(frame!==null)return;frame=requestAnimationFrame(()=>{frame=null;a.stage?.layout?.();hitArea();});};
 const apply=()=>{const limits=bounds(),width=inspectorWidth(preferred,limits);panel.style.width=width+'px';workspace?.style.setProperty('--inspector-width',width+'px');handle.setAttribute('aria-valuemin',limits.min);handle.setAttribute('aria-valuemax',limits.max);handle.setAttribute('aria-valuenow',Math.round(width));handle.setAttribute('aria-valuetext',Math.round(width)+' pixels wide');layout();return width;};
 const save=()=>{try{store?.setItem(widthKey,String(preferred));}catch{}};
 const end=cancel=>{if(!gesture)return;const old=gesture;gesture=null;handle.classList.remove('resizing');if(cancel){preferred=old.preferred;apply();}else save();if(handle.hasPointerCapture?.(old.id))handle.releasePointerCapture(old.id);};
 const sync=()=>{const open=panel.classList.contains('open');handle.hidden=!open;if(!open)end(true);apply();};
 handle.addEventListener('pointerdown',e=>{if(e.button!==0||gesture||handle.hidden)return;e.preventDefault();a.properties?.flush();gesture={id:e.pointerId,x:e.clientX,width:apply(),preferred};handle.setPointerCapture(e.pointerId);handle.classList.add('resizing');});
 handle.addEventListener('pointermove',e=>{if(gesture?.id!==e.pointerId)return;e.preventDefault();preferred=inspectorWidth(gesture.width+gesture.x-e.clientX,bounds());apply();});
 handle.addEventListener('pointerup',e=>{if(gesture?.id===e.pointerId)end(false);});
 handle.addEventListener('pointercancel',e=>{if(gesture?.id===e.pointerId)end(true);});
 handle.addEventListener('lostpointercapture',()=>end(true));
 handle.addEventListener('keydown',e=>{if(e.key==='Escape'&&gesture){e.preventDefault();end(true);return;}const limits=bounds(),step=e.shiftKey?64:16,current=inspectorWidth(preferred,limits);let next;if(e.key==='ArrowLeft')next=current+step;else if(e.key==='ArrowRight')next=current-step;else if(e.key==='Home')next=limits.min;else if(e.key==='End')next=limits.max;else return;e.preventDefault();preferred=inspectorWidth(next,limits);apply();save();});
 window.addEventListener('resize',()=>{end(true);apply();});window.addEventListener('blur',()=>end(true));
 if(typeof MutationObserver!=='undefined')new MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['class']});sync();
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(hitArea).observe(workspace||panel);
}
