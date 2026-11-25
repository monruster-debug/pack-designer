import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {getAccountUrl} from '../account-url.js';

// Exercise the actual shared renderer with lightweight element doubles.
const source=fs.readFileSync('app.js','utf8');
const nav=source.slice(source.indexOf('function nav(){'),source.indexOf('function navigate(id){'));
const renderer=source.slice(source.indexOf('function render(){'),source.indexOf('function current(){'));
function setup(superadminWorkspace){
 const nodes=new Map(),calls=[];
 function node(selector){if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',dataset:{},classList:{toggle(){}},remove(){},replaceChildren(){this.innerHTML='';},insertAdjacentHTML(_,html){this.innerHTML=html+this.innerHTML;}});return nodes.get(selector);}
 const body={dataset:{},classList:{toggle(){}}};
 const context={section:'catalog',superadminWorkspace,document:{body},window:{location:{href:'http://127.0.0.1:5174/?admin=users'}},getAccountUrl,$:node,
  workshopNav:()=>{node('#navigation').innerHTML='<button class="back-catalog">Мои паки</button>';},
  icon:()=>'',adminSections:{render:tab=>calls.push(tab)},catalogPage:()=>'<div>Каталог паков</div>',suggestionsPage:()=>'',
  about:()=>'<div>Редактор пака</div>',review:()=>'',statisticsPage:()=>'',cardsPage:()=>'',
  mountSectionChecklist(){},refreshMeta(){},decorateSectionEndings(){},decorateKitControls(){}
 };
 vm.createContext(context);vm.runInContext(nav+renderer,context);
 return {context,node,calls};
}
const admin=setup(true);
admin.context.render();
assert.match(admin.node('#page').innerHTML,/Каталог паков/);
for(const label of ['Паки','Карты','Пользователи'])assert.ok(admin.node('#navigation').innerHTML.includes('>'+label+'</span>'));
admin.context.section='about';admin.context.render();
assert.match(admin.node('#page').innerHTML,/Редактор пака/);
assert.doesNotMatch(admin.node('#navigation').innerHTML,/admin-users|admin-cards/,'Pack editor only shows pack navigation');
assert.match(admin.node('#navigation').innerHTML,/back-catalog/,'Keep the way back to the pack catalog');
admin.context.section='admin-cards';admin.context.render();
admin.context.section='admin-users';admin.context.render();
assert.deepEqual(admin.calls,['cards','users']);
assert.equal(admin.node('.header-caption').textContent,'Административная панель');
const player=setup(false);player.context.render();
player.context.section='statistics';player.context.render();
assert.equal(player.context.section,'about','Unauthorized statistics state falls back to the pack editor');
assert.match(player.node('#page').innerHTML,/Редактор пака/);
assert.doesNotMatch(player.node('#navigation').innerHTML,/admin-users|admin-cards/);
assert.equal(player.node('.header-caption').textContent,'Конструктор паков');
for(const screen of ['catalog','about','admin-cards','admin-users']){
 admin.context.section=screen;admin.context.render();
 assert.equal(admin.node('.sidebar-exit').href,'http://127.0.0.1:3000/lk','Local workshop returns to the local account');
 assert.equal(admin.node('.sidebar-exit').dataset.catalog,undefined,'Exit must not behave like return-to-catalog');
}
admin.context.window.SHELTER_MAIN_SITE_URL='http://test.37.230.114.30.nip.io/lk';
admin.context.render();
assert.equal(admin.node('.sidebar-exit').href,admin.context.window.SHELTER_MAIN_SITE_URL,'Respect the configured staging account');
const html=fs.readFileSync('index.html','utf8');
assert.match(html,/<a class="sidebar-exit" href="\/lk"/,'No hardcoded production URL in the native link');
for(const [from,to] of [
 ['http://localhost:5174/','http://localhost:3000/lk'],
 ['http://workshop.test.37.230.114.30.nip.io/?admin=1','http://test.37.230.114.30.nip.io/lk'],
 ['https://shelter42.ru/workshop/?admin=1','https://shelter42.ru/lk'],
 ['https://preview.example/workshop/','https://preview.example/lk']
])assert.equal(getAccountUrl({href:from}),to);
assert.equal(getAccountUrl({href:'http://localhost:5174/'},'javascript:alert(1)'),'http://localhost:3000/lk');
const workshop=source.slice(source.indexOf('function workshopNav(){'),source.indexOf('function nav(){'));
for(const allowed of [false,true]){
 const navigation={innerHTML:''};
 vm.runInNewContext(workshop+';workshopNav()', {section:'about',superadminWorkspace:allowed,$:()=>navigation,icon:()=>'',esc:String,baseCats:[],pack:{customTypes:[]}});
 assert.equal(navigation.innerHTML.includes('data-section="statistics"'),allowed);
}
const navigate=source.split('\n').find(line=>line.startsWith('function navigate(id){'));
const denied={section:'about',superadminWorkspace:false};
vm.runInNewContext(navigate+';navigate("statistics")',denied);
assert.equal(denied.section,'about','Direct navigation cannot bypass the role check');
const statistics=source.slice(source.indexOf('function statisticsPage(){'),source.indexOf('function statisticsChart('));
assert.equal(vm.runInNewContext(statistics+';statisticsPage()', {superadminWorkspace:false}), '','Denied users do not render statistics or read pack metrics');
console.log('Workspace: shared pack catalog/editor and admin sections, persistent navigation, player/admin headings passed.');
