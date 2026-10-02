import {clone} from '../document/model.js';
import {evaluated,setProperty,activeTracks,allTracks} from '../animation/evaluate.js';
import {fitMesh,manualMesh,constrainMesh} from './contour.js';
import {meshCellAt,splitMesh} from './mesh.js';
import {shapeRegion} from './mesh-region.js';
export function currentMesh(n,time){const mesh=evaluated(n,time).mesh,tracks=activeTracks(n,time);return mesh?.contour&&!tracks.mesh?.length&&tracks.nodes?.length&&mesh.geometryTime!==time?fitMesh(n,time,mesh):mesh;}
export function editMesh(n,time,edit,topology=false){
 const keys=allTracks(n).flatMap(tracks=>tracks?.mesh||[]),cuts=(n.blockCuts||[]).filter(c=>c.values.mesh);
 if(topology&&(keys.length||cuts.length)){
  // Compute every value first: one unsupported key must leave the document intact.
  const base=n.mesh?edit(clone(n.mesh),0):undefined,values=keys.map(k=>edit(clone(k.value),k.time)),held=cuts.map(c=>edit(clone(c.values.mesh),c.start));
  if(base)n.mesh=base;keys.forEach((k,i)=>k.value=values[i]);cuts.forEach((c,i)=>c.values.mesh=held[i]);
 }else setProperty(n,'mesh',edit(clone(currentMesh(n,time)),time),time);
}
export function placeMeshBounds(n,time,start,end){
 // Validate the live taps before touching any of the animation states.
 const live=manualMesh(n,time,start,end,currentMesh(n,time));
 if(n.mesh)editMesh(n,time,(mesh,keyTime)=>{
  const b=live.bounds,old=mesh.bounds;
  const placed={...mesh,bounds:{...b},manualBounds:{...b},contour:false,curved:false,geometryTime:keyTime,points:mesh.points.map(p=>({...p,x:b.x+(p.x-old.x)/old.width*b.width,y:b.y+(p.y-old.y)/old.height*b.height}))};
  return constrainMesh(n,keyTime,placed);
 },true);else n.mesh=live;
 return currentMesh(n,time);
}
export function insertMeshPoint(n,time,p){
 const mesh=currentMesh(n,time);if(!mesh)throw Error('Place a mesh inside the shape first.');
 if(!shapeRegion(evaluated(n,time)).contains(p))throw Error('Tap inside the filled shape, away from holes.');
 const cell=meshCellAt(mesh,p);if(!cell)throw Error('Tap inside the placed mesh area.');
 const eps=1e-6,insertCol=cell.u>eps&&cell.u<1-eps,insertRow=cell.v>eps&&cell.v<1-eps;
 const row=insertRow?cell.row+1:cell.row+(cell.v>=1-eps?1:0),col=insertCol?cell.col+1:cell.col+(cell.u>=1-eps?1:0);
 if(!insertCol&&!insertRow)return {index:row*mesh.cols+col,inserted:false};
 // The same parametric split is applied to every state, keeping morph topology exact.
 editMesh(n,time,(m,keyTime)=>{
  if(m.rows!==mesh.rows||m.cols!==mesh.cols)throw Error('Mesh animation grids have different sizes. Match them before adding points.');
  const next=splitMesh(m,cell.row,cell.col,cell.u,cell.v,insertCol,insertRow);
  const region=shapeRegion(evaluated(n,keyTime)),b=next.manualBounds||next.bounds;
  // Preserve original points exactly; constrain only newly introduced points.
  next.points=next.points.map((q,i)=>{const r=Math.floor(i/next.cols),c=i%next.cols;return (insertRow&&r===row)||(insertCol&&c===col)?{...q,...region.constrain(q,b)}:q;});return next;
 },true);
 return {index:row*currentMesh(n,time).cols+col,inserted:true};
}
