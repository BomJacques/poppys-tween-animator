import {clone,uid,walk,locate,selectionRoots,isLocked} from '../document/model.js';
import {world,multiply,identity,inverse,point} from './matrix.js';

export function copyArtwork(project,ids,time=0){
 const roots=selectionRoots(project,ids);if(!roots.length)throw Error('Select artwork to copy.');
 return roots.map(n=>{const copied=clone(n),parent=locate(project,n.id).parent;if(parent)copied.prefix=multiply(world(project,parent.id,time),copied.prefix||identity());return copied;});
}
export function pasteArtwork(project,clipboard,offset=24){
 if(!clipboard?.length)throw Error('Copy artwork first.');
 let count=0;walk(project.layers,()=>count++);let incoming=0;walk(clipboard,()=>incoming++);if(count+incoming>3000)throw Error('Paste exceeds the 3000-layer limit.');
 const copies=clone(clipboard);
 walk(copies,n=>{n.id=uid();for(const tracks of [n.tracks,...(n.blocks||[]).map(b=>b.tracks).filter(Boolean)])for(const track of Object.values(tracks||{}))for(const k of track)k.id=uid();for(const b of n.blocks||[])b.id=uid();});
 for(const n of copies){n.name+=' copy';if(!n.reference)n.locked=false;const inv=inverse(n.prefix||identity()),zero=point(inv,{x:0,y:0}),delta=point(inv,{x:offset,y:offset}),shift={x:delta.x-zero.x,y:delta.y-zero.y};n.x+=shift.x;n.y+=shift.y;for(const tracks of [n.tracks,...(n.blocks||[]).map(b=>b.tracks).filter(Boolean)])for(const prop of ['x','y'])for(const k of tracks?.[prop]||[])k.value+=shift[prop];for(const cut of n.blockCuts||[])for(const prop of ['x','y'])if(typeof cut.values[prop]==='number')cut.values[prop]+=shift[prop];}
 project.layers.push(...copies);return copies;
}
export function bindObjectClipboard(a){
 a.copyObjects=()=>a.safe(()=>{a.properties.flush();a.stage.finishPath();a.objectClipboard=copyArtwork(a.doc,a.selected,a.time);a.clipboardKind='objects';a.pasteCount=0;a.render();a.toast(a.objectClipboard.length+' object'+(a.objectClipboard.length===1?'':'s')+' copied.');});
 a.cutObjects=()=>a.safe(()=>{const ids=selectionRoots(a.doc,a.selected).filter(n=>!isLocked(a.doc,n.id)).map(n=>n.id);if(!ids.length)throw Error('Select unlocked artwork to cut.');a.objectClipboard=copyArtwork(a.doc,ids,a.time);a.clipboardKind='objects';a.pasteCount=0;a.mutate('Cut artwork',()=>{for(const id of ids){const entry=locate(a.doc,id);entry.list.splice(entry.index,1);}a.selected=[];a.keyIds.clear();});});
 a.pasteObjects=()=>a.safe(()=>{a.mutate('Paste artwork',()=>{const copies=pasteArtwork(a.doc,a.objectClipboard,24*((a.pasteCount||0)+1));a.pasteCount=(a.pasteCount||0)+1;a.selected=copies.map(n=>n.id);a.keyIds.clear();a.tool='select';a.nodeEdit=false;});});
}
