import {motionBlurSamples} from '../animation/motion-blur.js';
import {lineNoiseActive,lineNoiseSettings} from './line-noise.js';
import {localBounds,matrix,corners,point,bounds} from './matrix.js';
import {evaluated} from '../animation/evaluate.js';
import {parsePath} from './svg-path.js';
export const shadowDefaults={shadowEnabled:false,shadowX:12,shadowY:12,shadowBlur:12,shadowOpacity:.35,shadowColor:'#000000'};
export const shadowFields={shadowX:'Horizontal offset (px)',shadowY:'Vertical offset (px)',shadowBlur:'Blur (px)',shadowOpacity:'Opacity (0–1)',shadowColor:'Shadow colour'};
export function shadowPaintBounds(n,time=0,preview,context={}){
 const v={...evaluated(n,time),...(preview?.get(n.id)||{})};let b;
 if(v.type==='group'){const pts=[];for(const child of n.children||[]){if(!child.visible)continue;const samples=context.suppressMotionBlur?[{time}]:motionBlurSamples({...child,...(preview?.get(child.id)||{})},time,context.fps,context.duration),childContext={...context,suppressMotionBlur:context.suppressMotionBlur||samples.length>1};for(const sample of samples){const c={...evaluated(child,sample.time),...(preview?.get(child.id)||{})},paint=shadowPaintBounds(child,sample.time,preview,childContext),extent=c.shadowEnabled&&c.shadowOpacity>0?shadowRegion(c,paint):paint;pts.push(...corners(extent).map(p=>point(matrix(c),p)));}}b=bounds(pts);}
 else {let shape={...v,tracks:{},blocks:[],blockCuts:[]};if(v.rawPath){try{shape={...shape,rawPath:undefined,nodes:parsePath(v.rawPath)};}catch{}}b=localBounds(shape);}
 const stroke=v.stroke!=='none'?Math.max(0,v.strokeWidth||0):0,pad=stroke*(v.lineJoin==='miter'?5:1)+1+(lineNoiseActive(v)?lineNoiseSettings(v).lineNoiseAmplitude*2:0);
 return {x:b.x-pad,y:b.y-pad,width:b.width+pad*2,height:b.height+pad*2};
}
export function shadowRegion(n,b=shadowPaintBounds(n)){
 const pad=Math.max(0,n.shadowBlur||0)*4+2,x=b.x-pad+Math.min(0,n.shadowX||0),y=b.y-pad+Math.min(0,n.shadowY||0);
 return {x,y,width:Math.max(1,b.width+pad*2+Math.abs(n.shadowX||0)),height:Math.max(1,b.height+pad*2+Math.abs(n.shadowY||0))};
}
export function shadowSVG(n,paintBounds){
 if(!n.shadowEnabled||n.shadowOpacity<=0)return {defs:'',attribute:''};
 const {x,y,width,height}=shadowRegion(n,paintBounds),id='shadow-'+n.id,region=`x="${x}" y="${y}" width="${width}" height="${height}"`;
 return {attribute:`filter="url(#${id})"`,defs:`<defs><filter id="${id}" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}" color-interpolation-filters="sRGB"><feGaussianBlur ${region} in="SourceAlpha" stdDeviation="${n.shadowBlur}" result="blur"/><feOffset ${region} in="blur" dx="${n.shadowX}" dy="${n.shadowY}" result="offset"/><feFlood ${region} flood-color="${n.shadowColor}" flood-opacity="${n.shadowOpacity}" result="colour"/><feComposite ${region} in="colour" in2="offset" operator="in" result="shadow"/><feMerge ${region}><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`};
}
