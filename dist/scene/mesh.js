// A portable colour grid: geometry and colours stay in the project, pixels are derived.
export const colorRGB=c=>/^#[0-9a-f]{6}$/i.test(c)?[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)):/^#[0-9a-f]{3}$/i.test(c)?[...c.slice(1)].map(x=>parseInt(x+x,16)):[103,96,232];
export function createMesh(b,color='#6760e8',rows=3,cols=3){if(b.width<=0||b.height<=0)throw Error('Mesh shading needs a shape with width and height.');color='#'+colorRGB(color).map(v=>v.toString(16).padStart(2,'0')).join('');return {rows,cols,points:Array.from({length:rows*cols},(_,i)=>({x:b.x+b.width*(i%cols)/(cols-1),y:b.y+b.height*Math.floor(i/cols)/(rows-1),color:color==='none'?'#6760e8':color})),bounds:{...b}};}
const catmull=(a,b,c,d,t)=>.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
function meshGeometry(mesh,row,col,u,v){const at=(r,c,key)=>mesh.points[Math.max(0,Math.min(mesh.rows-1,r))*mesh.cols+Math.max(0,Math.min(mesh.cols-1,c))][key];const result={};for(const key of ['x','y']){const samples=[-1,0,1,2].map(dr=>catmull(...[-1,0,1,2].map(dc=>at(row+dr,col+dc,key)),u));result[key]=catmull(...samples,v);}return result;}
export function meshSample(mesh,row,col,u,v){const p=[mesh.points[row*mesh.cols+col],mesh.points[row*mesh.cols+col+1],mesh.points[(row+1)*mesh.cols+col],mesh.points[(row+1)*mesh.cols+col+1]],weights=[(1-u)*(1-v),u*(1-v),(1-u)*v,u*v],rgb=p.map(q=>colorRGB(q.color));return {...(mesh.curved?meshGeometry(mesh,row,col,u,v):{x:p.reduce((a,q,i)=>a+q.x*weights[i],0),y:p.reduce((a,q,i)=>a+q.y*weights[i],0)}),rgb:[0,1,2].map(k=>rgb.reduce((a,q,i)=>a+q[k]*weights[i],0))};}
export function refineMesh(mesh,axis){const rows=axis==='rows'?mesh.rows+1:mesh.rows,cols=axis==='cols'?mesh.cols+1:mesh.cols;if(rows>17||cols>17)throw Error('A mesh can contain up to 17 × 17 colour points.');const points=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const r=y/(rows-1)*(mesh.rows-1),c=x/(cols-1)*(mesh.cols-1),ri=Math.min(mesh.rows-2,Math.floor(r)),ci=Math.min(mesh.cols-2,Math.floor(c)),q=meshSample(mesh,ri,ci,c-ci,r-ri);points.push({x:q.x,y:q.y,color:'#'+q.rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('')});}return {...mesh,rows,cols,points};}
// Insert full grid lines through a cell, preserving every existing control point.
export function splitMesh(mesh,row,col,u=.5,v=.5,insertCol=true,insertRow=true){
 if((insertRow&&mesh.rows>=17)||(insertCol&&mesh.cols>=17))throw Error('A mesh can contain up to 17 × 17 colour points.');
 if(row<0||row>=mesh.rows-1||col<0||col>=mesh.cols-1||![u,v].every(Number.isFinite))throw Error('Invalid mesh cell.');
 const xs=Array.from({length:mesh.cols},(_,i)=>i),ys=Array.from({length:mesh.rows},(_,i)=>i);
 if(insertCol)xs.splice(col+1,0,col+Math.max(1e-8,Math.min(1-1e-8,u)));
 if(insertRow)ys.splice(row+1,0,row+Math.max(1e-8,Math.min(1-1e-8,v)));
 const points=ys.flatMap(y=>xs.map(x=>{if(Number.isInteger(x)&&Number.isInteger(y))return structuredClone(mesh.points[y*mesh.cols+x]);const r=Math.min(mesh.rows-2,Math.floor(y)),c=Math.min(mesh.cols-2,Math.floor(x)),q=meshSample(mesh,r,c,x-c,y-r);return {x:q.x,y:q.y,color:'#'+q.rgb.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('')};}));
 return {...mesh,rows:ys.length,cols:xs.length,points};
}
export function subdivideMesh(mesh,row,col,u=.5,v=.5){return splitMesh(mesh,row,col,u,v);}
export function meshCellAt(mesh,p){
 if(!p||![p.x,p.y].every(Number.isFinite))return null;
 const tolerance=Math.max(1e-6,Math.hypot(mesh.bounds.width,mesh.bounds.height)*1e-7);
 let best;
 for(let row=0;row<mesh.rows-1;row++)for(let col=0;col<mesh.cols-1;col++){
  const seeds=[];for(const u of [0,.25,.5,.75,1])for(const v of [0,.25,.5,.75,1]){const q=meshSample(mesh,row,col,u,v);seeds.push({u,v,d:Math.hypot(q.x-p.x,q.y-p.y)});}seeds.sort((a,b)=>a.d-b.d);
  for(const seed of seeds.slice(0,5)){let {u,v}=seed;
   for(let i=0;i<24;i++){const q=meshSample(mesh,row,col,u,v),dx=p.x-q.x,dy=p.y-q.y;if(Math.hypot(dx,dy)<=tolerance)break;const h=1e-5,a=meshSample(mesh,row,col,u+h,v),b=meshSample(mesh,row,col,u,v+h),ux=(a.x-q.x)/h,uy=(a.y-q.y)/h,vx=(b.x-q.x)/h,vy=(b.y-q.y)/h,det=ux*vy-uy*vx;if(Math.abs(det)<1e-12)break;const du=(dx*vy-dy*vx)/det,dv=(dy*ux-dx*uy)/det;let step=1;
    // Damped Newton stays within this patch and avoids divergent curved solves.
    while(step>1/1024){const nu=Math.max(0,Math.min(1,u+du*step)),nv=Math.max(0,Math.min(1,v+dv*step)),next=meshSample(mesh,row,col,nu,nv);if(Math.hypot(next.x-p.x,next.y-p.y)<Math.hypot(dx,dy)){u=nu;v=nv;break;}step/=2;}if(step<=1/1024)break;
   }
   const q=meshSample(mesh,row,col,u,v),d=Math.hypot(q.x-p.x,q.y-p.y);if(d<=tolerance&&(!best||d<best.d))best={row,col,u,v,d};
  }
 }
 if(!best)return null;const {d,...cell}=best;return cell;
}
export function rasterMesh(mesh,maxSize=640){
 const b=mesh.bounds,ratio=Math.min(2,maxSize/Math.max(b.width,b.height,1)),width=Math.max(2,Math.ceil(b.width*ratio)),height=Math.max(2,Math.ceil(b.height*ratio)),pixels=new Uint8ClampedArray(width*height*4);
 const triangle=(a,b,c)=>{const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<1e-9)return;const x0=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),x1=Math.min(width-1,Math.ceil(Math.max(a.x,b.x,c.x))),y0=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),y1=Math.min(height-1,Math.ceil(Math.max(a.y,b.y,c.y)));for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,w=1-u-v;if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7){const i=(y*width+x)*4;for(let k=0;k<3;k++)pixels[i+k]=u*a.rgb[k]+v*b.rgb[k]+w*c.rgb[k];pixels[i+3]=255;}}};
 const sample=(r,c,u,v)=>{const p=meshSample(mesh,r,c,u,v);return {...p,x:(p.x-b.x)*width/Math.max(b.width,1e-6),y:(p.y-b.y)*height/Math.max(b.height,1e-6)};};
 const steps=Math.max(2,Math.min(8,Math.ceil(32/Math.max(mesh.rows-1,mesh.cols-1))));for(let r=0;r<mesh.rows-1;r++)for(let c=0;c<mesh.cols-1;c++)for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){const a=sample(r,c,x/steps,y/steps),b=sample(r,c,(x+1)/steps,y/steps),d=sample(r,c,x/steps,(y+1)/steps),e=sample(r,c,(x+1)/steps,(y+1)/steps);triangle(a,b,e);triangle(a,e,d);}return {width,height,pixels};
}
const cache=new Map();
export function meshImage(mesh){const key=JSON.stringify(mesh);if(cache.has(key))return cache.get(key);const {width,height,pixels}=rasterMesh(mesh),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').putImageData(new ImageData(pixels,width,height),0,0);const url=canvas.toDataURL('image/png');if(cache.size>=24)cache.delete(cache.keys().next().value);cache.set(key,url);return url;}
