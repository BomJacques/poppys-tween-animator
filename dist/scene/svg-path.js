// Normalize SVG commands to editable anchors and cubic handles, preserving subpaths.
export function parsePath(d){
 const tokens=d.match(/[a-zA-Z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[],nodes=[];let i=0,cmd='',x=0,y=0,start=null,last='',q=null;
 const num=()=>{const v=Number(tokens[i++]);if(!Number.isFinite(v))throw Error('Invalid SVG path number.');return v;};
 const add=(p,c1,c2)=>{if(c1&&nodes.length)nodes.at(-1).out=c1;if(c2)p.in=c2;nodes.push(p);x=p.x;y=p.y;};
 while(i<tokens.length){if(/^[a-z]$/i.test(tokens[i]))cmd=tokens[i++];if(!cmd)throw Error('Invalid SVG path command.');const relative=cmd===cmd.toLowerCase(),kind=cmd.toUpperCase(),ox=x,oy=y,pt=()=>({x:num()+(relative?ox:0),y:num()+(relative?oy:0)});
  if(kind==='Z'){if(start&&nodes.length){nodes.at(-1).close=true;x=start.x;y=start.y;}cmd='';last='Z';q=null;continue;}
  if(kind==='M'){const p=pt();p.move=true;add(p);start=p;cmd=relative?'l':'L';}
  else if(kind==='L')add(pt());
  else if(kind==='H')add({x:num()+(relative?ox:0),y});
  else if(kind==='V')add({x,y:num()+(relative?oy:0)});
  else if(kind==='C'){const a=pt(),b=pt(),p=pt();add(p,a,b);}
  else if(kind==='S'){const prev=nodes.at(-1),a=['C','S'].includes(last)&&prev?.in?{x:2*x-prev.in.x,y:2*y-prev.in.y}:{x,y},b=pt(),p=pt();add(p,a,b);}
  else if(kind==='Q'||kind==='T'){const control=kind==='Q'?pt():['Q','T'].includes(last)&&q?{x:2*x-q.x,y:2*y-q.y}:{x,y},p=pt();add(p,{x:ox+2/3*(control.x-ox),y:oy+2/3*(control.y-oy)},{x:p.x+2/3*(control.x-p.x),y:p.y+2/3*(control.y-p.y)});q=control;}
  else if(kind==='A'){let rx=Math.abs(num()),ry=Math.abs(num());const phi=num()*Math.PI/180,large=num(),sweep=num(),p=pt();if((large!==0&&large!==1)||(sweep!==0&&sweep!==1))throw Error('Invalid SVG arc flags.');if(!rx||!ry)add(p);else if(p.x!==x||p.y!==y){const cos=Math.cos(phi),sin=Math.sin(phi),xp=cos*(x-p.x)/2+sin*(y-p.y)/2,yp=-sin*(x-p.x)/2+cos*(y-p.y)/2,scale=Math.sqrt(xp*xp/(rx*rx)+yp*yp/(ry*ry));if(scale>1){rx*=scale;ry*=scale;}const coef=(large===sweep?-1:1)*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp))),cxp=coef*rx*yp/ry,cyp=-coef*ry*xp/rx,cx=cos*cxp-sin*cyp+(x+p.x)/2,cy=sin*cxp+cos*cyp+(y+p.y)/2,angle=(ax,ay,bx,by)=>Math.atan2(ax*by-ay*bx,ax*bx+ay*by);let t=angle(1,0,(xp-cxp)/rx,(yp-cyp)/ry),dt=angle((xp-cxp)/rx,(yp-cyp)/ry,(-xp-cxp)/rx,(-yp-cyp)/ry);if(!sweep&&dt>0)dt-=Math.PI*2;if(sweep&&dt<0)dt+=Math.PI*2;const count=Math.ceil(Math.abs(dt)/(Math.PI/2)),step=dt/count,at=t=>({x:cx+rx*cos*Math.cos(t)-ry*sin*Math.sin(t),y:cy+rx*sin*Math.cos(t)+ry*cos*Math.sin(t)}),der=t=>({x:-rx*cos*Math.sin(t)-ry*sin*Math.cos(t),y:-rx*sin*Math.sin(t)+ry*cos*Math.cos(t)});for(let k=0;k<count;k++){const a=at(t),b=at(t+step),da=der(t),db=der(t+step),f=4/3*Math.tan(step/4);add(k===count-1?p:b,{x:a.x+f*da.x,y:a.y+f*da.y},{x:b.x-f*db.x,y:b.y-f*db.y});t+=step;}}}
  else throw Error('Unsupported SVG path command: '+cmd);
  if(kind!=='Q'&&kind!=='T')q=null;last=kind;if(nodes.length>20000)throw Error('Too many path points.');
 }
 return nodes;
}
