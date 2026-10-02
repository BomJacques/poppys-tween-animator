import {evaluated,setProperty,enableTrack,allTracks} from '../animation/evaluate.js';
import {world,point,inverse,multiply,identity} from './matrix.js';
import {locate} from '../document/model.js';

export function movePivot(project,n,position,time=0){
 if(!Number.isFinite(position.x)||!Number.isFinite(position.y))throw Error('Choose a finite pivot.');
 const v=evaluated(n,time),before=point(world(project,n.id,time),{x:0,y:0});
 if(time>0&&allTracks(n).some(t=>Object.values(t).some(keys=>keys.length)))for(const prop of ['anchorX','anchorY','x','y'])enableTrack(n,prop,time);
 setProperty(n,'anchorX',position.x,time);setProperty(n,'anchorY',position.y,time);
 const after=point(world(project,n.id,time),{x:0,y:0}),entry=locate(project,n.id),parent=entry.parent?world(project,entry.parent.id,time):identity(),inv=inverse(multiply(parent,n.prefix||identity())),d=point(inv,{x:before.x-after.x,y:before.y-after.y}),zero=point(inv,{x:0,y:0});
 setProperty(n,'x',v.x+d.x-zero.x,time);setProperty(n,'y',v.y+d.y-zero.y,time);
}
