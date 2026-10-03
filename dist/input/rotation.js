// Preserve winding across atan2's +/-180 degree boundary. Snap only the
// displayed/applied value; keep unsnapped pointer travel for the next sample.
export function continueRotation(gesture,pointer,pivot){
 if(Math.hypot(pointer.x-pivot.x,pointer.y-pivot.y)<1e-7)return gesture.v.rotation+(gesture.rotationTravel||0)*180/Math.PI;
 const angle=Math.atan2(pointer.y-pivot.y,pointer.x-pivot.x),previous=gesture.rotationAngle??Math.atan2(gesture.start.y-pivot.y,gesture.start.x-pivot.x);
 let delta=angle-previous;if(delta>Math.PI)delta-=2*Math.PI;else if(delta<-Math.PI)delta+=2*Math.PI;
 gesture.rotationAngle=angle;gesture.rotationTravel=(gesture.rotationTravel||0)+delta;
 return gesture.v.rotation+gesture.rotationTravel*180/Math.PI;
}
export function rotationReadout(degrees){
 const rounded=Math.round(degrees*100)/100,turns=Math.trunc(rounded/360),remainder=Math.round((rounded-turns*360)*100)/100;
 return `${turns} ${Math.abs(turns)===1?'turn':'turns'} · ${remainder}°`;
}
