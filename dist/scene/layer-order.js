import {selectionRoots,isLocked,locate} from '../document/model.js';
export const layerOrderNames={front:'Bring to front',forward:'Bring forward',backward:'Send backward',back:'Send to back'};
export function layerOrderPlan(p,ids,action){
 if(!Object.hasOwn(layerOrderNames,action))throw Error('Choose a layer stacking action.');
 const groups=new Map();for(const n of selectionRoots(p,ids)){if(n.reference||isLocked(p,n.id))continue;const {list,parent}=locate(p,n.id);if(!groups.has(list))groups.set(list,{list,parentId:parent?.id||null,selected:new Set()});groups.get(list).selected.add(n.id);}
 const changes=[];for(const group of groups.values()){const {list,selected}=group,before=[...list];let after=[...list];if(action==='front')after=[...list.filter(n=>!selected.has(n.id)),...list.filter(n=>selected.has(n.id))];else if(action==='back')after=[...list.filter(n=>selected.has(n.id)),...list.filter(n=>!selected.has(n.id))];else if(action==='forward'){for(let i=after.length-2;i>=0;i--)if(selected.has(after[i].id)&&!selected.has(after[i+1].id))[after[i],after[i+1]]=[after[i+1],after[i]];}else{for(let i=1;i<after.length;i++)if(selected.has(after[i].id)&&!selected.has(after[i-1].id))[after[i],after[i-1]]=[after[i-1],after[i]];}if(after.some((n,i)=>n!==before[i]))changes.push({list,parentId:group.parentId,before,after});}
 return {action,changes};
}
export function canOrderLayers(p,ids,action){return layerOrderPlan(p,ids,action).changes.length>0;}
export function orderLayers(p,ids,action){const plan=layerOrderPlan(p,ids,action);for(const change of plan.changes)change.list.splice(0,change.list.length,...change.after);return plan.changes.length>0;}
