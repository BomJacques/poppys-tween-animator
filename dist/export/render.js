import {sceneSVG} from '../renderer/svg.js';
export class FrameRenderer{constructor(p,width,height){this.p=p;this.canvas=document.createElement('canvas');this.canvas.width=width;this.canvas.height=height;this.ctx=this.canvas.getContext('2d',{alpha:false});this.image=new Image();}
async frame(time){const url=URL.createObjectURL(new Blob([sceneSVG(this.p,time)],{type:'image/svg+xml'}));try{this.image.src=url;await this.image.decode();const c=this.canvas,ctx=this.ctx;ctx.fillStyle=this.p.background;ctx.fillRect(0,0,c.width,c.height);const scale=Math.min(c.width/this.p.width,c.height/this.p.height),w=this.p.width*scale,h=this.p.height*scale;ctx.drawImage(this.image,(c.width-w)/2,(c.height-h)/2,w,h);return c;}finally{URL.revokeObjectURL(url);}}
}
