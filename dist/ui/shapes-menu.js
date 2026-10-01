const shapes=[['rect','▭','Rectangle','Straight or rounded corners'],['ellipse','◯','Ellipse','Circles and ovals'],['triangle','△','Triangle','Three editable points'],['polygon','⬡','Polygon','Change its number of sides'],['star','☆','Star','Change points and inner radius'],['line','╱','Line','An open two-point path']];
export const shapeTools=shapes.map(s=>s[0]);
export function shapePalette(a){return `<div class="shape-dock" role="group" aria-label="Choose a shape">${shapes.map(([tool,icon,label,note])=>`<button data-shape="${tool}" aria-pressed="${a.tool===tool}" class="${a.tool===tool?'active':''}" title="${note}"><span class="shape-icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`).join('')}</div>`;}
export function chooseShape(a,tool){if(!shapeTools.includes(tool))return;a.stage.finishPath();a.tool=tool;a.nodeEdit=false;a.meshSplit=false;a.activeNode=null;a.shapesOpen=true;a.render();}
export function showShapes(a){a.shapesOpen=!a.shapesOpen;a.render();}
