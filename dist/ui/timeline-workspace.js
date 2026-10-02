export function timelineToolMode(value){return value==='sequence'?'sequence':'keys';}
export function bindTimelineWorkspace(a){
 const sequence=document.querySelector('.block-toolbar'),keys=document.querySelector('.timeline-toolbar');if(!sequence||!keys)return;
 const bar=document.createElement('div');bar.className='timeline-command-bar';sequence.before(bar);
 const tabs=document.createElement('nav');tabs.className='timeline-command-tabs';tabs.setAttribute('aria-label','Timeline tools');tabs.setAttribute('role','tablist');tabs.innerHTML='<button id="timeline-tab-sequence" role="tab" aria-controls="timeline-tools-sequence" data-timeline-mode="sequence">Sequence</button><button id="timeline-tab-keys" role="tab" aria-controls="timeline-tools-keys" data-timeline-mode="keys">Keys</button>';bar.append(tabs,sequence,keys);
 sequence.id='timeline-tools-sequence';keys.id='timeline-tools-keys';for(const [el,tab] of [[sequence,'sequence'],[keys,'keys']]){el.setAttribute('role','tabpanel');el.setAttribute('aria-labelledby','timeline-tab-'+tab);}
 let mode='keys';try{mode=timelineToolMode(localStorage.getItem('poppy-timeline-tools'));}catch{}
 const select=(value,focus=false)=>{mode=timelineToolMode(value);sequence.hidden=mode!=='sequence';keys.hidden=mode!=='keys';for(const b of tabs.querySelectorAll('button')){const active=b.dataset.timelineMode===mode;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;if(active&&focus)b.focus();}try{localStorage.setItem('poppy-timeline-tools',mode);}catch{}};
 tabs.onclick=e=>{const b=e.target.closest('[data-timeline-mode]');if(b)select(b.dataset.timelineMode);};tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();select(e.key==='Home'?'sequence':e.key==='End'?'keys':mode==='keys'?'sequence':'keys',true);};
 a.setTimelineToolMode=value=>select(value);select(mode);
}
