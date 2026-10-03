const rotate=(p,a)=>({x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)});
export function pairAngle(pair){return Math.hypot(pair[1].clientY-pair[0].clientY,pair[1].clientX-pair[0].clientX)>1?Math.atan2(pair[1].clientY-pair[0].clientY,pair[1].clientX-pair[0].clientX):undefined;}
export function canvasPairView(g,pair,center){
 const distance=Math.hypot(pair[1].clientX-pair[0].clientX,pair[1].clientY-pair[0].clientY),mid={x:(pair[0].clientX+pair[1].clientX)/2,y:(pair[0].clientY+pair[1].clientY)/2};
 // Ignore the undefined angle of coincident fingers; unwrap crossing +/-180°.
 if(distance>1){const angle=pairAngle(pair),prior=g.angle??angle;let delta=angle-prior;if(delta>Math.PI)delta-=2*Math.PI;else if(delta<-Math.PI)delta+=2*Math.PI;g.angle=angle;g.angleTravel=(g.angleTravel||0)+delta;}
 const turn=g.angleTravel||0,zoom=Math.max(.2,Math.min(8,g.view.zoom*distance/Math.max(g.distance,1))),ratio=zoom/g.view.zoom,anchor=rotate({x:g.mid.x-center.x-g.view.x,y:g.mid.y-center.y-g.view.y},turn),view={...g.view,zoom,x:mid.x-center.x-anchor.x*ratio,y:mid.y-center.y-anchor.y*ratio};
 if(g.view.rotation!==undefined||turn)view.rotation=(g.view.rotation||0)+turn*180/Math.PI;return view;
}
export function canvasCoordinate(svg,doc,view={},e){
 try{const ctm=svg.getScreenCTM?.(),m=ctm?.inverse();if(m&&[m.a,m.b,m.c,m.d,m.e,m.f].every(Number.isFinite))return {x:m.a*e.clientX+m.c*e.clientY+m.e,y:m.b*e.clientX+m.d*e.clientY+m.f};}catch{}
 const r=svg.getBoundingClientRect(),angle=(view.rotation||0)*Math.PI/180;
 if(!angle)return {x:(e.clientX-r.left)*doc.width/Math.max(r.width,1),y:(e.clientY-r.top)*doc.height/Math.max(r.height,1)};
 const extent=Math.abs(Math.cos(angle))*doc.width+Math.abs(Math.sin(angle))*doc.height,scale=r.width/extent||1,p=rotate({x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2},-angle);
 return {x:p.x/scale+doc.width/2,y:p.y/scale+doc.height/2};
}
