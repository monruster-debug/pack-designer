import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import assert from 'node:assert/strict';

const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'dist');
const port=process.env.CHECK_PORT||'5196';
const server=spawn(process.execPath,[path.join(root,'server.mjs')],{cwd:output,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
let errors='';server.stderr.on('data',data=>{errors+=data;});
try{
 await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw Error('Preview failed: '+errors);}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(Error('Preview startup timed out')),10000);timer.unref();})]);
 const files=await readdir(output,{recursive:true,withFileTypes:true});let count=0;
 for(const entry of files){
  if(!entry.isFile())continue;
  const filename=path.join(entry.parentPath,entry.name),relative=path.relative(output,filename).split(path.sep).map(encodeURIComponent).join('/');
  const response=await fetch('http://127.0.0.1:'+port+'/'+relative,{signal:AbortSignal.timeout(5000)});
  assert.equal(response.status,200,relative);
  const body=Buffer.from(await response.arrayBuffer());assert.deepEqual(body,await readFile(filename),relative+' response differs from build');count++;
 }
 const api=await fetch('http://127.0.0.1:'+port+'/api/catalog-banner',{signal:AbortSignal.timeout(5000)});
 assert.equal(api.status,200);assert.equal(typeof (await api.json()).image,'string');
 const denied=await fetch('http://127.0.0.1:'+port+'/api/catalog-banner',{method:'PUT',body:'{}',signal:AbortSignal.timeout(5000)});
 assert.equal(denied.status,403);
 console.log('Build HTTP: '+count+' files match dist; banner read and unauthorized write checks passed.');
}finally{server.kill();}
