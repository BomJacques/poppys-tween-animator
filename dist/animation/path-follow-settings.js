export const pathFollowRanges={followProgress:[-100000,100000],followOffset:[-10000,10000],followNoiseAmount:[0,2000],followNoiseSize:[2,10000],followNoiseSpeed:[-60,60],followNoiseSeed:[-1000000,1000000]};
export const pathFollowDefaults={followProgress:0,followOffset:0,followNoiseAmount:0,followNoiseSize:80,followNoiseSpeed:1,followNoiseSeed:1};
export function validPathFollowValue(prop,value){const range=pathFollowRanges[prop];return !!range&&Number.isFinite(value)&&value>=range[0]&&value<=range[1];}
export function pathFollowSettings(n){const values={};for(const [prop,range] of Object.entries(pathFollowRanges))values[prop]=Number.isFinite(n[prop])?Math.max(range[0],Math.min(range[1],n[prop])):pathFollowDefaults[prop];return values;}
