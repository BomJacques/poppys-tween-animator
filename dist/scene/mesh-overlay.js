import {meshSample} from './mesh.js';
import {point} from './matrix.js';
import {shapeRegion} from './mesh-region.js';

// Work in composition coordinates so halo widths and hit targets stay constant
// on-screen even when an object has a nonuniform transform.
export function meshOverlay(mesh,matrix,scale,{activeIndex,node,time=0,id='mesh-overlay'}={}){
 if(!mesh?.points?.length)return '';
 scale=Number.isFinite(scale)&&scale>0?scale:1;
 const clipId='mesh-scaffold-'+String(id).replace(/[^a-zA-Z0-9_-]/g,'_'),steps=mesh.curved?16:2;
 const coordinates=p=>{const q=point(matrix,p);return `${q.x},${q.y}`;};
 const line=(points,kind)=>{const d=points.map(coordinates).join(' ');return `<g data-mesh-line="${kind}" pointer-events="none"><polyline points="${d}" fill="none" stroke="#ffffff" stroke-width="${4/scale}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${d}" fill="none" stroke="#1660d8" stroke-width="${1.5/scale}" stroke-linecap="round" stroke-linejoin="round"/></g>`;};
 let curves='';
 for(let r=0;r<mesh.rows;r++){const samples=[];for(let c=0;c<mesh.cols-1;c++)for(let k=c?1:0;k<=steps;k++)samples.push(meshSample(mesh,Math.min(mesh.rows-2,r),c,k/steps,r===mesh.rows-1?1:0));curves+=line(samples,'row-'+r);}
 for(let c=0;c<mesh.cols;c++){const samples=[];for(let r=0;r<mesh.rows-1;r++)for(let k=r?1:0;k<=steps;k++)samples.push(meshSample(mesh,r,Math.min(mesh.cols-2,c),c===mesh.cols-1?1:0,k/steps));curves+=line(samples,'column-'+c);}
 let defs='',contour='';
 if(node){const {rings}=shapeRegion(node),path=rings.map(r=>r.map((p,i)=>(i?'L ':'M ')+coordinates(p).replace(',',' ')).join(' ')+' Z').join(' ');
 defs=`<defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path d="${path}" clip-rule="${node.fillRule==='evenodd'?'evenodd':'nonzero'}"/></clipPath></defs>`;
 curves=`<g clip-path="url(#${clipId})">${curves}</g>`;
 // The exact sampled silhouette is more legible than a bounding rectangle.
 contour=rings.map((r,i)=>line([...r,r[0]],'contour-'+i)).join('');
 }
 const handles=mesh.points.map((p,i)=>{const q=point(matrix,p),active=i===activeIndex,color=/^#[0-9a-f]{6}$/i.test(p.color)?p.color:'#777777',radius=(active?6:4)/scale;
 return `<g class="node-handle mesh-point" data-mesh="${i}"><circle data-mesh-hit="${i}" cx="${q.x}" cy="${q.y}" r="${22/scale}" fill="transparent" pointer-events="all"/><circle cx="${q.x}" cy="${q.y}" r="${radius+1.5/scale}" fill="#ffffff" stroke="#ffffff" stroke-width="${2/scale}" pointer-events="none"/><circle cx="${q.x}" cy="${q.y}" r="${radius}" fill="${color}" stroke="#164998" stroke-width="${2/scale}" pointer-events="none"/>${active?`<circle cx="${q.x}" cy="${q.y}" r="${1.5/scale}" fill="#ffffff" pointer-events="none"/>`:''}</g>`;
 }).join('');
 return defs+contour+curves+handles;
}
