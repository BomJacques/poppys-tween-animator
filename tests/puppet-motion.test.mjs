import test from 'node:test';
import assert from 'node:assert/strict';
import {pose,motions,motionPhase,puppetSVG} from '../dist/reference/puppet.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const ground=(p,s)=>Math.min(p[s+'Heel'].y,p[s+'Toe'].y);
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);

test('every cycle is deterministic, periodic and continuous at the loop join',()=>{
 for(const motion of motions){assert.deepEqual(pose(motion,0),pose(motion,1));for(const phase of [.07,.31,.74]){const a=pose(motion,phase),b=pose(motion,phase+3);for(const joint of Object.keys(a))for(const axis of ['x','y','z'])near(a[joint][axis],b[joint][axis]);assert.deepEqual(a,pose(motion,phase));}
  const before=pose(motion,1-1e-6),at=pose(motion,0),after=pose(motion,1e-6);for(const name of Object.keys(at)){assert.ok(distance(before[name],at[name])<.0001);assert.ok(distance(after[name],at[name])<.0001);for(const axis of ['x','y','z'])near((at[name][axis]-before[name][axis])/1e-6,(after[name][axis]-at[name][axis])/1e-6,.005);}
 }
});

test('jointed limbs keep their lengths throughout every movement',()=>{
 for(const motion of motions)for(let frame=0;frame<240;frame++){const p=pose(motion,frame/240);for(const s of ['L','R']){near(distance(p[s+'Hip'],p[s+'Knee']),.52);near(distance(p[s+'Knee'],p[s+'Ankle']),.52);near(distance(p[s+'Shoulder'],p[s+'Elbow']),.32);near(distance(p[s+'Elbow'],p[s+'Hand']),.29);assert.ok(ground(p,s)>=.019999999,'A foot penetrates the ground');}}
});

test('walking always has support and planted feet have constant floor-relative velocity',()=>{
 for(let i=0;i<240;i++){const p=pose('walk',i/240);assert.ok(Math.min(ground(p,'L'),ground(p,'R'))<.020001,'Walking must not have an airborne phase');}
 const phases=[.18,.23,.28,.33],positions=phases.map(q=>pose('walk',q).LAnkle.z),speed=(positions[0]-positions[1])/(phases[1]-phases[0]);assert.ok(speed>0);
 for(let i=1;i<phases.length;i++)near(positions[i]+speed*phases[i],positions[0]+speed*phases[0]);
 const contact=pose('walk',0);assert.ok(contact.LToe.y>contact.LHeel.y,'Heel contacts before the toe');const push=pose('walk',.6);assert.ok(push.LHeel.y>push.LToe.y,'Heel lifts before toe-off');
});

test('contact, impact, passing and push-off visibly transfer body weight',()=>{
 const contact=pose('walk',0),down=pose('walk',.09),passing=pose('walk',.25),up=pose('walk',.4);
 assert.ok(down.pelvis.y<contact.pelvis.y-.03,'Impact should compress the body');assert.ok(passing.pelvis.y>down.pelvis.y);assert.ok(up.pelvis.y>passing.pelvis.y);
 assert.ok(Math.abs(passing.pelvis.x-passing.LAnkle.x)<Math.abs(passing.pelvis.x-passing.RAnkle.x),'Weight shifts toward the supporting leg');assert.ok(ground(passing,'R')>.04,'Passing leg clears the support foot');
 const rise=pose('walk',.7),apex=pose('walk',.81),fall=pose('walk',.92);assert.ok(ground(apex,'L')>ground(rise,'L'));assert.ok(ground(apex,'L')>ground(fall,'L'),'Swing foot follows an arc');
});

test('arms oppose the legs and the hands follow through after the elbows',()=>{
 for(const phase of [0,.12,.5,.62]){const p=pose('walk',phase);for(const s of ['L','R'])assert.ok((p[s+'Ankle'].z-p[s+'Hip'].z)*(p[s+'Hand'].z-p[s+'Shoulder'].z)<0);}
 let elbowPeak=-Infinity,handPeak=-Infinity,elbowPhase=0,handPhase=0;for(let i=0;i<1000;i++){const p=pose('walk',i/1000),elbow=p.LElbow.z-p.LShoulder.z,hand=p.LHand.z-p.LShoulder.z;if(elbow>elbowPeak){elbowPeak=elbow;elbowPhase=i/1000;}if(hand>handPeak){handPeak=hand;handPhase=i/1000;}}
 assert.ok(handPhase>elbowPhase+.002,'Hands should lag the upper arm rather than reverse in lockstep');
});

test('run and sprint include flight, shorter support and stronger recovery than walking',()=>{
 const samples=motion=>Array.from({length:240},(_,i)=>pose(motion,i/240));const walk=samples('walk'),run=samples('run'),sprint=samples('sprint'),flight=list=>list.filter(p=>ground(p,'L')>.020001&&ground(p,'R')>.020001).length,clearance=list=>Math.max(...list.map(p=>ground(p,'L')));
 assert.equal(flight(walk),0);assert.ok(flight(run)>20);assert.ok(flight(sprint)>flight(run));assert.ok(clearance(run)>clearance(walk));assert.ok(clearance(sprint)>clearance(run));assert.ok(pose('sprint',0).chest.z>pose('run',0).chest.z,'Sprint has a stronger forward lean');
});

test('hop loads before takeoff, tucks in flight and compresses after landing',()=>{
 const rest=pose('hop',0),load=pose('hop',.14),launch=pose('hop',.25),air=pose('hop',.485),land=pose('hop',.72),absorb=pose('hop',.81);
 assert.ok(load.pelvis.y<rest.pelvis.y-.1);assert.ok(air.pelvis.y>launch.pelvis.y+.3);assert.ok(absorb.pelvis.y<land.pelvis.y-.1);for(const s of ['L','R']){near(ground(load,s),.02);near(ground(launch,s),.02);near(ground(land,s),.02);assert.ok(ground(air,s)>.4);assert.ok(launch[s+'Hand'].z>load[s+'Hand'].z+.3);}
});

test('slide stays grounded; pose guide and transparent rotated SVG remain available',()=>{
 for(let i=0;i<120;i++){const p=pose('slide',i/120);for(const s of ['L','R'])near(ground(p,s),.02);}
 assert.match(motionPhase('walk',0),/Contact/);assert.match(motionPhase('hop',.14),/Anticipation/);assert.match(motionPhase('hop',.5),/Flight/);assert.notEqual(puppetSVG('walk',.25,0,false),puppetSVG('walk',.25,90,false));assert.ok(!puppetSVG('walk',0,90,false).includes('M25 359H375'));
});
