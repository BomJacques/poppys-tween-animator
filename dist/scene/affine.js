// Pure affine operations shared by editing and path constraints.
export const identity=()=>[1,0,0,1,0,0];
export function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export const point=(m,p)=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
export function inverse(m){const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-10)throw Error('This object has zero scale. Set a nonzero scale in Properties before manipulating it.');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
export function matrix(n){const r=n.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),m=[c*n.scaleX,s*n.scaleX,-s*n.scaleY,c*n.scaleY,n.x,n.y];m[4]+=n.anchorX-m[0]*n.anchorX-m[2]*n.anchorY;m[5]+=n.anchorY-m[1]*n.anchorX-m[3]*n.anchorY;return multiply(n.prefix||identity(),m);}
