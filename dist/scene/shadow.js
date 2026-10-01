import {localBounds} from './matrix.js';
export const shadowDefaults={shadowEnabled:false,shadowX:12,shadowY:12,shadowBlur:12,shadowOpacity:.35,shadowColor:'#000000'};
export const shadowFields={shadowX:'Horizontal offset (px)',shadowY:'Vertical offset (px)',shadowBlur:'Blur (px)',shadowOpacity:'Opacity (0–1)',shadowColor:'Shadow colour'};
export function shadowSVG(n){
 if(!n.shadowEnabled||n.type==='group'||n.shadowOpacity<=0)return {defs:'',attribute:''};
 const b=localBounds(n),pad=Math.max(n.strokeWidth*2,1)+n.shadowBlur*3+2,id='shadow-'+n.id;
 const x=b.x-pad+Math.min(0,n.shadowX),y=b.y-pad+Math.min(0,n.shadowY),width=b.width+pad*2+Math.abs(n.shadowX),height=b.height+pad*2+Math.abs(n.shadowY);
 return {attribute:`filter="url(#${id})"`,defs:`<defs><filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${n.shadowBlur}" result="blur"/><feOffset in="blur" dx="${n.shadowX}" dy="${n.shadowY}" result="offset"/><feFlood flood-color="${n.shadowColor}" flood-opacity="${n.shadowOpacity}" result="colour"/><feComposite in="colour" in2="offset" operator="in" result="shadow"/><feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`};
}
