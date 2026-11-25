import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {cardEditorSections} from '../card-editor-sections.js';
import {makeCardDraft,validateCardDraft} from '../card-page-model.js';
const source=fs.readFileSync('app.js','utf8');
const line=name=>source.split('\n').find(l=>l.startsWith(name));
const listeners={},types=['profession','biology','health','hobby','fact','baggage','bunker','special','disaster','custom_test'];
let saved;
const ctx={requiresCardDescription:id=>!['profession','biology','health','hobby','baggage'].includes(id),cardEditorSections,makeCardDraft,validateCardDraft,console,structuredClone,section:'profession',opened:'c',pack:{id:'p',cards:{}},cats:types.map(id=>({id,name:id})),template:{mechanic:'Fixed'},esc:v=>String(v??''),icon:()=>'',btn:(label,_cls='',attrs='')=>'<button '+attrs+'>'+label+'</button>',supportsTable:()=>true,typePicker:()=>'',media:()=>'<div>single bunker image</div>',rangeSelector:(_,kind)=>kind,normalizeDisaster(){},disasterImageFields:()=>'<div>four disaster images</div>',persist(){saved=JSON.stringify(ctx.pack);},openCard(){},render(){},toast(message){throw Error(message);},document:{addEventListener:(event,fn)=>(listeners[event]??=[]).push(fn)},disasterAssetUrls:new Map()};
const code=line('function field(')+'\n'+source.slice(source.indexOf('function editor(c){'),source.indexOf('\nfunction ',source.indexOf('function editor(c){')+1))+'\n'+source.slice(source.indexOf('function validateConstructorCard('));
vm.createContext(ctx);vm.runInContext(code,ctx);
function node(data={},checked=false){return {dataset:data,checked,value:'',tagName:'INPUT',closest:()=>({dataset:{constructorCard:'c'}}),hasAttribute:name=>Object.hasOwn(data,name.replace(/^data-/, '').replace(/-([a-z])/g,(_,c)=>c.toUpperCase()))};}
for(const type of types){ctx.section=type;ctx.pack.cards[type]=[{id:'c',name:'Card',description:''}];const html=ctx.editor(ctx.pack.cards[type][0]);assert.ok(html.includes('maxlength="30"'));assert.ok(html.includes('maxlength="'+(type==='disaster'?1200:130)+'"'));assert.equal(html.includes('data-card-relation'),type==='bunker');assert.equal(html.includes('data-tasks-enabled'),type==='disaster');assert.equal(html.includes('data-traits-enabled'),type==='disaster');assert.equal(html.includes('data-constructor-audio'),type==='disaster');assert.equal(html.includes('single bunker image'),type==='bunker');assert.equal(html.includes('four disaster images'),type==='disaster');if(type==='disaster')assert.ok(html.includes('bunkerArea'));}
ctx.section='disaster';
for(const key of ['traitsEnabled','tasksEnabled'])for(const fn of listeners.change)await fn({target:node({[key]:'true'},true)});
for(const action of ['add-task','add-trait'])for(const fn of listeners.click)fn({target:{closest:()=>node({cardPage:action})}});
for(const [data,value] of [[{taskIndex:'0',taskKey:'title'},'Task'],[{taskIndex:'0',taskKey:'description'},'x'.repeat(240)],[{cardTrait:'0'},'Medical training']]){const n=node(data);n.value=value;for(const fn of listeners.input)fn({target:n});}
const restored=JSON.parse(saved).cards.disaster[0];assert.equal(restored.tasks[0].description.length,240);assert.equal(restored.helpful_traits[0],'Medical training');assert.ok(ctx.editor(restored).includes('Medical training'));ctx.pack.cards.disaster[0].description='Описание катастрофы';assert.ok(ctx.validateConstructorCard('c'));
ctx.pack.cards.disaster[0].tasks[0].description+='x';assert.throws(()=>ctx.validateConstructorCard('c'),/240/);
ctx.section='bunker';for(const fn of listeners.change)await fn({target:node({cardRelation:''},true)});assert.ok(ctx.editor(ctx.pack.cards.bunker[0]).includes('{1}, {2}, {3}'));
console.log('Constructor: all ten types, limits, visibility, toggles, tasks/traits persistence, validation and relationship guidance passed.');
