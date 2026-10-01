import {evaluated,setProperty} from '../animation/evaluate.js';
import {clone} from '../document/model.js';
import {parsePath} from './svg-path.js';
const K=.5522847498307936;
export function shapeNodes(kind,w,h,sides=6,inner=.45){
 if(kind==='ellipse')return [{x:w,y:h/2,in:{x:w,y:h/2-h*K/2},out:{x:w,y:h/2+h*K/2}},{x:w/2,y:h,in:{x:w/2+w*K/2,y:h},out:{x:w/2-w*K/2,y:h}},{x:0,y:h/2,in:{x:0,y:h/2+h*K/2},out:{x:0,y:h/2-h*K/2}},{x:w/2,y:0,in:{x:w/2-w*K/2,y:0},out:{x:w/2+w*K/2,y:0}}];
 if(kind==='rectangle')return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
 if(kind==='line')return [{x:0,y:0},{x:w,y:h}];
 const count=kind==='star'?sides*2:sides;
 return Array.from({length:count},(_,i)=>{const r=kind==='star'&&i%2?inner:1,t=-Math.PI/2+i*Math.PI*2/count;return {x:w/2+Math.cos(t)*w/2*r,y:h/2+Math.sin(t)*h/2*r};});
}
export function convertToPath(n){
 if(n.type==='group'||n.type==='text')throw Error(n.type==='group'?'Use Direct select to edit a shape inside this group.':'Text is editable with the Content and Font controls.');
 if(n.rawPath){n.nodes=parsePath(n.rawPath);delete n.rawPath;n.closed=false;return n;}
 if(n.type==='path'||n.type==='freehand')return n;
 if(n.type==='rectangle'&&n.radius){const w=n.width,h=n.height,r=Math.min(n.radius,w/2,h/2),k=K*r;n.nodes=[{x:r,y:0},{x:w-r,y:0,out:{x:w-r+k,y:0}},{x:w,y:r,in:{x:w,y:r-k}},{x:w,y:h-r,out:{x:w,y:h-r+k}},{x:w-r,y:h,in:{x:w-r+k,y:h}},{x:r,y:h,out:{x:r-k,y:h}},{x:0,y:h-r,in:{x:0,y:h-r+k}},{x:0,y:r,out:{x:0,y:r-k}}];n.nodes[0].in={x:r-k,y:0};}
 else n.nodes=shapeNodes(n.type,n.width,n.height);
 n.type='path';n.closed=true;delete n.radius;return n;
}
export function splitSegment(n,index,time){
 if(n.rawPath)throw Error('Convert this SVG path before editing its points.');
 const v=evaluated(n,time),nodes=clone(v.nodes),a=nodes[index],next=(index+1)%nodes.length,b=nodes[next];
 if(!b||a.close||b.move||(!n.closed&&next===0))throw Error('Select a point with a following segment.');
 const mix=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});let mid;
 if(a.out||b.in){const ab=mix(a,a.out||a),bc=mix(a.out||a,b.in||b),cd=mix(b.in||b,b),abc=mix(ab,bc),bcd=mix(bc,cd);mid={...mix(abc,bcd),in:abc,out:bcd};a.out=ab;b.in=cd;}else mid=mix(a,b);
 nodes.splice(index+1,0,mid);setProperty(n,'nodes',nodes,time);return index+1;
}
export function editNode(n,index,action,time){
 const nodes=clone(evaluated(n,time).nodes),p=nodes[index];if(!p)throw Error('Tap a path point first.');
 if(action==='delete'){if(nodes.length<=(n.closed?3:2))throw Error('Keep at least '+(n.closed?3:2)+' points.');nodes.splice(index,1);}
 else if(action==='corner'){delete p.in;delete p.out;}
 else {const prev=nodes[(index-1+nodes.length)%nodes.length],next=nodes[(index+1)%nodes.length],dx=next.x-prev.x,dy=next.y-prev.y,len=Math.hypot(dx,dy)||1,r=Math.min(Math.hypot(p.x-prev.x,p.y-prev.y),Math.hypot(next.x-p.x,next.y-p.y))/3;p.in={x:p.x-dx/len*r,y:p.y-dy/len*r};p.out={x:p.x+dx/len*r,y:p.y+dy/len*r};}
 setProperty(n,'nodes',nodes,time);
}
