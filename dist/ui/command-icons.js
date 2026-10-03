const paths={
 key:'M12 3 20 12 12 21 4 12Z M12 8v8 M8 12h8',
 next:'M4 5v14 M7 12h13 M15 7l5 5-5 5',
 presets:'M3 17c4 0 3-10 7-10s3 10 7 10h4 M17 3v4 M15 5h4',
 graph:'M4 3v17h17 M5 16c6 0 4-10 10-10s3 6 6 6',
 edit:'m5 15 10-10 4 4-10 10-5 1Z M13 7l4 4',
 copy:'M8 8h12v12H8Z M16 8V4H4v12h4',
 paste:'M9 5H5v16h14V5h-4 M9 3h6v5H9Z',
 delete:'M4 6h16 M9 6V3h6v3 M7 6l1 15h8l1-15 M10 10v7 M14 10v7',
 group:'M3 3h18v18H3Z M7 7h6v6H7Z M11 11h6v6h-6Z',
 ungroup:'M3 7V3h4 M17 3h4v4 M21 17v4h-4 M7 21H3v-4 M7 7h6v6H7Z M11 11h6v6h-6Z',
 fit:'M3 8V3h5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5 M8 8h8v8H8Z',
 uniform:'M5 5h14v14H5Z M5 2v3 M19 2v3 M2 5h3 M2 19h3',
 previous:'M17 4v16 M14 5l-7 7 7 7',
 forward:'M7 4v16 M10 5l7 7-7 7',
 razor:'M8 9 20 3 M8 15l12 6 M9 8l3 4-3 4 M8 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M8 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0'
};
export function commandIcon(name){if(!paths[name])return '';return `<svg class="command-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]}"/></svg>`;}
const commands={'add-key':'key','next-pose':'next','motion-presets':'presets','graph-editor':'graph','edit-key':'edit','copy-keys':'copy','paste-keys':'paste','delete-keys':'delete','copy-block':'copy','paste-block':'paste','split-block':'razor','remove-block':'delete','group':'group','ungroup':'ungroup','duplicate':'copy','delete':'delete','fit':'fit','uniform-size':'uniform','frame-back':'previous','frame-forward':'forward'};
export function iconForCommand(button){return commands[button.id]||(button.hasAttribute('data-add-key')?'key':button.hasAttribute('data-layer-graph')?'graph':null);}
export function decorateCommand(button){const name=iconForCommand(button);if(!name)return false;const label=button.textContent.replace(/^[\s●⌁✂‹›]+/u,'').trim();if(!label)return false;button.classList.add('command-with-icon');if(button.dataset.commandIcon===name&&button.querySelector('.command-label')?.textContent===label&&button.querySelector('.command-icon'))return false;button.dataset.commandIcon=name;const span=document.createElement('span');span.className='command-label';span.textContent=label;button.innerHTML=commandIcon(name);button.append(span);return true;}
export function bindCommandIcons(){
 const selector=Object.keys(commands).map(id=>'button#'+id).join(',')+',button[data-add-key],button[data-layer-graph]',watched=new WeakMap(),observers=new Set();
 const install=button=>{decorateCommand(button);if(watched.has(button)||typeof MutationObserver==='undefined')return;const observer=new MutationObserver(()=>decorateCommand(button));observer.observe(button,{childList:true,characterData:true,subtree:true});watched.set(button,observer);observers.add(observer);};
 document.querySelectorAll(selector).forEach(install);
 if(typeof MutationObserver==='undefined')return ()=>{};
 const additions=new MutationObserver(records=>{for(const record of records)for(const node of record.removedNodes){if(node.nodeType!==1||node.namespaceURI!=='http://www.w3.org/1999/xhtml'||node.isConnected)continue;const detach=button=>{const observer=watched.get(button);if(observer){observer.disconnect();observers.delete(observer);watched.delete(button);}};if(node.matches(selector))detach(node);node.querySelectorAll(selector).forEach(detach);}for(const record of records)for(const node of record.addedNodes){if(node.nodeType!==1||node.namespaceURI!=='http://www.w3.org/1999/xhtml'||node.closest?.('.command-with-icon'))continue;if(node.matches(selector))install(node);node.querySelectorAll(selector).forEach(install);}});additions.observe(document.body,{childList:true,subtree:true});return ()=>{additions.disconnect();observers.forEach(observer=>observer.disconnect());};
}
