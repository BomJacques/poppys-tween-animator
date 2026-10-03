import {object} from '../document/model.js';
export const motions=['walk','run','sprint','hop','slide'];
const TAU=Math.PI*2,wrap=v=>((v%1)+1)%1,smooth=v=>v*v*(3-2*v),mix=(a,b,t)=>a+(b-a)*t;
const gait={walk:{stance:.62,stride:.64,lift:.16,lean:.025,arm:.52,bend:.28,body:[1.05,.99,1.065,1.09,1.05]},run:{stance:.39,stride:.76,lift:.36,lean:.19,arm:.85,bend:1.05,body:[.94,.82,.94,1.05,.94]},sprint:{stance:.31,stride:.9,lift:.48,lean:.34,arm:1.04,bend:1.2,body:[.91,.8,.94,1.06,.91]}};
// Explicit breakdowns preserve readable weight-bearing poses; unlike sine-only
// bobbing, the impact happens after contact and the rise precedes the next step.
function curve(q,keys){for(let i=1;i<keys.length;i++)if(q<=keys[i][0])return mix(keys[i-1][1],keys[i][1],smooth((q-keys[i-1][0])/(keys[i][0]-keys[i-1][0])));return keys.at(-1)[1];}
function bodyHeight(motion,phase){const g=gait[motion];if(g){const b=g.body;return curve(wrap(phase*2),[[0,b[0]],[.18,b[1]],[.5,b[2]],[.8,b[3]],[1,b[4]]]);}if(motion==='hop'){if(phase>=.25&&phase<=.72){const u=(phase-.25)/.47;return 1.04+.43*4*u*(1-u);}return curve(phase,[[0,1.04],[.14,.8],[.25,1.04],[.72,1.04],[.81,.83],[1,1.04]]);}return .86+.025*Math.cos(phase*TAU*2);}
function foot(motion,q,phase,sign){const g=gait[motion];if(g){let z,lift,pitch;if(q<=g.stance){z=g.stride/2-g.stride*q/g.stance;lift=0;pitch=q<.13?.3*(1-smooth(q/.13)):-.5*smooth(Math.max(0,(q-g.stance+.13)/.13));}else{const u=(q-g.stance)/(1-g.stance),m=-g.stride/g.stance*(1-g.stance);
  // Constant-speed support on a virtual moving floor, then a curved recovery.
  // Hermite endpoint tangents match that floor speed at toe-off and contact.
  z=(2*u*u*u-3*u*u+1)*(-g.stride/2)+(u*u*u-2*u*u+u)*m+(-2*u*u*u+3*u*u)*(g.stride/2)+(u*u*u-u*u)*m;
  lift=g.lift*Math.sin(Math.PI*u)**2;pitch=mix(-.5,.3,smooth(u))-.2*Math.sin(Math.PI*u)**2;
 }return {x:sign*.13,z,lift,pitch};}
 if(motion==='hop'){const u=Math.max(0,Math.min(1,(phase-.25)/.47)),air=phase>.25&&phase<.72;return {x:sign*.13,z:air?-.09*Math.sin(Math.PI*u):.025,lift:air?.43*4*u*(1-u)+.12*Math.sin(Math.PI*u)**2:0,pitch:air?-.28*Math.sin(Math.PI*u):0};}
 return {x:sign*.18,z:sign*.25+.08*Math.sin(phase*TAU),lift:0,pitch:0};
}
function knee(hip,ankle){const v={x:ankle.x-hip.x,y:ankle.y-hip.y,z:ankle.z-hip.z},d=Math.hypot(v.x,v.y,v.z),e={x:v.x/d,y:v.y/d,z:v.z/d},f={x:-e.x*e.z,y:-e.y*e.z,z:1-e.z*e.z},n=Math.hypot(f.x,f.y,f.z),h=Math.sqrt(Math.max(0,.52**2-d*d/4));return {x:(hip.x+ankle.x)/2+f.x/n*h,y:(hip.y+ankle.y)/2+f.y/n*h,z:(hip.z+ankle.z)/2+f.z/n*h};}
export function motionPhase(motion,phase){phase=wrap(phase);if(motion==='hop')return phase<.2?'Anticipation · load':phase<.25?'Push off':phase<.72?'Flight · tuck':phase<.86?'Landing · absorb':'Recover';if(motion==='slide')return Math.sin(phase*TAU)<0?'Glide · weight right':'Glide · weight left';const step=wrap(phase*2),g=gait[motion];if(!g)throw Error('Choose a supported movement.');if(g.stance<.5&&step>g.stance*2)return 'Flight';return step<.1?'Contact':step<.34?'Down · absorb':step<.65?'Passing · weight over support':'Up · push off';}
export function pose(motion,phase){
 if(!motions.includes(motion))throw Error('Choose a supported movement.');phase=wrap(phase);const t=phase*TAU,g=gait[motion],y=bodyHeight(motion,phase),sway=g?-.04*Math.sin(t):motion==='slide'?.055*Math.sin(t):0,rootZ=motion==='slide'?.08*Math.sin(t):0,lean=(g?.lean||0)+(g?.018*Math.sin(t*2):motion==='hop'?.13*(1.04-y):-.13),hipYaw=g?.1*Math.cos(t):0,chestYaw=-hipYaw*1.25;
 const pelvis={x:sway,y,z:rootZ},chest={x:sway*.65,y:y+.55*Math.cos(lean),z:rootZ+.55*Math.sin(lean)},neck={x:chest.x,y:chest.y+.16,z:chest.z},head={x:sway*.35,y:bodyHeight(motion,wrap(phase-.016))+.87*Math.cos(lean),z:chest.z+.012*Math.sin(t-.16)};
 const joints={pelvis,chest,neck,head};
 for(const [side,sign] of [['L',-1],['R',1]]){const q=wrap(phase+(sign===1?.5:0)),f=foot(motion,q,phase,sign),sin=Math.sin(f.pitch),ankle={x:f.x,y:.085+f.lift+Math.max(.07*sin,-.17*sin),z:f.z},hip={x:sway+sign*.13*Math.cos(hipYaw),y:y-.015,z:rootZ-sign*.13*Math.sin(hipYaw)};
  joints[side+'Hip']=hip;joints[side+'Knee']=knee(hip,ankle);joints[side+'Ankle']=ankle;joints[side+'Heel']={x:ankle.x,y:ankle.y-.065-.07*sin,z:ankle.z-.07*Math.cos(f.pitch)};joints[side+'Toe']={x:ankle.x,y:ankle.y-.065+.17*sin,z:ankle.z+.17*Math.cos(f.pitch)};
  const shoulder={x:chest.x+sign*.25*Math.cos(chestYaw),y:chest.y+.015,z:chest.z-sign*.25*Math.sin(chestYaw)};let angle,forearm;
  if(g){angle=-g.arm*Math.cos(q*TAU-.10);forearm=-g.arm*Math.cos(q*TAU-.42)+g.bend+.04*Math.sin(q*TAU-.42);}else if(motion==='hop'){angle=curve(phase,[[0,0],[.14,-.6],[.27,1.05],[.52,.5],[.72,.18],[.81,-.3],[1,0]]);forearm=curve(wrap(phase-.035),[[0,0],[.14,-.6],[.27,1.05],[.52,.5],[.72,.18],[.81,-.3],[1,0]])+.65;}else{angle=-.25+.18*Math.cos(q*TAU);forearm=angle+.8;}
  joints[side+'Shoulder']=shoulder;joints[side+'Elbow']={x:shoulder.x,y:shoulder.y-.32*Math.cos(angle),z:shoulder.z+.32*Math.sin(angle)};const elbow=joints[side+'Elbow'];joints[side+'Hand']={x:elbow.x,y:elbow.y-.29*Math.cos(forearm),z:elbow.z+.29*Math.sin(forearm)};
 }return joints;
}
export const puppetViews=[{label:'Side',rotation:90},{label:'Front',rotation:0},{label:'Three-quarter',rotation:45}];
export function puppetSVG(motion,phase,rotation=90,floor=true){
 const joints=pose(motion,phase),r=rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),project=p=>({x:200+(p.x*c+p.z*s)*140,y:355-p.y*140+(-p.x*s+p.z*c)*15,depth:-p.x*s+p.z*c}),points=Object.fromEntries(Object.entries(joints).map(([k,p])=>[k,project(p)])),fmt=v=>Number(v.toFixed(3)),xy=p=>fmt(p.x)+' '+fmt(p.y),parts=[];
 const add=(name,depth,svg)=>parts.push({name,depth,svg}),shade=depth=>depth<-.015?'#89939d':'#cbd2d8',outline='#3f4852';
 const bones=['L','R'].flatMap(side=>[[side+'Hip',side+'Knee',14],[side+'Knee',side+'Ankle',11],[side+'Shoulder',side+'Elbow',11],[side+'Elbow',side+'Hand',9]]);
 for(const [a,b,width] of bones){const p=points[a],q=points[b],depth=(p.depth+q.depth)/2,d='M'+xy(p)+'L'+xy(q);add('limb:'+a+'-'+b,depth,'<path d="'+d+'" fill="none" stroke="'+outline+'" stroke-width="'+(width+2)+'" stroke-linecap="round"/><path d="'+d+'" fill="none" stroke="'+shade(depth)+'" stroke-width="'+width+'" stroke-linecap="round"/>');}
 // Joint dots share the painter's depth ordering with limbs and torso. A far
 // knee can no longer appear on top of the near leg merely because it is a dot.
 for(const [name,p] of Object.entries(points))if(/Knee|Elbow|Hip|Shoulder/.test(name))add('joint:'+name,p.depth,'<circle cx="'+fmt(p.x)+'" cy="'+fmt(p.y)+'" r="4" fill="'+shade(p.depth)+'" stroke="'+outline+'" stroke-width="1.5"/>');
 for(const side of ['L','R']){const heel=points[side+'Heel'],toe=points[side+'Toe'],ankle=points[side+'Ankle'],depth=(heel.depth+toe.depth)/2;
  const d='M'+xy(ankle)+'L'+xy(heel)+'L'+xy(toe);add('foot:'+side,depth,'<path d="'+d+'" fill="none" stroke="'+outline+'" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="'+d+'" fill="none" stroke="'+shade(depth)+'" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="'+fmt(heel.x)+'" cy="'+fmt(heel.y)+'" r="2" fill="'+outline+'"/><circle cx="'+fmt(toe.x)+'" cy="'+fmt(toe.y)+'" r="2" fill="'+outline+'"/>');
  const hand=points[side+'Hand'];add('hand:'+side,hand.depth,'<ellipse cx="'+fmt(hand.x)+'" cy="'+fmt(hand.y)+'" rx="5" ry="6" fill="'+shade(hand.depth)+'" stroke="'+outline+'" stroke-width="1"/>');
 }
 const chest=points.chest,pelvis=points.pelvis,neck=points.neck,head=points.head,chestWidth=28+Math.abs(c)*44,pelvisWidth=24+Math.abs(c)*18,depth=(chest.depth+pelvis.depth)/2;
 const torso='M'+fmt(chest.x-chestWidth/2)+' '+fmt(chest.y-7)+' Q'+xy(neck)+' '+fmt(chest.x+chestWidth/2)+' '+fmt(chest.y-7)+' C'+fmt(chest.x+chestWidth/2)+' '+fmt(chest.y+25)+' '+fmt(pelvis.x+pelvisWidth/2)+' '+fmt(pelvis.y-25)+' '+fmt(pelvis.x+pelvisWidth/2)+' '+fmt(pelvis.y-9)+' Q'+fmt(pelvis.x)+' '+fmt(pelvis.y+3)+' '+fmt(pelvis.x-pelvisWidth/2)+' '+fmt(pelvis.y-9)+' C'+fmt(pelvis.x-pelvisWidth/2)+' '+fmt(pelvis.y-25)+' '+fmt(chest.x-chestWidth/2)+' '+fmt(chest.y+25)+' '+fmt(chest.x-chestWidth/2)+' '+fmt(chest.y-7)+' Z';
 add('torso',depth,'<path d="'+torso+'" fill="#b9c2ca" stroke="'+outline+'" stroke-width="1.5"/><path d="M'+xy(neck)+'L'+xy(chest)+'L'+fmt((chest.x+pelvis.x)/2)+' '+fmt((chest.y+pelvis.y)/2)+'" fill="none" stroke="#83909b" stroke-width="1.3"/>');
 add('pelvis',pelvis.depth,'<ellipse cx="'+fmt(pelvis.x)+'" cy="'+fmt(pelvis.y)+'" rx="'+fmt(pelvisWidth/2)+'" ry="10" fill="#a8b4bf" stroke="'+outline+'" stroke-width="1.5"/><path d="M'+xy(points.LHip)+'L'+xy(points.RHip)+'" stroke="'+outline+'" stroke-width="1"/>');
 add('neck',(neck.depth+head.depth)/2,'<path d="M'+xy(neck)+'L'+xy(head)+'" stroke="'+outline+'" stroke-width="11" stroke-linecap="round"/><path d="M'+xy(neck)+'L'+xy(head)+'" stroke="#cbd2d8" stroke-width="8" stroke-linecap="round"/>');
 add('head',head.depth,'<ellipse cx="'+fmt(head.x)+'" cy="'+fmt(head.y)+'" rx="18" ry="21" fill="#d3d9de" stroke="'+outline+'" stroke-width="1.5"/><path d="M'+fmt(head.x+s*15)+' '+fmt(head.y-1)+'l'+fmt(s*5)+' 5" fill="none" stroke="'+outline+'" stroke-width="2" stroke-linecap="round"/>');
 parts.sort((a,b)=>a.depth-b.depth);
 let ground='';if(floor){const corners=[[-.7,-.85],[.7,-.85],[.7,.85],[-.7,.85]].map(([x,z])=>project({x,y:.02,z}));ground='<g data-puppet-floor><path d="M'+corners.map(xy).join('L')+' Z" fill="#8c949d" fill-opacity=".05" stroke="#7c8791" stroke-width="1"/>';
  for(const side of ['L','R']){const heel=joints[side+'Heel'],toe=joints[side+'Toe'],contact=heel.y<toe.y?heel:toe;if(contact.y<=.020001){const p=project({...contact,y:.02});ground+='<ellipse data-contact="'+side+'" cx="'+fmt(p.x)+'" cy="'+fmt(p.y)+'" rx="10" ry="2" fill="#67727d" fill-opacity=".45"/>';}}ground+='</g>';
 }
 return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">'+ground+parts.map(p=>'<g data-puppet-part="'+p.name+'" data-depth="'+fmt(p.depth)+'">'+p.svg+'</g>').join('')+'</svg>';
}
export function referenceIndex(reference,time){if(time<reference.start||time>=reference.start+reference.duration)return -1;if(reference.visibleRanges&&!reference.visibleRanges.some(r=>time>=r.start&&time<r.end))return -1;return Math.min(reference.frames.length-1,Math.max(0,Math.floor((time-reference.start)*reference.fps*(reference.playbackRate??1)+1e-7)));}
export function referenceLayer(p,{motion='walk',rotation=90,duration=2,start=0,frames}){if(!Array.isArray(frames)||frames.length!==Math.round(duration*p.fps))throw Error('Baked frame count must match cycle length.');return object('image',{name:motion[0].toUpperCase()+motion.slice(1)+' reference · '+duration+'s',width:400,height:400,x:p.width/2-200,y:p.height/2-200,fill:'none',locked:true,opacity:.6,reference:true,exportIncluded:false,referenceFrames:{motion,rotation,start,duration,fps:p.fps,frames}});}
