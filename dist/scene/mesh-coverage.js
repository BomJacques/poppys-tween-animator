import {shapeRegion} from './mesh-region.js';
// Attach exterior colour anchors to the same contour ring they started on.
export function meshBoundaryPoint(n,p,original){
 const {rings}=shapeRegion(n),nearest=(ring,target)=>{let best,distance=Infinity;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((target.x-a.x)*dx+(target.y-a.y)*dy)/(dx*dx+dy*dy||1))),q={x:a.x+dx*t,y:a.y+dy*t},d=Math.hypot(q.x-target.x,q.y-target.y);if(d<distance){distance=d;best=q;}}return {point:best,distance};};
 const ring=rings.map(r=>({ring:r,...nearest(r,original||p)})).sort((a,b)=>a.distance-b.distance)[0].ring;return nearest(ring,p).point;
}
export function extendMeshCoverage(pixels,width,height){
 const count=width*height,seeds=new Int32Array(count);let known=0;
 for(let i=0;i<count;i++){seeds[i]=pixels[i*4+3]?i:-1;if(seeds[i]>=0)known++;}if(!known)return false;if(known===count)return true;
 const compare=(i,j,x,y)=>{if(j<0||j>=count||seeds[j]<0)return;const candidate=seeds[j],old=seeds[i],cx=candidate%width,cy=Math.floor(candidate/width);if(old<0||(cx-x)**2+(cy-y)**2<(old%width-x)**2+(Math.floor(old/width)-y)**2)seeds[i]=candidate;};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=y*width+x;if(x)compare(i,i-1,x,y);if(y){compare(i,i-width,x,y);if(x)compare(i,i-width-1,x,y);if(x<width-1)compare(i,i-width+1,x,y);}}
 for(let y=height-1;y>=0;y--)for(let x=width-1;x>=0;x--){const i=y*width+x;if(x<width-1)compare(i,i+1,x,y);if(y<height-1){compare(i,i+width,x,y);if(x)compare(i,i+width-1,x,y);if(x<width-1)compare(i,i+width+1,x,y);}}
 for(let i=0;i<count;i++)if(!pixels[i*4+3])for(let k=0;k<3;k++)pixels[i*4+k]=pixels[seeds[i]*4+k];
 // Smooth the extrapolated field rather than exposing flat original fill or
 // hard nearest-seed Voronoi seams. Keep every actual patch pixel unchanged.
 const radius=Math.max(2,Math.min(32,Math.ceil(Math.max(width,height)/64))),horizontal=new Uint8Array(count*3);
 for(let y=0;y<height;y++)for(let k=0;k<3;k++){let sum=0;for(let x=0;x<=Math.min(width-1,radius);x++)sum+=pixels[(y*width+x)*4+k];for(let x=0;x<width;x++){const lo=Math.max(0,x-radius),hi=Math.min(width-1,x+radius);horizontal[(y*width+x)*3+k]=sum/(hi-lo+1);if(x-radius>=0)sum-=pixels[(y*width+x-radius)*4+k];if(x+radius+1<width)sum+=pixels[(y*width+x+radius+1)*4+k];}}
 for(let x=0;x<width;x++){const sums=[0,0,0];for(let y=0;y<=Math.min(height-1,radius);y++)for(let k=0;k<3;k++)sums[k]+=horizontal[(y*width+x)*3+k];for(let y=0;y<height;y++){const i=y*width+x,lo=Math.max(0,y-radius),hi=Math.min(height-1,y+radius);if(!pixels[i*4+3]){const seed=seeds[i],distance=Math.hypot(seed%width-x,Math.floor(seed/width)-y),blend=Math.min(1,distance/Math.max(1,radius/2));for(let k=0;k<3;k++)pixels[i*4+k]=pixels[i*4+k]*(1-blend)+sums[k]/(hi-lo+1)*blend;}for(let k=0;k<3;k++){if(y-radius>=0)sums[k]-=horizontal[(y-radius)*width*3+x*3+k];if(y+radius+1<height)sums[k]+=horizontal[(y+radius+1)*width*3+x*3+k];}}}
 for(let i=0;i<count;i++)pixels[i*4+3]=255;return true;
}
