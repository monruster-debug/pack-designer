import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {copyText} from '../clipboard.js';

const full='ffc56a1e-0c2e-4cbe-8236-b31cb834f77a';
const originalNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
const originalDocument=globalThis.document;
let copied,removed=false,focused=false;
try{
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
 await copyText(full);assert.equal(copied,full);
 const field={style:{},select(){copied=this.value;},remove(){removed=true;}};
 globalThis.document={activeElement:{focus(){focused=true;}},getSelection:()=>null,querySelector:()=>null,body:{append(){}},createElement:()=>field,execCommand:()=>true};
 globalThis.navigator.clipboard=undefined;
 copied=null;await copyText(full);assert.equal(copied,full);assert.ok(removed&&focused);
 globalThis.document.execCommand=()=>false;
 await assert.rejects(copyText(full),/Не удалось/);
 globalThis.navigator.clipboard={writeText:async()=>{throw new Error('Permission denied');}};
 globalThis.document.execCommand=()=>true;
 await copyText(full);assert.equal(copied,full,'Clipboard denial may fall back to selection');
 const source=fs.readFileSync('admin.js','utf8');
 const idCell=source.slice(source.indexOf(' function idCell('),source.indexOf(' function cardRow('));
 const ctx={esc:s=>s,icon:()=>'',btn:(text,cls,data)=>'<button class="'+cls+'" '+data+'>'+text+'</button>'};
 vm.createContext(ctx);vm.runInContext(idCell+';globalThis.renderId=idCell;',ctx);
 const html=ctx.renderId(full);
 assert.ok(html.includes('>'+full+'</code>'),'Let CSS ellipsis fill the available ID cell instead of a hardcoded prefix');
 assert.ok(html.includes('data-admin-id="'+full+'"'));
 assert.ok(html.includes('title="'+full+'"'));
 assert.ok(ctx.renderId('100042').includes('>100042</code>'));
 assert.match(source,/admin-table--'\+tab/);
 console.log('Admin IDs: short display, full copy payload, native clipboard, HTTP fallback, denial and focus restoration passed.');
}finally{
 if(originalNavigator)Object.defineProperty(globalThis,'navigator',originalNavigator);else delete globalThis.navigator;
 globalThis.document=originalDocument;
}
