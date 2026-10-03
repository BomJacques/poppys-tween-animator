import {find,isLocked} from '../document/model.js';
import {configureAutoKey} from '../animation/evaluate.js';
export class ImmediateColourSession{
 constructor(a,{ids,ownerId,label,apply}){this.a=a;this.ids=ids;this.ownerId=ownerId;this.label=label;this.applyValue=apply;this.doc=a.doc;this.time=a.time;this.selection=(a.selected||[]).join('|');this.closed=false;this.before=null;this.last=null;a.activeColourSession=this;}
 valid(){return !this.closed&&this.a.doc===this.doc&&this.a.time===this.time&&(this.a.selected||[]).join('|')===this.selection&&this.ids.some(id=>find(this.a.doc,id)&&!isLocked(this.a.doc,id));}
 update(colour,discrete=false){if(!this.valid())return false;const a=this.a;if(a.graphGestureActive||a.stage?.g?.edit||a.timeline?.g?.edit)return false;if(discrete)this.flush();if(this.before&&a.history.before!==this.before)this.before=null;if(!this.before){if(a.history.before)return false;a.properties?.flush();a.pause();a.history.begin();this.before=a.history.before;}configureAutoKey(a.doc,a.autoKey,a.ease);this.applyValue(colour,this.time);this.last=colour;a.renderStage();if(discrete)this.flush();return true;}
 flush(){if(!this.before)return;const own=this.a.history.before===this.before;this.before=null;if(own&&this.a.doc===this.doc){const changed=this.a.history.commit(this.label);if(changed&&this.last)this.a.rememberColor?.(this.last);}else if(own)this.a.history.before=null;this.last=null;}
 close(){if(this.closed)return;this.flush();this.closed=true;if(this.a.activeColourSession===this)this.a.activeColourSession=null;}
}
export function bindImmediateColour(a,d,session){
 const flush=()=>session.flush(),close=()=>{session.close();d.close();};
 d.addEventListener('change',flush);d.addEventListener('focusout',flush);d.addEventListener('pointerup',e=>{if(e.target.matches?.('input[type=range]'))flush();});d.addEventListener('pointercancel',flush);
 d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}});
 const outside=e=>{if(!d.contains(e.target))close();},keys=e=>{if(!d.contains(e.target))close();},hidden=()=>{if(document.hidden)close();};
 document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',keys,true);document.addEventListener('visibilitychange',hidden,true);
 d.addEventListener('close',()=>{session.close();if(a.activeColourDialog===d)a.activeColourDialog=null;document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',keys,true);document.removeEventListener('visibilitychange',hidden,true);a.renderStage();},{once:true});
 d.querySelector('form')?.addEventListener('submit',e=>{e.preventDefault();flush();});
}
