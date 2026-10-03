import {object,clone} from '../document/model.js';
import {evaluated,setProperty,allTracks} from '../animation/evaluate.js';
function finitePoint(p){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('Choose finite limb point coordinates.');return {x:p.x,y:p.y};}
export function rubberHoseNodes(start,bend,end){const a=finitePoint(start),b=finitePoint(bend),c=finitePoint(end),dx=c.x-a.x,dy=c.y-a.y,length=Math.hypot(dx,dy),t=length?{x:dx/length,y:dy/length}:{x:1,y:0},left=Math.hypot(b.x-a.x,b.y-a.y)/3,right=Math.hypot(c.x-b.x,c.y-b.y)/3;return [{...a,in:{...a},out:{x:a.x+(b.x-a.x)/3,y:a.y+(b.y-a.y)/3}},{...b,in:{x:b.x-t.x*left,y:b.y-t.y*left},out:{x:b.x+t.x*right,y:b.y+t.y*right}},{...c,in:{x:c.x+(b.x-c.x)/3,y:c.y+(b.y-c.y)/3},out:{...c}}];}
export function createRubberHose({start={x:0,y:0},bend={x:90,y:60},end={x:180,y:0},width=24,color='#282734',ik=true,stretch=false,...props}={}){if(!Number.isFinite(width)||width<=0||width>4096)throw Error('Limb width must be between 0 and 4096 pixels.');return object('path',{name:'Rubber hose limb',fill:'none',stroke:color,strokeWidth:width,lineCap:'round',lineJoin:'round',strokeProfile:'uniform',closed:false,...props,rubberhose:true,rubberhoseRig:{enabled:!!ik,stretch:!!stretch},nodes:rubberHoseNodes(start,bend,end).map((p,i)=>ik&&i===1?{...p,ikLength1:Math.max(.001,Math.hypot(bend.x-start.x,bend.y-start.y)),ikLength2:Math.max(.001,Math.hypot(end.x-bend.x,end.y-bend.y)),ikDirection:bendSide(start,bend,end)}:p)});}
export function rubberHoseGeometry(n,time=0){const v=evaluated(n,time);if(!n.rubberhose||v.nodes?.length!==3)throw Error('Choose a three-point rubber hose limb.');return {start:finitePoint(v.nodes[0]),bend:finitePoint(v.nodes[1]),end:finitePoint(v.nodes[2]),width:v.strokeWidth};}
export function detachRubberHose(n){delete n.rubberhose;delete n.rubberhoseRig;const states=[n.nodes,...allTracks(n).flatMap(t=>(t.nodes||[]).map(k=>k.value)),...(n.blockCuts||[]).map(c=>c.values?.nodes).filter(Boolean)];for(const nodes of states)for(const p of nodes||[])for(const key of ['ikLength1','ikLength2','ikDirection'])delete p[key];return n;}
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
function segmentLength(value){if(!Number.isFinite(value)||value<=0||value>1e6)throw Error('Limb lengths must be positive and no more than 1000000 pixels.');return value;}
function bendSide(a,b,c){return Math.sign((c.x-a.x)*(b.y-a.y)-(c.y-a.y)*(b.x-a.x))||1;}
export function rubberHoseRig(n,time=0,sourceNodes){const nodes=sourceNodes||evaluated(n,time).nodes,meta=nodes?.[1]||{},g=sourceNodes?{start:finitePoint(sourceNodes[0]),bend:finitePoint(sourceNodes[1]),end:finitePoint(sourceNodes[2])}:rubberHoseGeometry(n,time);return {...g,length1:meta.ikLength1??Math.max(.001,length(g.start,g.bend)),length2:meta.ikLength2??Math.max(.001,length(g.bend,g.end)),direction:meta.ikDirection??bendSide(g.start,g.bend,g.end),enabled:n.rubberhoseRig?.enabled===true,stretch:n.rubberhoseRig?.stretch===true};}
// Solve two bones, then render their endpoints and joint as the existing curved path.
export function solveRubberHose({start,end,length1,length2,direction=1,stretch=false,fallback={x:1,y:0}}){
 const a=finitePoint(start),target=finitePoint(end);let l1=segmentLength(length1),l2=segmentLength(length2),dx=target.x-a.x,dy=target.y-a.y,d=Math.hypot(dx,dy);if(!Number.isFinite(d)||d>2e6)throw Error('Limb endpoint is too far away.');
 const f=finitePoint(fallback);if(!f.x&&!f.y)f.x=1;const fd=Math.hypot(f.x,f.y),axis=d?{x:dx/d,y:dy/d}:{x:f.x/fd,y:f.y/fd},side=direction<0?-1:1;
 if(stretch&&d>l1+l2){const ratio=d/(l1+l2);l1*=ratio;l2*=ratio;segmentLength(l1);segmentLength(l2);}
 const reach=Math.max(Math.abs(l1-l2),Math.min(l1+l2,d)),c={x:a.x+axis.x*reach,y:a.y+axis.y*reach};
 let along,height;if(reach<1e-9){along=0;height=l1;}else{along=(l1*l1-l2*l2+reach*reach)/(2*reach);height=Math.sqrt(Math.max(0,l1*l1-along*along));}
 const b={x:a.x+axis.x*along-axis.y*height*side,y:a.y+axis.y*along+axis.x*height*side};return {start:a,bend:b,end:c,length1:l1,length2:l2,direction:side,clamped:Math.abs(reach-d)>1e-7};
}
export function updateRubberHose(n,changes,time=0,sourceNodes){
 const current=rubberHoseGeometry(n,time),rig=rubberHoseRig(n,time,sourceNodes),geometry={...current,...(sourceNodes?{start:rig.start,bend:rig.bend,end:rig.end}:{}),...clone(changes)},enabled=changes.ik===undefined?rig.enabled:!!changes.ik,stretch=changes.stretch===undefined?rig.stretch:!!changes.stretch;
 if(changes.width!==undefined&&(!Number.isFinite(geometry.width)||geometry.width<=0||geometry.width>4096))throw Error('Limb width must be between 0 and 4096 pixels.');
 const edits=changes.ik===true||['start','bend','end','length1','length2','direction'].some(k=>changes[k]!==undefined);
 if(enabled&&edits){const direction=changes.direction??(changes.bend?bendSide(geometry.start,finitePoint(changes.bend),geometry.end):rig.direction);Object.assign(geometry,solveRubberHose({start:geometry.start,end:geometry.end,length1:changes.length1??rig.length1,length2:changes.length2??rig.length2,direction,stretch,fallback:{x:rig.end.x-rig.start.x||1,y:rig.end.y-rig.start.y}}));}
 const nodes=edits?rubberHoseNodes(geometry.start,geometry.bend,geometry.end):null;if(nodes&&enabled)Object.assign(nodes[1],{ikLength1:changes.length1??rig.length1,ikLength2:changes.length2??rig.length2,ikDirection:geometry.direction??rig.direction});
 if(changes.ik!==undefined||changes.stretch!==undefined)n.rubberhoseRig={enabled,stretch};
 if(nodes)setProperty(n,'nodes',nodes,time);if(changes.width!==undefined)setProperty(n,'strokeWidth',geometry.width,time);return geometry;
}
