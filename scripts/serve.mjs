import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
const root=resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};
createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'); const p=resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname)); if(!p.startsWith(root+'/')){res.writeHead(403).end();return;} const b=await readFile(p);res.writeHead(200,{'Content-Type':types[extname(p)]||'application/octet-stream'}).end(b);}catch{res.writeHead(404).end('Not found');}}).listen(3000,'127.0.0.1',()=>console.log('http://localhost:3000'));
