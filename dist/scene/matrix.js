import {evaluated} from '../animation/evaluate.js';
import {identity,multiply,point,inverse,matrix} from './affine.js';
export {identity,multiply,point,inverse,matrix} from './affine.js';
import {resolveSceneTransforms} from '../animation/path-follow.js';
export function world(p,id,time){let result=identity();const visit=(nodes,parent)=>{for(const n of nodes){if(n.pathFollow?.enabled){result=resolveSceneTransforms(p,time).get(id)?.world||identity();return true;}const m=multiply(parent,matrix(evaluated(n,time)));if(n.id===id){result=m;return true;}if(visit(n.children||[],m))return true;}return false;};visit(p.layers,identity());return result;}
export function localBounds(n,time=0,project,transforms){n=evaluated(n,time);if(n.type==='group'){if(project&&!transforms)transforms=resolveSceneTransforms(project,time);const pts=[];for(const c of n.children){const b=localBounds(c,time,project,transforms),m=transforms?.get(c.id)?.local||matrix(evaluated(c,time));pts.push(...corners(b).map(p=>point(m,p)));}return bounds(pts);}if(n.type==='path'||n.type==='freehand'){if(n.rawPath)return {x:0,y:0,width:n.width,height:n.height};return bounds(n.nodes.flatMap(p=>[p,...[p.in,p.out].filter(Boolean)]));}return {x:0,y:0,width:n.width,height:n.height};}
export function corners(b){return [{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x+b.width,y:b.y+b.height},{x:b.x,y:b.y+b.height}];}
export function bounds(pts){if(!pts.length)return {x:0,y:0,width:1,height:1};const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
export function worldBounds(p,n,time){return bounds(corners(localBounds(n,time,p)).map(pt=>point(world(p,n.id,time),pt)));}
