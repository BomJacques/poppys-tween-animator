// Corner radii stay on the original points; derived geometry is shared by preview/export.
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
function split(c,t){const a=mix(c[0],c[1],t),b=mix(c[1],c[2],t),d=mix(c[2],c[3],t),e=mix(a,b,t),f=mix(b,d,t),g=mix(e,f,t);return [[c[0],a,e,g],[g,f,d,c[3]]];}
function sample(c,t){return split(c,t)[0][3];}
function segment(a,b){return {curve:!!(a.out||b.in),c:[a,a.out||a,b.in||b,b]};}
function trimTime(s,want,fromEnd=false){if(!s.curve)return Math.max(0,Math.min(1,want/(distance(s.c[0],s.c[3])||1)));let total=0,previous=sample(s.c,fromEnd?1:0);for(let i=1;i<=48;i++){const t=fromEnd?1-i/48:i/48,p=sample(s.c,t),d=distance(previous,p);if(total+d>=want)return ((i-1)+(want-total)/(d||1))/48;total+=d;previous=p;}return 1;}
function cut(s,start,end){if(!s.curve)return [mix(s.c[0],s.c[3],start),mix(s.c[0],s.c[3],end)];const left=split(s.c,end)[0];return split(left,end?start/end:0)[1];}
function pieces(n){const out=[];let part=[];for(const p of n.nodes||[]){if(p.move&&part.length){out.push({points:part,closed:false});part=[];}part.push(p);if(p.close){out.push({points:part,closed:true});part=[];}}if(part.length)out.push({points:part,closed:!!n.closed});return out;}
const pointText=p=>`${Math.round(p.x*1e8)/1e8} ${Math.round(p.y*1e8)/1e8}`;
export function cornerDirectionPoints(v,before,after){const usable=p=>p&&Math.hypot(p.x-v.x,p.y-v.y)>1e-8;return [[v.in,before.out,before].find(usable)||v,[v.out,after.in,after].find(usable)||v];}
export function bevelPathData(n){
 if(n.rawPath)return n.rawPath;
 let result='';
 for(const {points:p,closed} of pieces(n)){
  if(!p.length)continue;
  if(p.length===1){result+=` M ${pointText(p[0])}`;continue;}
  const count=closed?p.length:p.length-1,segs=Array.from({length:count},(_,i)=>segment(p[i],p[(i+1)%p.length]));
  const radii=p.map((v,i)=>{const radius=Math.max(0,Number(v.bevelRadius)||0);if(!radius||(!closed&&(i===0||i===p.length-1)))return 0;const before=p[(i-1+p.length)%p.length],after=p[(i+1)%p.length],[a,b]=cornerDirectionPoints(v,before,after),ax=a.x-v.x,ay=a.y-v.y,bx=b.x-v.x,by=b.y-v.y,al=Math.hypot(ax,ay),bl=Math.hypot(bx,by);if(!al||!bl)return 0;const angle=Math.acos(Math.max(-1,Math.min(1,(ax*bx+ay*by)/(al*bl))));if(angle<.01||Math.PI-angle<.01)return 0;return Math.min(radius/Math.tan(angle/2),distance(before,v)*.45,distance(v,after)*.45);});
  const trimmed=segs.map((s,i)=>cut(s,trimTime(s,radii[i]),1-trimTime(s,radii[(i+1)%p.length],true)));
  result+=` M ${pointText(trimmed[0][0])}`;
  for(let i=0;i<count;i++){
   const c=trimmed[i];result+=segs[i].curve?` C ${pointText(c[1])} ${pointText(c[2])} ${pointText(c[3])}`:` L ${pointText(c[1])}`;
   const next=(i+1)%p.length,following=trimmed[(i+1)%count];
   if(radii[next]&&(closed||i<count-1))result+=p[next].bevelStyle==='bevel'?` L ${pointText(following[0])}`:` Q ${pointText(p[next])} ${pointText(following[0])}`;
  }
  if(closed)result+=' Z';
 }
 return result.trim();
}
