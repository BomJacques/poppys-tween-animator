import {sampledPaths} from './strokes.js';

// Sampled fill geometry is shared by placement, fitting and point dragging.
// Winding counts preserve nonzero compound paths; evenodd keeps cut-out holes.
export function shapeRegion(n){
 const rings=sampledPaths(n).filter(p=>p.closed).map(p=>p.points);
 if(!rings.length)throw Error('Close the shape before adding mesh shading.');
 const edges=rings.flatMap(r=>r.map((a,i)=>[a,r[(i+1)%r.length]]));
 const nearestOn=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return {x:a.x+dx*t,y:a.y+dy*t};};
 const contains=p=>{let winding=0,crossings=0;for(const [a,b] of edges){const q=nearestOn(p,a,b);if(Math.hypot(q.x-p.x,q.y-p.y)<1e-6)return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)crossings++;const cross=(b.x-a.x)*(p.y-a.y)-(p.x-a.x)*(b.y-a.y);if(a.y<=p.y&&b.y>p.y&&cross>0)winding++;else if(a.y>p.y&&b.y<=p.y&&cross<0)winding--;}
 return n.fillRule==='evenodd'?crossings%2===1:winding!==0;};
 const inBounds=(p,b)=>!b||p.x>=b.x-1e-7&&p.x<=b.x+b.width+1e-7&&p.y>=b.y-1e-7&&p.y<=b.y+b.height+1e-7;
 const constrain=(p,b)=>{let q=b?{x:Math.max(b.x,Math.min(b.x+b.width,p.x)),y:Math.max(b.y,Math.min(b.y+b.height,p.y))}:{x:p.x,y:p.y};if(contains(q))return q;let best,d=Infinity;
 // Clip boundary segments to the manually placed rectangle before projecting.
 for(const [a,z] of edges){let lo=0,hi=1;const dx=z.x-a.x,dy=z.y-a.y;if(b){for(const [v,w] of [[-dx,a.x-b.x],[dx,b.x+b.width-a.x],[-dy,a.y-b.y],[dy,b.y+b.height-a.y]]){if(Math.abs(v)<1e-12){if(w<0){hi=-1;break;}}else if(v<0)lo=Math.max(lo,w/v);else hi=Math.min(hi,w/v);}}if(lo>hi)continue;const u={x:a.x+dx*lo,y:a.y+dy*lo},v={x:a.x+dx*hi,y:a.y+dy*hi},c=nearestOn(q,u,v),distance=Math.hypot(q.x-c.x,q.y-c.y);if(distance<d&&inBounds(c,b)){best=c;d=distance;}}
 if(!best)throw Error('These mesh bounds do not overlap the filled shape.');return best;};
 return {rings,edges,contains,constrain};
}
