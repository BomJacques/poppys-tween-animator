import {find,isLocked} from '../document/model.js';
import {escape} from '../renderer/svg.js';
import {localBounds} from '../scene/matrix.js';
import {movePivot} from '../scene/pivot.js';
import {createRubberHose} from '../scene/rubberhose.js';
export function showObjectMenu(a,id=a.selected[0],position){
 const n=find(a.doc,id);if(!n)return;a.properties.flush();a.pause();a.selected=[id];a.keyIds.clear();a.render();const locked=isLocked(a.doc,id);
 const group=(name,body)=>'<section class="object-context-group" aria-label="'+name+'"><h3>'+name+'</h3><div>'+body+'</div></section>';
 const d=a.dialog(escape(n.name),'<div class="object-context-commands">'+group('Clipboard',`<button data-object-command="copy">Copy</button><button data-object-command="paste" ${!a.objectClipboard?.length?'disabled':''}>Paste</button>`)+group('Appearance',`<button data-object-command="colour" ${locked?'disabled':''}>Colour…</button><button data-object-command="blur" ${locked?'disabled':''}>Motion blur…</button>`)+group('Transform',`<button data-object-command="pivot" ${locked?'disabled':''}>Edit pivot</button>`)+group('Selection',`<button data-object-command="duplicate" ${locked?'disabled':''}>Duplicate</button><button data-object-command="delete" ${locked?'disabled':''}>Delete</button>`)+'</div>');d.classList.add('object-context-dialog');
 for(const b of d.querySelectorAll('[data-object-command]'))b.onclick=()=>{const action=b.dataset.objectCommand;d.close();requestAnimationFrame(()=>{if(action==='copy')a.copyObjects();if(action==='paste')a.pasteObjects();if(action==='colour')a.showObjectColour(id);if(action==='blur')a.showMotionBlur?.(id);if(action==='pivot')a.stage.beginPivotMode();if(action==='duplicate')document.querySelector('#duplicate').click();if(action==='delete')a.deleteSelection();});};return d;
}
export function bindObjectCommands(a){
 a.showObjectMenu=(id,position)=>showObjectMenu(a,id,position);
 a.addRubberHose=()=>a.mutate('Add rubber hose',()=>{const n=createRubberHose({x:a.doc.width/2-110,y:a.doc.height/2-50,start:{x:0,y:80},bend:{x:110,y:0},end:{x:220,y:80},color:a.drawColor,width:24});a.doc.layers.push(n);a.selected=[n.id];a.tool='direct';a.nodeEdit=true;a.activeNode=1;a.pivotEdit=false;});
 document.querySelector('#context-bar').addEventListener('click',e=>{const b=e.target.closest('[data-object-colour]');if(b)return a.showObjectColour(a.selected[0],b.dataset.objectColour);if(e.target.closest('[data-object-pivot]')){a.pivotEdit?a.stage.endPivotMode():a.stage.beginPivotMode();}if(e.target.closest('[data-pivot-centre]')){const n=find(a.doc,a.selected[0]);if(!n||isLocked(a.doc,n.id))return;a.mutate('Centre pivot',()=>{const b=localBounds(n,a.time);movePivot(a.doc,n,{x:b.x+b.width/2,y:b.y+b.height/2},a.time);});}});
}
