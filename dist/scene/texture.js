const pngValidity=new Map();let validityBytes=0;
export function validTextureSource(src){if(typeof src!=='string')return false;if(pngValidity.has(src))return pngValidity.get(src);const valid=/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src);if(src.length<=48*1024*1024){while(pngValidity.size&&(pngValidity.size>=16||validityBytes+src.length>48*1024*1024)){const first=pngValidity.keys().next().value;validityBytes-=first.length;pngValidity.delete(first);}pngValidity.set(src,valid);validityBytes+=src.length;}return valid;}
// Preview-only asset references: the document and portable exports retain data URLs.
export class PreviewImageAssets{
 constructor(){this.assets=new Map();this.used=new Set();}
 begin(){this.used.clear();}
 href(src){if(typeof src!=='string'||!/^data:image\/(png|jpeg|webp|gif|avif|bmp);base64,/.test(src)||!globalThis.URL?.createObjectURL||!globalThis.atob)return src;
 this.used.add(src);if(this.assets.has(src))return this.assets.get(src);try{const split=src.indexOf(','),bytes=atob(src.slice(split+1)),data=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)data[i]=bytes.charCodeAt(i);const url=URL.createObjectURL(new Blob([data],{type:src.slice(5,src.indexOf(';'))}));this.assets.set(src,url);return url;}catch{return src;}}
 sweep(){for(const [src,url] of this.assets)if(!this.used.has(src)){URL.revokeObjectURL(url);this.assets.delete(src);}}
 dispose(){for(const url of this.assets.values())URL.revokeObjectURL(url);this.assets.clear();this.used.clear();}
}
export const textureModes=['cover','fit','stretch','tile'];
export function texturePlacement(texture,b){
 const mode=textureModes.includes(texture.mode)?texture.mode:'cover',scale=Math.max(.05,Math.min(20,Number(texture.scale)||1)),iw=Math.max(1,texture.width),ih=Math.max(1,texture.height),factor=(mode==='cover'?Math.max:Math.min)(b.width/iw,b.height/ih);
 const width=(mode==='stretch'?b.width:iw*factor)*scale,height=(mode==='stretch'?b.height:ih*factor)*scale;
 return {mode,width,height,x:b.x+(b.width-width)/2+(Number(texture.x)||0),y:b.y+(b.height-height)/2+(Number(texture.y)||0)};
}
export function textureSVG(texture,b,shape,id,hasMesh=false,fillRule='nonzero',imageHref){
 if(!texture||!validTextureSource(texture.src))return '';const src=imageHref?imageHref(texture.src):texture.src;
 const p=texturePlacement(texture,b),clip=`texture-clip-${id}`,pattern=`texture-pattern-${id}`,image=`<image href="${src}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="none"/>`,defs=`<clipPath id="${clip}" clip-rule="${fillRule==='evenodd'?'evenodd':'nonzero'}">${shape.replace(/<(rect|ellipse|path)\b/,'<$1 fill="white" stroke="none"')}</clipPath>`;
 const paint=p.mode==='tile'?`<defs><pattern id="${pattern}" patternUnits="userSpaceOnUse" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"><image href="${src}" width="${p.width}" height="${p.height}" preserveAspectRatio="none"/></pattern></defs><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="url(#${pattern})"/>`:image;
 return `<defs>${defs}</defs><g stroke="none" fill="none" clip-path="url(#${clip})" ${hasMesh?'style="mix-blend-mode:multiply"':''}>${paint}</g>`;
}
export async function importTexture(file){
 if(!file||file.size>30*1024*1024)throw Error('Choose an image smaller than 30 MB.');
 if(!['image/png','image/jpeg','image/webp','image/gif','image/avif','image/bmp'].includes(file.type))throw Error('Choose a PNG, JPEG, WebP, GIF, AVIF or BMP image.');
 const url=URL.createObjectURL(file);let image;
 try{image=new Image();image.src=url;await image.decode();const w=image.naturalWidth,h=image.naturalHeight;if(!w||!h||w*h>80_000_000)throw Error('This image is too large to import.');const ratio=Math.min(1,2048/Math.max(w,h)),width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);return {src:canvas.toDataURL('image/png'),width,height,mode:'cover',scale:1,x:0,y:0};}finally{URL.revokeObjectURL(url);}
}
