import {find,isLocked,clone} from '../document/model.js';
import {importTexture,textureModes} from '../scene/texture.js';
export function beginTexturePreview(a,id,texture){
 a.properties.flush();a.stage.finishPath();a.pause();clearTimeout(a.saveTimer);a.history.begin();
 const n=find(a.doc,id);if(!n||isLocked(a.doc,id)){a.history.cancel();throw Error('Choose an unlocked shape.');}
 n.texture=clone(texture);let settled=false;
 const preview=patch=>{if(settled)return;const current=find(a.doc,id);if(!current)throw Error('The selected shape is unavailable.');Object.assign(current.texture,patch);a.renderStage();};
 preview({});
 return {preview,apply(){if(settled)return;settled=true;a.history.commit('Image texture');a.render();},cancel(){if(settled)return;settled=true;a.history.cancel();a.scheduleSave?.();a.render();}};
}
export function showTexture(a){
 const n=find(a.doc,a.selected[0]);if(!n||isLocked(a.doc,n.id)||['text','group'].includes(n.type))return;
 if(a.audio?.recording||a.audio?.pending||a.audio?.finalizing)return a.toast('Stop recording before editing.');
 if(['path','freehand'].includes(n.type)&&!n.closed&&!n.rawPath&&!n.nodes.some(p=>p.close))return a.toast('Close the path before adding an image texture.');const open=texture=>{const session=beginTexturePreview(a,n.id,texture),d=a.dialog('Image texture',`<form class="texture-form"><p>Adjust the image on the canvas. Apply keeps one undo step; Cancel restores the previous texture.</p><div class="texture-modes" role="group" aria-label="Image fitting">${[['cover','Cover · crop'],['fit','Fit · whole image'],['stretch','Stretch'],['tile','Tile']].map(([mode,label])=>`<button type="button" data-texture-mode="${mode}" aria-pressed="${texture.mode===mode}" class="${texture.mode===mode?'active':''}">${label}</button>`).join('')}</div><label>Scale <output data-texture-scale-output>${Math.round(texture.scale*100)}%</output><input data-texture="scale" type="range" min=".05" max="4" step=".01" value="${texture.scale}" aria-label="Texture scale"></label><div class="dialog-grid"><label>Position X (px)<input data-texture="x" type="number" min="-8192" max="8192" step="1" value="${texture.x}"></label><label>Position Y (px)<input data-texture="y" type="number" min="-8192" max="8192" step="1" value="${texture.y}"></label></div><div class="texture-position"><button type="button" data-texture-reset>Centre & reset scale</button><button type="button" data-texture-replace>Replace image</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp" data-texture-file hidden></div><p class="subtle">Images are embedded in the project as PNG, up to 2048 px. No external image address is stored.</p><div class="dialog-actions"><button type="button" data-close>Cancel</button><button type="submit" class="primary">Apply texture</button></div></form>`);
  d.classList.add('texture-dialog');const form=d.querySelector('form'),inputs=[...d.querySelectorAll('[data-texture]')],update=()=>{const current=find(a.doc,n.id).texture;for(const b of d.querySelectorAll('[data-texture-mode]')){const active=b.dataset.textureMode===current.mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);}d.querySelector('[data-texture-scale-output]').value=Math.round(current.scale*100)+'%';};
  form.onsubmit=e=>{e.preventDefault();session.apply();d.close();};
  d.addEventListener('close',()=>session.cancel(),{once:true});
  d.addEventListener('input',e=>{const key=e.target.dataset.texture;if(!key||e.target.value==='')return;const value=Number(e.target.value);if(!Number.isFinite(value))return;session.preview({[key]:key==='scale'?Math.max(.05,Math.min(4,value)):Math.max(-8192,Math.min(8192,value))});update();});
  d.querySelectorAll('[data-texture-mode]').forEach(b=>b.onclick=()=>{session.preview({mode:textureModes.includes(b.dataset.textureMode)?b.dataset.textureMode:'cover'});update();});
  d.querySelector('[data-texture-reset]').onclick=()=>{session.preview({x:0,y:0,scale:1});inputs.forEach(input=>input.value=input.dataset.texture==='scale'?1:0);update();};
  const input=d.querySelector('[data-texture-file]');d.querySelector('[data-texture-replace]').onclick=()=>input.click();input.onchange=()=>a.safe(async()=>{if(input.files[0]){const imported=await importTexture(input.files[0]);if(!d.open)return;session.preview({src:imported.src,width:imported.width,height:imported.height});}});
 };
 if(n.texture)open(n.texture);else a.file('image/png,image/jpeg,image/webp,image/gif,image/avif,image/bmp',async file=>open(await importTexture(file)));
}
