export const textureModes=['cover','fit','stretch','tile'];
export function texturePlacement(texture,b){
 const mode=textureModes.includes(texture.mode)?texture.mode:'cover',scale=Math.max(.05,Math.min(20,Number(texture.scale)||1)),iw=Math.max(1,texture.width),ih=Math.max(1,texture.height),factor=(mode==='cover'?Math.max:Math.min)(b.width/iw,b.height/ih);
 const width=(mode==='stretch'?b.width:iw*factor)*scale,height=(mode==='stretch'?b.height:ih*factor)*scale;
 return {mode,width,height,x:b.x+(b.width-width)/2+(Number(texture.x)||0),y:b.y+(b.height-height)/2+(Number(texture.y)||0)};
}
export function textureSVG(texture,b,shape,id,hasMesh=false,fillRule='nonzero'){
 if(!texture||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(texture.src||''))return '';
 const p=texturePlacement(texture,b),clip=`texture-clip-${id}`,pattern=`texture-pattern-${id}`,image=`<image href="${texture.src}" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}" preserveAspectRatio="none"/>`,defs=`<clipPath id="${clip}" clip-rule="${fillRule==='evenodd'?'evenodd':'nonzero'}">${shape.replace(/<(rect|ellipse|path)\b/,'<$1 fill="white" stroke="none"')}</clipPath>`;
 const paint=p.mode==='tile'?`<defs><pattern id="${pattern}" patternUnits="userSpaceOnUse" x="${p.x}" y="${p.y}" width="${p.width}" height="${p.height}"><image href="${texture.src}" width="${p.width}" height="${p.height}" preserveAspectRatio="none"/></pattern></defs><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="url(#${pattern})"/>`:image;
 return `<defs>${defs}</defs><g stroke="none" fill="none" clip-path="url(#${clip})" ${hasMesh?'style="mix-blend-mode:multiply"':''}>${paint}</g>`;
}
export async function importTexture(file){
 if(!file||file.size>30*1024*1024)throw Error('Choose an image smaller than 30 MB.');
 if(!['image/png','image/jpeg','image/webp','image/gif','image/avif','image/bmp'].includes(file.type))throw Error('Choose a PNG, JPEG, WebP, GIF, AVIF or BMP image.');
 const url=URL.createObjectURL(file);let image;
 try{image=new Image();image.src=url;await image.decode();const w=image.naturalWidth,h=image.naturalHeight;if(!w||!h||w*h>80_000_000)throw Error('This image is too large to import.');const ratio=Math.min(1,2048/Math.max(w,h)),width=Math.max(1,Math.round(w*ratio)),height=Math.max(1,Math.round(h*ratio)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;canvas.getContext('2d').drawImage(image,0,0,width,height);return {src:canvas.toDataURL('image/png'),width,height,mode:'cover',scale:1,x:0,y:0};}finally{URL.revokeObjectURL(url);}
}
