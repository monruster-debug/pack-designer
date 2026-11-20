import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(),port=Number(process.env.PORT||5174);
const bannerFile=path.join(root,'.catalog-banner.json');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const sendJson=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const readBanner=async()=>{try{return JSON.parse(await readFile(bannerFile,'utf8')).image||'';}catch{return '';}};
const readRequest=async req=>{let body='';for await(const chunk of req){body+=chunk;if(body.length>1_500_000)throw new Error('Request is too large');}return JSON.parse(body||'{}');};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 if(pathname==='/api/catalog-banner'){
  if(req.method==='GET')return sendJson(res,200,{image:await readBanner()});
  // Local prototype authorization. Production must use the authenticated server session.
  if(req.headers['x-shelter-admin']!=='1')return sendJson(res,403,{error:'Admin access required'});
  if(req.method==='DELETE'){await writeFile(bannerFile,JSON.stringify({image:''}));return sendJson(res,200,{image:''});}
  if(req.method==='PUT'){const {image=''}=await readRequest(req);if(typeof image!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,/.test(image))return sendJson(res,400,{error:'Unsupported image'});await writeFile(bannerFile,JSON.stringify({image}));return sendJson(res,200,{image});}
  return sendJson(res,405,{error:'Method not allowed'});
 }
 const name=pathname==='/'?'index.html':pathname.slice(1);const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));



