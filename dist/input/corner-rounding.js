import {cornerDirectionPoints} from '../scene/bevel.js';
import {clone} from '../document/model.js';
import {point,inverse} from '../scene/matrix.js';
function subpaths(n){const parts=[];let indices=[];for(let i=0;i<(n.nodes||[]).length;i++){const p=n.nodes[i];if(p.move&&indices.length){parts.push({indices,closed:false});indices=[];}indices.push(i);if(p.close){parts.push({indices,closed:true});indices=[];}}if(indices.length)parts.push({indices,closed:!!n.closed});return parts;}
export function cornerDescriptors(n){
 if(n.rawPath||n.rubberhose||!['path','freehand'].includes(n.type))return [];
 const out=[];for(const {indices,closed} of subpaths(n)){if(indices.length<3)continue;for(let j=0;j<indices.length;j++){if(!closed&&(j===0||j===indices.length-1))continue;const index=indices[j],v=n.nodes[index],before=n.nodes[indices[(j-1+indices.length)%indices.length]],after=n.nodes[indices[(j+1)%indices.length]],[a,b]=cornerDirectionPoints(v,before,after),ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y,al=Math.hypot(ax,ay),bl=Math.hypot(bx,by);if(al<1e-8||bl<1e-8)continue;const angle=Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/(al*bl))));if(angle<.01||Math.PI-angle<.01)continue;const dx=ax/al+bx/bl,dy=ay/al+by/bl,length=Math.hypot(dx,dy),sinHalf=Math.sin(angle/2),maxRadius=Math.min(2048,.45*Math.min(Math.hypot(before.x-v.x,before.y-v.y),Math.hypot(after.x-v.x,after.y-v.y))*Math.tan(angle/2));if(maxRadius<1e-6)continue;out.push({index,point:v,direction:{x:dx/length,y:dy/length},sinHalf,maxRadius});}}
 return out;
}
export function cornerWidgets(n,m,scale=1,visibleIndices,avoidPoints=[]){
 const zoom=Math.max(.001,scale),anchors=(n.nodes||[]).map(p=>point(m,p)),used=[];
 return cornerDescriptors(n).filter(c=>!visibleIndices||visibleIndices.includes(c.index)).map(c=>{const p=point(m,c.point),tip=point(m,{x:c.point.x+c.direction.x,y:c.point.y+c.direction.y}),length=Math.hypot(tip.x-p.x,tip.y-p.y);if(length<1e-10)return null;const dir={x:(tip.x-p.x)/length,y:(tip.y-p.y)/length};let offset=Math.max(48/zoom,Math.min(c.maxRadius,Math.max(0,c.point.bevelRadius||0))/c.sinHalf*length),q={x:p.x+dir.x*offset,y:p.y+dir.y*offset};for(let i=0;i<24&&[...anchors,...avoidPoints,...used].some(a=>Math.hypot(q.x-a.x,q.y-a.y)*zoom<44);i++){offset+=24/zoom;q={x:p.x+dir.x*offset,y:p.y+dir.y*offset};}used.push(q);return {...c,world:q,anchor:p};}).filter(Boolean);
}
export function roundCornerNodes(snapshot,index,start,current,m){
 const c=cornerDescriptors(snapshot).find(c=>c.index===index);if(!c)return clone(snapshot.nodes);
 const inv=inverse(m),a=point(inv,start),b=point(inv,current),delta=((b.x-a.x)*c.direction.x+(b.y-a.y)*c.direction.y)*c.sinHalf,nodes=clone(snapshot.nodes);if(Math.abs(delta)<1e-9)return nodes;
 nodes[index].bevelRadius=Math.max(0,Math.min(c.maxRadius,(snapshot.nodes[index].bevelRadius||0)+delta));nodes[index].bevelStyle='round';return nodes;
}
export function cornerWidgetSVG(widgets,scale=1,active){const zoom=Math.max(.001,scale);return widgets.map(c=>{const {x,y}=c.world,r=7/zoom,s=3/zoom;return `<g class="node-handle corner-round-handle" data-corner="${c.index}" role="button" aria-label="Round corner ${c.index+1}, radius ${Math.round(c.point.bevelRadius||0)} pixels"><title>Round corner ${c.index+1} · drag away to round, toward the point to sharpen</title><circle cx="${x}" cy="${y}" r="${22/zoom}" fill="transparent"/><circle cx="${x}" cy="${y}" r="${r}" fill="${active===c.index?'#dce8f5':'white'}" stroke="#536f8e" stroke-width="${1.5/zoom}"/><path d="M ${x-s} ${y+s} V ${y} Q ${x-s} ${y-s} ${x} ${y-s} H ${x+s}" fill="none" stroke="#536f8e" stroke-width="${1.3/zoom}" pointer-events="none"/></g>`;}).join('');}
