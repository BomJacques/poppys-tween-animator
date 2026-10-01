import {evaluated} from '../animation/evaluate.js';
export const identity=()=>[1,0,0,1,0,0];
export function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export const point=(m,p)=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
export function inverse(m){const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-10)throw Error('This object has zero scale. Set a nonzero scale in Properties before manipulating it.');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
export function matrix(n){const r=n.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),m=[c*n.scaleX,s*n.scaleX,-s*n.scaleY,c*n.scaleY,n.x,n.y];m[4]+=n.anchorX-m[0]*n.anchorX-m[2]*n.anchorY;m[5]+=n.anchorY-m[1]*n.anchorX-m[3]*n.anchorY;return multiply(n.prefix||identity(),m);}
export function world(p,id,time){let result=identity();const visit=(nodes,parent)=>{for(const n of nodes){const m=multiply(parent,matrix(evaluated(n,time)));if(n.id===id){result=m;return true;}if(visit(n.children||[],m))return true;}return false;};visit(p.layers,identity());return result;}
export function localBounds(n,time=0){n=evaluated(n,time);if(n.type==='group'){const pts=[];for(const c of n.children){const b=localBounds(c,time),m=matrix(evaluated(c,time));pts.push(...corners(b).map(p=>point(m,p)));}return bounds(pts);}if(n.type==='path'||n.type==='freehand'){if(n.rawPath)return {x:0,y:0,width:n.width,height:n.height};return bounds(n.nodes.flatMap(p=>[p,...[p.in,p.out].filter(Boolean)]));}return {x:0,y:0,width:n.width,height:n.height};}
export function corners(b){return [{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x+b.width,y:b.y+b.height},{x:b.x,y:b.y+b.height}];}
export function bounds(pts){if(!pts.length)return {x:0,y:0,width:1,height:1};const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
export function worldBounds(p,n,time){return bounds(corners(localBounds(n,time)).map(pt=>point(world(p,n.id,time),pt)));}
