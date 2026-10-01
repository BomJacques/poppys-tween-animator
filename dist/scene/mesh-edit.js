import {clone} from '../document/model.js';
import {evaluated,setProperty} from '../animation/evaluate.js';
import {fitMesh} from './contour.js';
export function currentMesh(n,time){const mesh=evaluated(n,time).mesh;return mesh?.contour&&!n.tracks.mesh?.length&&n.tracks.nodes?.length&&mesh.geometryTime!==time?fitMesh(n,time,mesh):mesh;}
export function editMesh(n,time,edit,topology=false){
 if(topology&&n.tracks.mesh?.length){const base=edit(clone(n.mesh)),values=n.tracks.mesh.map(k=>edit(clone(k.value)));n.mesh=base;n.tracks.mesh.forEach((k,i)=>k.value=values[i]);}
 else setProperty(n,'mesh',edit(clone(currentMesh(n,time))),time);
}
