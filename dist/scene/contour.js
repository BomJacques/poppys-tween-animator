import {evaluated} from '../animation/evaluate.js';
import {localBounds} from './matrix.js';
import {createMesh} from './mesh.js';
import {shapeRegion} from './mesh-region.js';

export function constrainMeshPoint(n,time,p,mesh){return shapeRegion(evaluated(n,time)).constrain(p,mesh?.manualBounds||mesh?.bounds);}
export function constrainMesh(n,time,mesh){const region=shapeRegion(evaluated(n,time));return {...mesh,points:mesh.points.map(p=>({...p,...region.constrain(p,mesh.manualBounds||mesh.bounds)}))};}

export function manualMesh(n,time,start,end,previous){
 const v=evaluated(n,time),region=shapeRegion(v);
 if(!region.contains(start)||!region.contains(end))throw Error('Tap both opposite corners inside the filled shape.');
 const shapeBounds=localBounds(n,time),dx=Math.abs(end.x-start.x),dy=Math.abs(end.y-start.y);
 if(Math.hypot(dx,dy)<1e-6)throw Error('Tap a different opposite side or corner.');
 const b={x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:dx,height:dy};
 // Opposite sides naturally share one coordinate; use the shape's cross-axis.
 // A small alignment tolerance absorbs finger jitter without flattening the grid.
 if(dy<=Math.max(1,shapeBounds.height*.05)&&dx>Math.max(1,shapeBounds.width*.05)){b.y=shapeBounds.y;b.height=shapeBounds.height;}
 else if(dx<=Math.max(1,shapeBounds.width*.05)&&dy>Math.max(1,shapeBounds.height*.05)){b.x=shapeBounds.x;b.width=shapeBounds.width;}
 if(b.width<1e-6||b.height<1e-6)throw Error('Tap clearly separated opposite sides or corners.');
 const mesh=previous?structuredClone(previous):createMesh(b,v.fill,3,3),old=mesh.bounds;
 mesh.points=mesh.points.map(p=>({...p,x:b.x+(p.x-old.x)/old.width*b.width,y:b.y+(p.y-old.y)/old.height*b.height}));
 mesh.bounds={...b};mesh.manualBounds={...b};mesh.contour=false;mesh.geometryTime=time;
 // Manual grids remain bilinear so inserting a row/column preserves the field.
 mesh.curved=false;return constrainMesh(n,time,mesh);
}

export function fitMesh(n,time=0,previous){
 if(previous?.manualBounds)return constrainMesh(n,time,{...structuredClone(previous),geometryTime:time});
 const v=evaluated(n,time),b=localBounds(n,time),region=shapeRegion(v);
 let center={x:b.x+b.width/2,y:b.y+b.height/2};
 if(!region.contains(center)){let best=-1;for(let r=1;r<30;r++)for(let c=1;c<30;c++){const p={x:b.x+b.width*c/30,y:b.y+b.height*r/30};if(!region.contains(p))continue;const score=Math.min(...region.edges.map(([a,z])=>{const dx=z.x-a.x,dy=z.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y);}));if(score>best){best=score;center=p;}}if(best<0)throw Error('This shape is too narrow for a contour mesh.');}
 const mesh=previous?structuredClone(previous):createMesh(b,v.fill,5,5);mesh.bounds={...b};mesh.contour=true;mesh.geometryTime=time;mesh.curved=n.type==='ellipse'||v.nodes?.some(p=>p.in||p.out)||false;
 mesh.points=mesh.points.map((p,i)=>{const u=(i%mesh.cols)/(mesh.cols-1)*2-1,v=Math.floor(i/mesh.cols)/(mesh.rows-1)*2-1,f=Math.max(Math.abs(u),Math.abs(v));if(!f)return {...p,...center};const dx=u*b.width/2,dy=v*b.height/2;let distance=Infinity;
 // Stop at the first boundary, including a hole, rather than using one outer ring.
 for(const [a,q] of region.edges){const sx=q.x-a.x,sy=q.y-a.y,det=dx*sy-dy*sx;if(Math.abs(det)<1e-9)continue;const ax=a.x-center.x,ay=a.y-center.y,t=(ax*sy-ay*sx)/det,k=(ax*dy-ay*dx)/det;if(t>1e-8&&k>=0&&k<=1)distance=Math.min(distance,t);}
 const q=Number.isFinite(distance)?{x:center.x+dx*distance*f,y:center.y+dy*distance*f}:{x:center.x+dx,y:center.y+dy};return {...p,...region.constrain(q,b)};});return mesh;
}
