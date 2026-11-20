import {cardEditorSections} from '../card-editor-sections.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {makeCardDraft,validateCardDraft} from '../card-page-model.js';
import * as model from '../admin-model.js';
import {validateAudioFile} from '../card-audio.js';
validateAudioFile({type:'audio/mpeg',size:2*1024*1024});
assert.throws(()=>validateAudioFile({type:'audio/mpeg',size:2*1024*1024+1}),/2 МБ/);
assert.throws(()=>validateAudioFile({type:'audio/mpeg',size:0}),/непустым/);
assert.throws(()=>validateAudioFile({type:'text/html',size:100}),/MP3/);

const types=[{id:'profession',name:'Профессия'},{id:'bunker',name:'Бункер'},{id:'disaster',name:'Катастрофы'}];
const original={id:'card-42',name:'Врач',description:'Помогает людям',type:'profession',packIds:['p'],short_description:'Кратко',helpful_traits:[{name:'Медицина',weight:2}],relation:true,players_count:2,customValue:{preserve:true}};
const draft=makeCardDraft(original);draft.description='Новое описание';
const record=validateCardDraft(draft,types,['p']);
assert.equal(original.description,'Помогает людям','Editing a draft does not change live cards');
assert.deepEqual(record.helpful_traits,original.helpful_traits);assert.deepEqual(record.customValue,original.customValue);
assert.equal(record.short_description,'Кратко');assert.equal(record.players_count,2);
assert.equal(makeCardDraft(original).helpful_traits_enabled,true);
assert.equal(makeCardDraft({}).helpful_traits_enabled,false);
assert.deepEqual(validateCardDraft({...draft,helpful_traits_enabled:false},types,['p']).helpful_traits,[]);
assert.equal(draft.helpful_traits.length,1,'Disabling traits does not erase the draft');
assert.equal(validateCardDraft({...draft,tasks_enabled:true,tasks:[{title:'Цель',description:'я'.repeat(240)}]},types,['p']).tasks[0].description.length,240);
assert.throws(()=>validateCardDraft({...draft,tasks_enabled:true,tasks:[{title:'Цель',description:'я'.repeat(241)}]},types,['p']),/240/);
assert.throws(()=>validateCardDraft({...draft,tasks_enabled:true,tasks:[{title:' ',description:''}]},types,['p']),/название каждой задачи/);
assert.throws(()=>validateCardDraft({...draft,name:' '},types,['p']),/название/);
assert.equal(validateCardDraft({...draft,name:'я'.repeat(30),description:'я'.repeat(130)},types,['p']).name.length,30);
assert.throws(()=>validateCardDraft({...draft,name:'я'.repeat(31)},types,['p']),/30/);
assert.throws(()=>validateCardDraft({...draft,description:'я'.repeat(131)},types,['p']),/130/);
assert.equal(validateCardDraft({...draft,type:'disaster',description:'я'.repeat(1200)},types,['p']).description.length,1200);
assert.throws(()=>validateCardDraft({...draft,type:'disaster',description:'я'.repeat(1201)},types,['p']),/1200/);
assert.throws(()=>validateCardDraft({...draft,players_count:1.5},types,['p']),/целым/);
const moved=validateCardDraft({...draft,type:'profession',image:'data:image/png;base64,x',images:{start:{}},extraImages:['x']},types,['p']);
assert.ok(!('image' in moved)&&!('images' in moved)&&!('extraImages' in moved));
assert.equal(validateCardDraft({...draft,relation:false},types,['p']).players_count,0);

// Run the actual controller with DOM doubles to verify a deep link opens a page,
// uses the existing form stages and saves once through the shared transaction.
const nodes=new Map(),listeners={},captureClicks=[],storage=new Map();let committed,modalCalls=0;
function node(key){if(!nodes.has(key))nodes.set(key,{innerHTML:'',open:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},close(){this.open=false;}});return nodes.get(key);}
const context={...model,pageSize:model.ADMIN_PAGE_SIZE,makeCardDraft,validateCardDraft,cardEditorSections,URL,URLSearchParams,structuredClone,console,
 location:new URL('http://127.0.0.1:5174/?admin=cards#card/card-42'),
 document:{body:{dataset:{section:'admin-cards'},classList:{add(){},remove(){}}},querySelector:node,getElementById:()=>null,addEventListener:(name,fn,capture)=>{if(name==='click'&&capture)captureClicks.push(fn);else(listeners[name]??=[]).push(fn);}},
 window:{addEventListener(){},scrollTo(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 enhancePackSelect(){},copyText:async()=>{}
};
context.history={pushState:(_,__,url)=>context.location=new URL(url),replaceState:(_,__,url)=>context.location=new URL(url)};
const source=fs.readFileSync('admin.js','utf8').replace(/^import .*?;\r?\n/gm,'').replace('export function createAdminSections','function createAdminSections');
vm.createContext(context);vm.runInContext(source+';globalThis.create=createAdminSections;',context);
const controller=context.create({library:[{id:'p',name:'Пак',customTypes:[],cards:{profession:[original]}}],categories:types,
 heading:title=>'<h1>'+title+'</h1>',btn:(text,cls='',data='')=>'<button class="btn '+cls+'" '+data+'>'+text+'</button>',icon:()=>'',esc:value=>String(value??''),uid:()=> 'new-card',
 showModal:()=>modalCalls++,toast(){},decorateKitControls(){},onCounts(){},imageSpecs:[],rangeConfig:{},imageUrl:()=>'',prepareImage:async()=>{},prepareAudio:async file=>({assetId:'audio-test',name:file.name,bytes:file.size,mime:file.type}),commitCard:record=>committed=record});
controller.render('cards');
const html=node('#page').innerHTML;
assert.ok(html.includes('admin-card-form'));assert.ok(!html.includes('Краткое описание'));
assert.ok(html.includes('maxlength="30"'));assert.ok(html.includes('maxlength="130"'));
assert.ok(html.includes('«Раса» вместо «Профессия»'));
assert.ok(html.includes('base-checkbox__mark'));
assert.ok(html.includes('admin-editor-grid admin-card-basics'));
assert.ok(html.includes('</div><p id="admin-card-category_name-hint"'));
assert.ok(html.includes('aria-describedby="admin-card-description-hint"'));
assert.ok(html.includes('id="admin-card-description-hint" class="hint">Не более 130 символов.'));
assert.ok(!html.includes('placeholder="До 130 символов"'));
assert.ok(!html.includes('Черновик'));
assert.ok(!html.includes('Полезные характеристики'));assert.ok(!html.includes('Взаимоотношения'));
assert.ok(html.includes('Входит в паки'));assert.equal(modalCalls,0,'Edit opens a page, not a popup');
assert.ok(!html.includes('Аудиоозвучка'));
for(const type of ['bunker','disaster','profession']){
 for(const handler of listeners.change)await handler({target:{value:type,dataset:{cardKey:'type'},closest:()=>({}),hasAttribute:()=>false}});
 const form=node('#page').innerHTML;
 assert.equal(form.includes('Использовать взаимоотношения'),type==='bunker');
 assert.ok(form.includes('maxlength="'+(type==='disaster'?1200:130)+'"'));
}
for(const handler of listeners.change)await handler({target:{value:'disaster',dataset:{cardKey:'type'},closest:()=>({}),hasAttribute:()=>false}});
for(const handler of listeners.change)await handler({target:{dataset:{},closest:()=>({}),hasAttribute:name=>name==='data-card-audio',files:[{name:'Озвучка.mp3',type:'audio/mpeg',size:1024}]}});
assert.ok(node('#page').innerHTML.includes('Озвучка.mp3'));
assert.match(node('#page').innerHTML,/<audio[^>]+controls/);
for(const handler of listeners.input)handler({target:{id:'admin-card-description',value:'Обновлено',dataset:{cardKey:'description'},closest:()=>({}),setCustomValidity(){}}});
for(const handler of listeners.submit)handler({target:{id:'admin-card-form'},preventDefault(){}});
assert.equal(committed.description,'Обновлено');assert.equal(committed.short_description,'Кратко','Hidden legacy field remains intact');assert.deepEqual(committed.helpful_traits,original.helpful_traits);
assert.equal(committed.audio_guide.assetId,'audio-test');
assert.equal(context.location.hash,'','Save returns to the list');
assert.ok(node('#page').innerHTML.includes('admin-results'));
// Confirmation controls stay within the existing shared modal and leave the draft intact.
context.location=new URL('http://127.0.0.1:5174/?admin=cards#card/card-42');
controller.render('cards');
for(const handler of listeners.input)handler({target:{value:'Не сохранять',dataset:{cardKey:'name'},closest:()=>({}),setCustomValidity(){}}});
function clickPage(action){
 let stopped=false;
 const event={target:{closest:selector=>selector==='[data-card-page]'?{dataset:{cardPage:action}}:selector.split(',').includes('[data-section]')?context.document.body:null},preventDefault(){},stopImmediatePropagation(){stopped=true;}};
 for(const handler of captureClicks)handler(event);
 assert.equal(stopped,false,'Body data-section must not intercept editor or modal controls');
 for(const handler of listeners.click)handler(event);
}
clickPage('back');
assert.ok(node('#modal .modal-footer').innerHTML.includes('>Остаться</button>'));
assert.ok(node('#modal .modal-footer').innerHTML.includes('>Выйти</button>'));
node('#modal').open=true;clickPage('stay');
assert.equal(node('#modal').open,false);assert.ok(context.location.hash.includes('card-42'));
assert.equal(committed.name,'Врач','Staying must not save or discard the draft');
clickPage('back');node('#modal').open=true;clickPage('discard');
assert.equal(node('#modal').open,false);assert.equal(context.location.hash,'');
assert.equal(committed.name,'Врач','Discarding must not commit the draft');
console.log('Card page: deep link, page form (no modal), draft isolation, metadata/traits/relations, image restrictions, save and list return passed.');
