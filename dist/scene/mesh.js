import {extendMeshCoverage} from './mesh-coverage.js';
// A portable colour grid: geometry and colours stay in the project, pixels are derived.
export const colorRGB=c=>/^#[0-9a-f]{6}$/i.test(c)?[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)):/^#[0-9a-f]{3}$/i.test(c)?[...c.slice(1)].map(x=>parseInt(x+x,16)):[103,96,232];
export function createMesh(b,color='#6760e8',rows=3,cols=3){if(b.width<=0||b.height<=0)throw Error('Mesh shading needs a shape with width and height.');color='#'+colorRGB(color).map(v=>v.toString(16).padStart(2,'0')).join('');return {rows,cols,points:Array.from({length:rows*cols},(_,i)=>({x:b.x+b.width*(i%cols)/(cols-1),y:b.y+b.height*Math.floor(i/cols)/(rows-1),color:color==='none'?'#6760e8':color})),bounds:{...b}};}
const catmull=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function legacyMeshGeometry(mesh,row,col,u,v){const at=(r,c,key)=>mesh.points[Math.max(0,Math.min(mesh.rows-1,r))*mesh.cols+Math.max(0,Math.min(mesh.cols-1,c))][key];const result={};for(const key of ['x','y']){const samples=[-1,0,1,2].map(dr=>catmull(...[-1,0,1,2].map(dc=>at(row+dr,col+dc,key)),u));result[key]=catmull(...samples,v);}return result;}
export function meshKnots(mesh,axis){const count=axis==='rows'?mesh.rows:mesh.cols,value=axis==='rows'?mesh.rowKnots:mesh.colKnots;
 return Array.isArray(value)&&value.length===count&&value.every((v,i)=>Number.isFinite(v)&&(!i||v>value[i-1]))&&value[0]===0&&value.at(-1)===1?value:Array.from({length:count},(_,i)=>i/(count-1));
}
// Nonuniform Hermite curves retain tap-defined parameter spacing. Old saved
// meshes without knot arrays keep their original Catmull geometry.
function smoothAxis(get,knots,index,t){
 const span=knots[index+1]-knots[index],slope=i=>{const a=Math.max(0,i-1),b=Math.min(knots.length-1,i+1);return (get(b)-get(a))/(knots[b]-knots[a]);};
 const a=get(index),b=get(index+1),ma=slope(index)*span,mb=slope(index+1)*span;
 return (2*t**3-3*t*t+1)*a+(t**3-2*t*t+t)*ma+(-2*t**3+3*t*t)*b+(t**3-t*t)*mb;
}
function meshGeometry(mesh,row,col,u,v){
 if(!mesh.rowKnots||!mesh.colKnots)return legacyMeshGeometry(mesh,row,col,u,v);
 const rows=meshKnots(mesh,'rows'),cols=meshKnots(mesh,'cols'),result={};
 for(const key of ['x','y']){const cache=new Map(),sample=r=>{if(!cache.has(r))cache.set(r,smoothAxis(c=>mesh.points[r*mesh.cols+c][key],cols,col,u));return cache.get(r);};result[key]=smoothAxis(sample,rows,row,v);}return result;
}
export function meshSample(mesh,row,col,u,v,geometryOnly=false){const p=[mesh.points[row*mesh.cols+col],mesh.points[row*mesh.cols+col+1],mesh.points[(row+1)*mesh.cols+col],mesh.points[(row+1)*mesh.cols+col+1]],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],rgb=geometryOnly?[]:(mesh._rgb?[mesh._rgb[row*mesh.cols+col],mesh._rgb[row*mesh.cols+col+1],mesh._rgb[(row+1)*mesh.cols+col],mesh._rgb[(row+1)*mesh.cols+col+1]]:p.map(q=>colorRGB(q.color)));if(geometryOnly)return mesh.curved?meshGeometry(mesh,row,col,u,v):{x:p.reduce((a,q,i)=>a+q.x*weights[i],0),y:p.reduce((a,q,i)=>a+q.y*weights[i],0)};return {...(mesh.curved?meshGeometry(mesh,row,col,u,v):{x:p.reduce((a,q,i)=>a+q.x*weights[i],0),y:p.reduce((a,q,i)=>a+q.y*weights[i],0)}),rgb:[0,1,2].map(k=>{if(!mesh.curved)return rgb.reduce((a,q,i)=>a+q[k]*weights[i],0);const rk=meshKnots(mesh,'rows'),ck=meshKnots(mesh,'cols'),cache=new Map(),sample=r=>{if(!cache.has(r))cache.set(r,smoothAxis(c=>(mesh._rgb?.[r*mesh.cols+c]||colorRGB(mesh.points[r*mesh.cols+c].color))[k],ck,col,u));return cache.get(r);};return Math.max(0,Math.min(255,smoothAxis(sample,rk,row,v)));})};}
export function refineMesh(mesh,axis){const rows=axis==='rows'?mesh.rows+1:mesh.rows,cols=axis==='cols'?mesh.cols+1:mesh.cols;if(rows>17||cols>17)throw Error('A mesh can contain up to 17 × 17 colour points.');const points=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const r=y/(rows-1)*(mesh.rows-1),c=x/(cols-1)*(mesh.cols-1),ri=Math.min(mesh.rows-2,Math.floor(r)),ci=Math.min(mesh.cols-2,Math.floor(c)),q=meshSample(mesh,ri,ci,c-ci,r-ri);points.push({x:q.x,y:q.y,color:'#'+q.rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')});}const next={...mesh,rows,cols,points};
 if(mesh.rowKnots||mesh.colKnots){const resample=(axis,count)=>{const old=meshKnots(mesh,axis);return Array.from({length:count},(_,i)=>{const t=i/(count-1)*(old.length-1),k=Math.min(old.length-2,Math.floor(t));return old[k]+(old[k+1]-old[k])*(t-k);});};next.rowKnots=resample('rows',rows);next.colKnots=resample('cols',cols);}return next;}
// Insert full grid lines through a cell, preserving every existing control point.
export function splitMesh(mesh,row,col,u=.5,v=.5,insertCol=true,insertRow=true){
 if((insertRow&&mesh.rows>=17)||(insertCol&&mesh.cols>=17))throw Error('A mesh can contain up to 17 × 17 colour points.');
 if(row<0||row>=mesh.rows-1||col<0||col>=mesh.cols-1||![u,v].every(Number.isFinite))throw Error('Invalid mesh cell.');
 const xs=Array.from({length:mesh.cols},(_,i)=>i),ys=Array.from({length:mesh.rows},(_,i)=>i);
 if(insertCol)xs.splice(col+1,0,col+Math.max(1e-8,Math.min(1-1e-8,u)));
 if(insertRow)ys.splice(row+1,0,row+Math.max(1e-8,Math.min(1-1e-8,v)));
 const points=ys.flatMap(y=>xs.map(x=>{if(Number.isInteger(x)&&Number.isInteger(y))return structuredClone(mesh.points[y*mesh.cols+x]);const r=Math.min(mesh.rows-2,Math.floor(y)),c=Math.min(mesh.cols-2,Math.floor(x)),q=meshSample(mesh,r,c,x-c,y-r);return {x:q.x,y:q.y,color:'#'+q.rgb.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('')};}));
 const next={...mesh,rows:ys.length,cols:xs.length,points};
 if(mesh.rowKnots||mesh.colKnots){const rk=[...meshKnots(mesh,'rows')],ck=[...meshKnots(mesh,'cols')];if(insertRow)rk.splice(row+1,0,rk[row]+(rk[row+1]-rk[row])*Math.max(1e-8,Math.min(1-1e-8,v)));if(insertCol)ck.splice(col+1,0,ck[col]+(ck[col+1]-ck[col])*Math.max(1e-8,Math.min(1-1e-8,u)));next.rowKnots=rk;next.colKnots=ck;}return next;
}
export function subdivideMesh(mesh,row,col,u=.5,v=.5){return splitMesh(mesh,row,col,u,v);}
export function meshCellAt(mesh,p){
 if(!p||![p.x,p.y].every(Number.isFinite))return null;
 const tolerance=Math.max(1e-6,Math.hypot(mesh.bounds.width,mesh.bounds.height)*1e-7);
 let best;
 for(let row=0;row<mesh.rows-1;row++)for(let col=0;col<mesh.cols-1;col++){
  const seeds=[];for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1]){const q=meshSample(mesh,row,col,u,v,true);seeds.push({u,v,d:Math.hypot(q.x-p.x,q.y-p.y)});}seeds.sort((a,b)=>a.d-b.d);
  for(const seed of seeds.slice(0,5)){let {u,v}=seed;
   for(let i=0;i<24;i++){const q=meshSample(mesh,row,col,u,v,true),dx=p.x-q.x,dy=p.y-q.y;if(Math.hypot(dx,dy)<=tolerance)break;const h=1e-5,a=meshSample(mesh,row,col,u+h,v,true),b=meshSample(mesh,row,col,u,v+h,true),ux=(a.x-q.x)/h,uy=(a.y-q.y)/h,vx=(b.x-q.x)/h,vy=(b.y-q.y)/h,det=ux*vy-uy*vx;if(Math.abs(det)<1e-12)break;const du=(dx*vy-dy*vx)/det,dv=(dy*ux-dx*uy)/det;let step=1;
    // Damped Newton stays within this patch and avoids divergent curved solves.
    while(step>1/1024){const nu=Math.max(0,Math.min(1,u+du*step)),nv=Math.max(0,Math.min(1,v+dv*step)),next=meshSample(mesh,row,col,nu,nv,true);if(Math.hypot(next.x-p.x,next.y-p.y)<Math.hypot(dx,dy)){u=nu;v=nv;break;}step/=2;}if(step<=1/1024)break;
   }
   const q=meshSample(mesh,row,col,u,v,true),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<=tolerance&&(!best||d<best.d))best={row,col,u,v,d};
  }
 }
 if(!best)return null;const {d,...cell}=best;return cell;
}
export function rasterMesh(mesh,maxSize=640){
 mesh={...mesh,_rgb:mesh.points.map(p=>colorRGB(p.color))};maxSize=Math.max(2,Math.min(2048,Number.isFinite(maxSize)?maxSize:640));
 const b=mesh.bounds,ratio=maxSize/Math.max(b.width,b.height,1),width=Math.max(2,Math.ceil(b.width*ratio)),height=Math.max(2,Math.ceil(b.height*ratio)),pixels=new Uint8ClampedArray(width*height*4);
 const triangle=(a,b,c)=>{const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-9)return;const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,w=1-u-v;if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7){const i=(y*width+x)*4;for(let k=0;k<3;k++)pixels[i+k]=u*a.rgb[k]+v*b.rgb[k]+w*c.rgb[k];pixels[i+3]=255;}}};
 const sample=(r,c,u,v)=>{const p=meshSample(mesh,r,c,u,v);return {...p,x:(p.x-b.x)*width/Math.max(b.width,1e-6),y:(p.y-b.y)*height/Math.max(b.height,1e-6)};};
 // Adaptive patch tessellation follows both geometric curvature and colour
 // curvature; the prior fixed eight steps produced angular visible gradients.
 const patch=(r,c,u0,v0,u1,v1,depth=0)=>{const a=sample(r,c,u0,v0),b=sample(r,c,u1,v0),d=sample(r,c,u0,v1),e=sample(r,c,u1,v1),u=(u0+u1)/2,v=(v0+v1)/2,mid=sample(r,c,u,v),edge=[sample(r,c,u,v0),sample(r,c,u1,v),sample(r,c,u,v1),sample(r,c,u0,v)],pairs=[[a,b],[b,e],[d,e],[a,d]];
  const geometry=Math.max(Math.hypot(mid.x-(a.x+e.x)/2,mid.y-(a.y+e.y)/2),...edge.map((p,i)=>Math.hypot(p.x-(pairs[i][0].x+pairs[i][1].x)/2,p.y-(pairs[i][0].y+pairs[i][1].y)/2)));
  const colour=Math.max(...mid.rgb.map((q,k)=>Math.abs(q-(a.rgb[k]+e.rgb[k])/2)),...edge.flatMap((p,i)=>p.rgb.map((q,k)=>Math.abs(q-(pairs[i][0].rgb[k]+pairs[i][1].rgb[k])/2))));
  if(depth<6&&(geometry>.45||colour>1.5)){patch(r,c,u0,v0,u,v,depth+1);patch(r,c,u,v0,u1,v,depth+1);patch(r,c,u0,v,u,v1,depth+1);patch(r,c,u,v,u1,v1,depth+1);}else{triangle(a,b,e);triangle(a,e,d);}
 };
 for(let r=0;r<mesh.rows-1;r++)for(let c=0;c<mesh.cols-1;c++)patch(r,c,0,0,1,1);
 if(!extendMeshCoverage(pixels,width,height)){
  const regular={...mesh,curved:false,points:mesh.points.map((p,i)=>({...p,x:b.x+b.width*(i%mesh.cols)/(mesh.cols-1),y:b.y+b.height*Math.floor(i/mesh.cols)/(mesh.rows-1)}))};return rasterMesh(regular,maxSize);
 }return {width,height,pixels};
}
const cache=new Map();let cacheBytes=0;
export function meshImage(mesh,maxSize=640){
 maxSize=Math.max(64,Math.min(2048,Math.ceil(maxSize/128)*128));const key=maxSize+':'+JSON.stringify(mesh);
 if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
 const {width,height,pixels}=rasterMesh(mesh,maxSize),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);const url=canvas.toDataURL('image/png');canvas.width=canvas.height=1;
 while(cache.size&&(cache.size>=12||cacheBytes+url.length>48*1024*1024)){const first=cache.keys().next().value;cacheBytes-=cache.get(first).length;cache.delete(first);}cache.set(key,url);cacheBytes+=url.length;return url;
}
