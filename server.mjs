import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}const p=file===root?path.join(root,'index.html'):file;fs.readFile(p,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(e?'Not found':b);});}).listen(5173,'127.0.0.1',()=>console.log('Poppy preview: http://127.0.0.1:5173'));
