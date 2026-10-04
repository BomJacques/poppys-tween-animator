export const timelineToolModes=['sequence','keys','audio'];
export function timelineToolMode(value){return timelineToolModes.includes(value)?value:'keys';}
export function nextTimelineToolMode(mode,key){const index=timelineToolModes.indexOf(timelineToolMode(mode));return timelineToolModes[key==='Home'?0:key==='End'?2:(index+(key==='ArrowLeft'?-1:1)+3)%3];}
export function bindTimelineWorkspace(a){
 const sequence=document.querySelector('.block-toolbar'),keys=document.querySelector('.timeline-toolbar'),audio=document.querySelector('.audio-toolbar');if(!sequence||!keys||!audio)return;
 const bar=document.createElement('div');bar.className='timeline-command-bar';sequence.before(bar);
 const tabs=document.createElement('nav');tabs.className='timeline-command-tabs';tabs.setAttribute('aria-label','Timeline tools');tabs.setAttribute('role','tablist');tabs.innerHTML=timelineToolModes.map((id,i)=>`<button id="timeline-tab-${id}" role="tab" aria-controls="timeline-tools-${id}" data-timeline-mode="${id}">${['Sequence','Keys','Audio'][i]}</button>`).join('');bar.append(tabs,sequence,keys,audio);
 const panels={sequence,keys,audio};for(const [tab,el] of Object.entries(panels)){el.id='timeline-tools-'+tab;el.setAttribute('role','tabpanel');el.setAttribute('aria-labelledby','timeline-tab-'+tab);}
 let mode='keys';try{mode=timelineToolMode(localStorage.getItem('poppy-timeline-tools'));}catch{}
 const select=(value,focus=false)=>{mode=timelineToolMode(value);for(const [id,panel] of Object.entries(panels))panel.hidden=id!==mode;bar.dataset.mode=mode;for(const b of tabs.querySelectorAll('button')){const active=b.dataset.timelineMode===mode;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;if(active&&focus)b.focus();}try{localStorage.setItem('poppy-timeline-tools',mode);}catch{}};
 tabs.onclick=e=>{const b=e.target.closest('[data-timeline-mode]');if(b)select(b.dataset.timelineMode);};tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(nextTimelineToolMode(mode,e.key),true);};
 // Recording can also start from Options. Keep the stop control in view.
 const record=document.querySelector('#record');if(record&&typeof MutationObserver!=='undefined'){new MutationObserver(()=>{const recording=record.classList.contains('recording');tabs.querySelector('[data-timeline-mode="audio"]').classList.toggle('recording',recording);if(recording){select('audio');if(a.sequenceHidden)document.querySelector('#toggle-sequence')?.click();}}).observe(record,{attributes:true,attributeFilter:['class']});}
 a.setTimelineToolMode=value=>select(value);select(mode);
}
