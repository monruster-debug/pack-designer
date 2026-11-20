import {cardEditorSections} from './card-editor-sections.js';
import {makeCardDraft,validateCardDraft} from './card-page-model.js';
import {enhancePackSelect} from './pack-select.js';
import {copyText} from './clipboard.js';
import {buildCardLibrary,filterAdminCards,changeUser,demoUsers,mergeAdminDemoData,paginateAdmin,ADMIN_PAGE_SIZE as pageSize} from './admin-model.js';

export function createAdminSections({library,importedCards=[],categories,heading,btn,icon,esc,showModal,toast,decorateKitControls,uid,imageUrl,onCounts,commitCard,prepareImage,prepareAudio,imageSpecs,rangeConfig}){
 const $=selector=>document.querySelector(selector),key='shelter42-admin-preview-v1';
 const packs=library.map(p=>({id:p.id,name:p.name}));
 const types=[...categories];
 for(const pack of library)for(const type of pack.customTypes||[])if(!types.some(t=>t.id===type.id))types.push(type);
 let state={cards:buildCardLibrary(library),users:demoUsers(),audit:[]};
 try{const saved=JSON.parse(localStorage.getItem(key));if(saved?.version===1&&Array.isArray(saved.cards)&&Array.isArray(saved.users)&&saved.users.length&&Array.isArray(saved.audit))state=saved;}catch{}
 state=mergeAdminDemoData(state);
 if(!state.databaseImported){const existing=new Set(state.cards.map(c=>c.id));state.cards.push(...importedCards.filter(c=>!existing.has(c.id)));if(importedCards.length)state.databaseImported=true;}
 const userDates=new Map(demoUsers().map(u=>[u.id,u]));
 state.users=state.users.map(u=>({...u,created_at:u.created_at??userDates.get(u.id)?.created_at??null,last_online:u.last_online??userDates.get(u.id)?.last_online??null}));
 let tab=new URLSearchParams(location.search).get('admin')==='users'?'users':'cards',query='',packFilter='',typeFilter='',roleFilter='',statusFilter='',page=1;
 let disposePackSelect,editorDraft=null,editorOriginal='',editorCreating=false,editorRevision=0,pendingUploads=0,pendingLeave=null,audioRevision=0;
 const editorDirty=()=>!!editorDraft&&JSON.stringify(editorDraft)!==editorOriginal;
 const typeName=id=>types.find(t=>t.id===id)?.name||id;
 const packName=id=>packs.find(p=>p.id===id)?.name||'Удалённый пак';
 const roleName=role=>role==='superadmin'?'Суперадмин':'Игрок';
 const button=(label,action,id='',cls='')=>btn(label,(cls.includes('kit-mini')?'':'kit-small ')+cls,'data-admin-action="'+action+'" data-admin-id="'+esc(id)+'"'+(label.startsWith('<span')&&['edit','delete'].includes(action)?' aria-label="'+(action==='edit'?'Редактировать карту':'Удалить карту')+'" title="'+(action==='edit'?'Редактировать карту':'Удалить карту')+'"':'' ));
 const select=(name,label,options,value='')=>'<div class="field"><label class="sr-only" for="admin-'+name+'">'+label+'</label><select id="admin-'+name+'" data-admin-filter="'+name+'">'+options.map(([id,text])=>'<option value="'+esc(id)+'" '+(id===value?'selected':'')+'>'+esc(text)+'</option>').join('')+'</select></div>';
 const badge=(text,cls='')=>'<span class="grid-card-type admin-type-tag admin-status '+(cls==='error'?'is-blocked':'is-active')+'">'+text+'</span>';
 function store(mutate,description,cardChange){
  const previous=structuredClone(state);
  try{mutate();state.audit.unshift({date:new Date().toISOString(),actor:'Shelter42',description});localStorage.setItem(key,JSON.stringify({...state,version:1}));if(cardChange)commitCard(cardChange.record,cardChange.id,types);return true;}
  catch(error){state=previous;try{localStorage.setItem(key,JSON.stringify({...state,version:1}));}catch{}toast(error.name==='QuotaExceededError'?'Не удалось сохранить: хранилище заполнено.':error.message);return false;}
 }
 function filteredUsers(){const needle=query.trim().toLocaleLowerCase('ru-RU');return state.users.filter(u=>(!needle||[u.id,u.nickname].some(v=>v.toLocaleLowerCase('ru-RU').includes(needle)))&&(!roleFilter||u.role===roleFilter)&&(!statusFilter||(statusFilter==='blocked')===u.blocked));}
 function filtered(){return tab==='cards'?filterAdminCards(state.cards,{query,pack:packFilter,type:typeFilter}):filteredUsers();}
 function render(nextTab=tab){
  disposePackSelect?.();
  if(nextTab!==tab){query='';packFilter=typeFilter=roleFilter=statusFilter='';page=1;}
  tab=nextTab;editorDraft=null;editorRevision++;document.body.classList.remove('admin-card-editor-mode');
  for(const pack of library)for(const type of pack.customTypes||[])if(!types.some(t=>t.id===type.id))types.push(type);
  packs.splice(0,packs.length,...library.map(p=>({id:p.id,name:p.name})));
  const unbound=state.cards.filter(c=>!c.packIds.length);
  state.cards=[...buildCardLibrary(library).sort((a,b)=>Number(!!b.adminDemo)-Number(!!a.adminDemo)),...unbound.filter(c=>!library.some(p=>Object.values(p.cards).some(list=>list.some(card=>card.id===c.id))))];
  const match=location.hash.match(/^#card\/(.+)$/);
  if(tab==='cards'&&match){let id;try{id=decodeURIComponent(match[1]);}catch{}if(id==='new'||state.cards.some(c=>c.id===id)){editor(id==='new'?null:id,false);return;}}
  $('#page').innerHTML=heading(tab==='cards'?'Карты':'Пользователи',tab==='cards'?'Общая библиотека. Одна карта может использоваться в нескольких паках.':'Права доступа, блокировки и предупреждения за никнеймы.',tab==='cards'?'cards':'profile','<div class="admin-heading-actions">'+button(icon('list')+'Журнал действий','logs')+(tab==='cards'?button(icon('plus')+'Создать карту','create','','primary'):'')+'</div>')+
   '<section class="panel admin-list"><div class="admin-filters"><div class="search-wrap">'+icon('search')+'<input class="search" id="admin-search" type="search" aria-label="'+(tab==='cards'?'Поиск карт':'Поиск пользователей')+'" placeholder="'+(tab==='cards'?'ID, название или описание карты':'ID или никнейм пользователя')+'" value="'+esc(query)+'"></div>'+
   (tab==='cards'?select('pack','Фильтр по паку',[['','Все паки'],...packs.map(p=>[p.id,p.name])],packFilter)+select('type','Фильтр по виду карты',[['','Все виды карт'],...types.map(t=>[t.id,t.name])],typeFilter):select('role','Фильтр по правам доступа',[['','Все права доступа'],['player','Игрок'],['superadmin','Суперадмин']],roleFilter)+select('status','Фильтр по статусу',[['','Все статусы'],['active','Активные'],['blocked','Заблокированные']],statusFilter))+
   button('Сбросить','reset','','admin-reset')+'</div><div id="admin-results"></div></section>';
  results();decorateKitControls();
  const packSelect=document.getElementById('admin-pack');
  if(packSelect)disposePackSelect=enhancePackSelect(packSelect,{icon,esc,iconForOption:id=>{const p=library.find(p=>p.id===id);return icon(p?.theme==='halloween'?'pack-halloween':p?.theme==='antibunker'?'pack-antibunker':p?.theme==='classic'?'pack-default':'cards');}});

 }
 function results(){
  const list=filtered(),paging=paginateAdmin(list,page);page=paging.page;
  const {rows,totalPages}=paging;
  const headers=tab==='cards'?['ID карты','Карта','Вид карты','Паки','Действия']:['ID пользователя','Пользователь','Последняя активность','Дата регистрации','Права доступа','Статус','Действия'];
  $('#admin-results').innerHTML=(list.length?'<div class="statistics-table statistics-table-scroll admin-table-scroll custom-scroll" tabindex="0" aria-label="'+(tab==='cards'?'Библиотека карт':'Таблица пользователей')+'"><table class="admin-table admin-table--'+tab+(rows.length===pageSize?' admin-page-full':'')+'"><thead><tr>'+headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(tab==='cards'?cardRow:userRow).join('')+'</tbody></table></div>':'<div class="empty"><h2>Ничего не найдено</h2><p>Измените запрос или сбросьте фильтры.</p>'+button('Сбросить фильтры','reset')+'</div>')+
   '<footer class="admin-pagination"><span>'+(list.length?((page-1)*pageSize+1)+'–'+Math.min(page*pageSize,list.length):'0')+' из '+list.length+'</span><div>'+btn(icon('left'),'kit-mini kit-icon-only','data-admin-action="prev" aria-label="Предыдущая страница" '+(page===1?'disabled':''))+'<span>'+page+' / '+totalPages+'</span>'+btn(icon('right'),'kit-mini kit-icon-only','data-admin-action="next" aria-label="Следующая страница" '+(page===totalPages?'disabled':''))+'</div></footer>';
  onCounts();decorateKitControls();
 }
 function showLogs(){
  const content=state.audit.length?'<div class="statistics-table statistics-table-scroll"><table><colgroup><col><col style="width:120px"><col style="width:140px"></colgroup><thead><tr><th scope="col">Действие</th><th scope="col">Автор</th><th scope="col">Дата и время</th></tr></thead><tbody>'+state.audit.map(a=>'<tr><td>'+esc(a.description)+(a.demo?'<br><span class="hint">Пример записи</span>':'')+'</td><td>'+esc(a.actor)+'</td><td>'+userDate(a.date)+'</td></tr>').join('')+'</tbody></table></div>':'<div class="empty"><h2>Действий пока нет</h2><p>Здесь появится история изменений.</p></div>';
  showModal('<h2>Журнал действий</h2><p>История изменений в этой мастерской.</p>'+content);
  // Existing wide dialog variant, shared header/body/footer and table component.
  $('#modal').classList.add('rules-dialog');
  $('#modal .modal-footer .btn')?.classList.add('kit-small');
 }
 function idCell(id){const short=id;return '<div class="admin-id"><code title="'+esc(id)+'">'+esc(short)+'</code>'+btn(icon('copy'),'admin-copy','data-admin-action="copy" data-admin-id="'+esc(id)+'" aria-label="Копировать ID '+esc(id)+'" title="Копировать полный ID"')+'</div>';}
 function cardRow(c){return '<tr><td>'+idCell(c.id)+'</td><td><button type="button" class="admin-card-link" data-admin-action="detail" data-admin-id="'+esc(c.id)+'">'+'<span class="admin-card-kind special-type-icon" data-category="'+esc(c.type)+'">'+icon(c.type)+'</span><span><strong>'+esc(c.name||'Без названия')+'</strong><span>'+esc(c.description||'Без описания')+'</span></span></button></td><td>'+'<span class="grid-card-type admin-type-tag" data-category="'+esc(c.type)+'">'+esc(String(c.category_name||'').trim()||String(c.typeName||'').trim()||typeName(c.type))+'</span>'+'</td><td><div class="admin-pack-names">'+c.packIds.slice(0,c.packIds.length>2?1:2).map(id=>'<span>'+esc(packName(id))+'</span>').join('')+(c.packIds.length>2?'<span class="hint" title="'+esc(c.packIds.map(packName).join(', '))+'">Ещё '+(c.packIds.length-1)+'</span>':'')+(!c.packIds.length?'<span class="hint">Без пака</span>':'')+'</div></td><td><div class="admin-row-actions pack-tile-actions">'+button(icon('edit'),'edit',c.id,'kit-mini kit-icon-only primary pack-edit-action')+button(icon('trash'),'delete',c.id,'kit-mini kit-icon-only pack-icon-action pack-delete')+'</div></td></tr>';}
 function userDate(value){const date=new Date(value);if(!value||!Number.isFinite(date.getTime()))return '<span class="hint">—</span>';return '<time datetime="'+date.toISOString()+'">'+date.toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'})+'<span>'+date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Moscow'})+' МСК</span></time>';}
 function userAction(u,action,label,ico,cls=''){return btn(icon(ico),'kit-mini kit-icon-only '+(action==='rename'?'primary pack-edit-action ':action==='block'?'pack-icon-action '+(u.blocked?'':'pack-delete '):'')+cls,'data-admin-action="'+action+'" data-admin-id="'+esc(u.id)+'" aria-label="'+label+' — '+esc(u.nickname)+'" title="'+label+'"');}
 function roleDropdown(u){return '<div class="field admin-role-field"><select data-admin-role="'+esc(u.id)+'" aria-label="Права доступа — '+esc(u.nickname)+'"><option value="player" '+(u.role==='player'?'selected':'')+'>Игрок</option><option value="superadmin" '+(u.role==='superadmin'?'selected':'')+'>Суперадмин</option></select></div>';}
 function userRow(u){return '<tr><td>'+idCell(u.id)+'</td><td><div class="admin-user"><span class="admin-avatar">'+esc(u.nickname.slice(0,1).toUpperCase())+'</span><div><strong>'+esc(u.nickname)+'</strong>'+(u.warnings.length?'<span class="admin-warning">Предупреждений: '+u.warnings.length+'</span>':'<span>Без предупреждений</span>')+'</div></div></td><td>'+userDate(u.last_online)+'</td><td>'+userDate(u.created_at)+'</td><td>'+roleDropdown(u)+'</td><td>'+badge(u.blocked?'Заблокирован':'Активен',u.blocked?'error':'success')+'</td><td><div class="admin-row-actions pack-tile-actions">'+userAction(u,'rename','Сменить никнейм','edit')+userAction(u,'block',u.blocked?'Разблокировать':'Заблокировать',u.blocked?'check':'lock',u.blocked?'':'danger')+'</div></td></tr>';}
 function refresh(){page=1;results();}
 function detail(id){editor(id);}
 function editor(id,push=true){
  const card=state.cards.find(c=>c.id===id);editorCreating=!card;
  editorDraft=makeCardDraft(card,uid(),types[0]?.id);editorOriginal=JSON.stringify(editorDraft);editorRevision++;pendingUploads=0;
  disposePackSelect?.();if($('#modal').open)$('#modal').close();
  const url=new URL(location.href);url.searchParams.set('admin','cards');url.hash='card/'+encodeURIComponent(card?.id||'new');
  if(push)history.pushState(null,'',url);
  renderEditor();window.scrollTo({top:0,behavior:'instant'});$('#admin-card-name')?.focus({preventScroll:true});
 }
 const stage=(title,content)=>'<section class="panel"><div class="panel-head"><h2>'+title+'</h2></div><div class="panel-body">'+content+'</div></section>';
 function editorField(label,key,{textarea=false,max=100,placeholder='',hint='',describedBy='',type='text'}={}){
  const description=hint?' aria-describedby="admin-card-'+key+'-hint"':describedBy?' aria-describedby="'+esc(describedBy)+'"':'';
  return '<div class="field"><label for="admin-card-'+key+'">'+label+'</label>'+(textarea?'<textarea id="admin-card-'+key+'" data-card-key="'+key+'" maxlength="'+max+'" rows="3"'+description+' placeholder="'+esc(placeholder)+'">'+esc(editorDraft[key])+'</textarea>':'<input id="admin-card-'+key+'" data-card-key="'+key+'" type="'+type+'" '+(type==='number'?'min="0" step="1"':'maxlength="'+max+'"')+' value="'+esc(editorDraft[key])+'"'+description+' placeholder="'+esc(placeholder)+'" '+(key==='name'?'required':'')+'>')+(hint?'<span id="admin-card-'+key+'-hint" class="hint">'+esc(hint)+'</span>':'')+'</div>';
 }
 function renderEditor(){
  const c=editorDraft;if(!c)return;document.body.classList.add('admin-card-editor-mode');
  const descriptionLimit=c.type==='disaster'?1200:130;
  const {relation,features:cardFeatures}=cardEditorSections(c,{editorField,icon,btn,esc});
  const basic='<div class="admin-editor-grid admin-card-basics">'+editorField('Название карты','name',{max:30,hint:'Не более 30 символов.'})+'<div class="field"><label for="admin-card-type">Вид карты</label><select id="admin-card-type" data-card-key="type">'+types.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===c.type?'selected':'')+'>'+esc(t.name)+'</option>').join('')+'</select></div>'+editorField('Название категории в игре','category_name',{max:40,describedBy:'admin-card-category_name-hint'})+'</div><p id="admin-card-category_name-hint" class="hint">После выбора вида карты можно задать своё название: «Раса» вместо «Профессия». Цвет и механика сохранятся. Оставьте поле пустым для стандартного названия.</p>'+editorField('Описание','description',{textarea:true,max:descriptionLimit,hint:'Не более '+descriptionLimit+' символов.'})+relation;
  const databaseNames={default:'Стандартный',advanced:'Расширенный',halloween_2025:'Хэллоуин 2025',antibunker:'Антибункер'};
  const packPicker='<p class="hint">Выберите один или несколько паков. Изменения карты применяются ко всем выбранным пакам.</p><div class="admin-editor-pack-list">'+packs.map(p=>'<label class="choice base-checkbox"><input class="base-checkbox__input" type="checkbox" data-card-pack="'+esc(p.id)+'" '+(c.packIds.includes(p.id)?'checked':'')+'><span class="base-checkbox__mark" aria-hidden="true"></span>'+icon(({default:'pack-default',advanced:'pack-advanced',halloween_2025:'pack-halloween',antibunker:'pack-antibunker'})[p.id]||'cards')+'<span class="base-checkbox__label">'+esc(databaseNames[p.id]||p.name)+'</span></label>').join('')+'</div>';
  const areaConfig={title:'Площадь бункера',note:'Выберите диапазон общей площади убежища.',presets:[[10,50],[50,100],[100,500],[500,1000]]};
  const ranges=c.type==='disaster'?stage('Параметры катастрофы','<div class="admin-disaster-ranges">'+[...Object.entries(rangeConfig),['bunkerArea',areaConfig]].map(([key,config])=>'<section class="range-section"><h3>'+config.title+'</h3><p class="hint">'+(config.note||'')+'</p><div class="range-presets">'+config.presets.map(([min,max],i)=>btn(min.toLocaleString('ru-RU')+' — '+max.toLocaleString('ru-RU')+(key==='duration'?' мес.':key==='population'?' чел.':' м²'),'kit-small '+(c[key+'Range']?.min===min&&c[key+'Range']?.max===max?'range-active':''),'data-card-page="range" data-range="'+key+'" data-index="'+i+'"')).join('')+'</div></section>').join('')+'</div>'):'';
  const cardMedia=['bunker','disaster'].includes(c.type)?'<div class="admin-media-layout '+(c.type==='bunker'?'admin-media-layout--single':'')+'">'+stage('Изображения',editorImages())+(c.type==='disaster'?stage('Аудиоозвучка',editorAudio()):'')+'</div>':'';
  $('#page').innerHTML='<div class="admin-editor-back">'+btn(icon('left')+'К списку карт','kit-small','data-card-page="back"')+'</div>'+heading(editorCreating?'Создать карту':c.name||'Редактирование карты','Изменения сохраняются общей кнопкой внизу страницы.',c.type)+'<div class="admin-editor-id"><span>ID карты</span>'+idCell(c.id)+'</div><form id="admin-card-form" class="admin-card-page-form">'+stage('Основные поля',basic)+stage('Входит в паки',packPicker)+(c.type!=='bunker'?cardFeatures:'')+ranges+cardMedia+'<footer class="card-actions admin-editor-footer"><span id="admin-card-save-status" class="hint" role="status">'+(editorDirty()?'Есть несохранённые изменения':'Все изменения будут применены после сохранения')+'</span>'+btn('Отмена','kit-small push','data-card-page="back"')+'<button type="submit" class="btn primary kit-small" '+(pendingUploads?'disabled':'')+'>'+icon('check')+'Сохранить карту</button></footer></form>';
  decorateKitControls();fitDescription();
  const player=document.getElementById('admin-card-audio-player');
  player?.addEventListener('error',()=>{const status=document.getElementById('admin-audio-status');if(status)status.textContent='Не удалось воспроизвести файл. Загрузите его повторно.';});
 }
 function fitDescription(){const field=document.getElementById('admin-card-description');if(!field?.style)return;field.style.height='auto';field.style.height=Math.max(96,field.scrollHeight+2)+'px';}
 window.addEventListener('resize',fitDescription);
 function editorAudio(){
  const rec=editorDraft.audio_guide;
  const src=rec?.assetId?imageUrl(rec.assetId):rec?.sourceUrl||(rec?.path?new URL('/'+rec.path.replace(/^\//,''),'http://test.37.230.114.30.nip.io').href:'');
  return '<p class="hint">MP3, WAV или OGG · до 2 МБ. Озвучка сохраняется вместе с картой.</p><div class="disaster-upload-slot admin-audio-slot"><div class="slot-preview">'+icon('audio')+'</div><div class="slot-content"><strong>'+esc(rec?.name||rec?.filename||'Аудиоозвучка карты')+'</strong><span id="admin-audio-status" class="slot-status">'+(rec?'Файл добавлен':'Файл не выбран')+'</span></div><div class="slot-actions">'+btn(icon('upload')+(rec?'Заменить':'Загрузить'),'kit-mini','data-card-page="upload-audio"')+(rec?btn(icon('trash'),'kit-mini kit-icon-only','data-card-page="remove-audio" aria-label="Удалить аудиоозвучку"'):'')+'</div>'+(rec?'<audio id="admin-card-audio-player" controls preload="metadata" data-audio-asset="'+esc(rec.assetId||'')+'" '+(src?'src="'+esc(src)+'"':'')+' aria-label="Прослушать озвучку"></audio>':'')+'<input type="file" hidden data-card-audio accept="audio/mpeg,audio/wav,audio/x-wav,audio/ogg,.mp3,.wav,.ogg"></div>';
 }
 function editorImages(){
  const c=editorDraft;if(!['bunker','disaster'].includes(c.type))return '<p class="hint">Для этого вида карт изображения не используются.</p>';
  const specs=c.type==='disaster'?imageSpecs:[{id:'main',name:'Основное изображение'}];
  return '<p class="hint">JPG, PNG или WebP · '+(c.type==='disaster'?'до 1 МБ на файл':'до 3 МБ на файл')+'. Изменения сохраняются по кнопке «Сохранить карту».</p><div class="disaster-upload-list">'+specs.map(spec=>{const rec=c.type==='disaster'?c.images?.[spec.id]:null;const src=c.type==='disaster'?imageUrl(rec?.assetId):c.image;return '<div class="disaster-upload-slot"><div class="slot-preview">'+(src?'<img src="'+esc(src)+'" alt="'+esc(spec.name)+'">':icon('image'))+'</div><div class="slot-content"><strong>'+spec.name+'</strong><span class="slot-spec">'+(spec.width?spec.width+' × '+spec.height+' px · до 1 МБ':'JPG, PNG, WebP · до 3 МБ')+'</span><span class="slot-status">'+(src||rec?'Загружено':'Не загружено')+'</span></div><div class="slot-actions">'+btn(icon('upload')+(src||rec?'Заменить':'Загрузить'),'kit-mini','data-card-page="upload" data-slot="'+spec.id+'"')+(src||rec?btn(icon('trash'),'kit-mini kit-icon-only','data-card-page="remove-image" data-slot="'+spec.id+'" aria-label="Удалить '+spec.name+'"'):'')+'</div><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-card-file="'+spec.id+'"></div>';}).join('')+'</div>';
 }
 function closeEditor(){editorDraft=null;editorRevision++;document.body.classList.remove('admin-card-editor-mode');const url=new URL(location.href);url.hash='';history.replaceState(null,'',url);render('cards');window.scrollTo({top:0,behavior:'instant'});}
 function confirmLeave(callback){if(!editorDirty()){callback();return;}pendingLeave=callback;showModal('<h2>Выйти без сохранения?</h2><p>Изменения этой карты ещё не сохранены.</p>');$('#modal .modal-footer').innerHTML=btn('Остаться','primary kit-small','data-card-page="stay"')+btn('Выйти','kit-small','data-card-page="discard"');}
 function markDirty(){const status=$('#admin-card-save-status');if(status)status.textContent=editorDirty()?'Есть несохранённые изменения':'Все изменения будут применены после сохранения';}
 document.addEventListener('input',event=>{
  if(!editorDraft||!event.target.closest('#admin-card-form'))return;
  const key=event.target.dataset.cardKey,index=event.target.dataset.cardTrait;
  if(key){editorDraft[key]=event.target.value;event.target.setCustomValidity('');if(key==='description')fitDescription();}
  if(index!==undefined){event.target.setCustomValidity('');const old=editorDraft.helpful_traits[Number(index)];if(typeof old==='object'){try{editorDraft.helpful_traits[Number(index)]=JSON.parse(event.target.value);}catch{event.target.setCustomValidity('Сохраните структуру характеристики в формате JSON.');}}else editorDraft.helpful_traits[Number(index)]=event.target.value;}
  if(event.target.dataset.taskKey){editorDraft.tasks[Number(event.target.dataset.taskIndex)][event.target.dataset.taskKey]=event.target.value;event.target.setCustomValidity('');}
  markDirty();
 });
 document.addEventListener('change',async event=>{
  if(!editorDraft||!event.target.closest('#admin-card-form'))return;
  if(event.target.hasAttribute('data-traits-enabled')){editorDraft.helpful_traits_enabled=event.target.checked;renderEditor();}
  if(event.target.hasAttribute('data-tasks-enabled')){editorDraft.tasks_enabled=event.target.checked;editorDraft.tasks_expanded=true;renderEditor();}
  if(event.target.dataset.cardPack){editorDraft.packIds=[...document.querySelectorAll('[data-card-pack]:checked')].map(el=>el.dataset.cardPack);markDirty();}
  if(event.target.hasAttribute('data-card-relation')){editorDraft.relation=event.target.checked?(editorDraft.relation||true):false;renderEditor();}
  if(event.target.dataset.cardKey==='type'){editorDraft.type=event.target.value;renderEditor();}
  if(event.target.hasAttribute('data-card-audio')){
   const file=event.target.files?.[0];if(!file)return;
   const revision=editorRevision,audioRequest=++audioRevision;pendingUploads++;$('#admin-card-form button[type="submit"]').disabled=true;
   try{const record=await prepareAudio(file);if(editorDraft&&revision===editorRevision&&audioRequest===audioRevision)editorDraft.audio_guide=record;}
   catch(error){toast(error.message||'Не удалось загрузить аудио.');}
   finally{if(editorDraft&&revision===editorRevision){pendingUploads--;renderEditor();}}
   return;
  }
  const slot=event.target.dataset.cardFile,file=event.target.files?.[0];if(!slot||!file)return;
  const revision=editorRevision,spec=editorDraft.type==='disaster'?imageSpecs.find(s=>s.id===slot):null;
  pendingUploads++;$('#admin-card-form button[type="submit"]').disabled=true;
  try{const result=await prepareImage(file,spec);if(!editorDraft||revision!==editorRevision)return;if(spec){editorDraft.images??={};editorDraft.images[slot]=result.record;}else if(slot==='main')editorDraft.image=result.src;else editorDraft.extraImages[Number(slot.slice(6))]=result.src;}
  catch(error){toast(error.message||'Не удалось загрузить изображение.');}
  finally{if(editorDraft&&revision===editorRevision){pendingUploads--;renderEditor();}}
 });
 document.addEventListener('click',event=>{
  const el=event.target.closest('[data-card-page]');if(!el)return;const action=el.dataset.cardPage;
  if(action==='stay'){pendingLeave=null;$('#modal').close();document.getElementById('admin-card-name')?.focus();return;}
  if(action==='discard'){const next=pendingLeave;pendingLeave=null;$('#modal').close();editorOriginal=JSON.stringify(editorDraft);next?.();return;}
  if(!editorDraft)return;
  if(action==='back')confirmLeave(closeEditor);
  else if(action==='upload-audio')document.querySelector('[data-card-audio]').click();
  else if(action==='remove-audio'){audioRevision++;editorDraft.audio_guide=null;renderEditor();}
  else if(action==='toggle-traits'){editorDraft.helpful_traits_enabled=!editorDraft.helpful_traits_enabled;renderEditor();}
  else if(action==='toggle-tasks'){editorDraft.tasks_expanded=!editorDraft.tasks_expanded;renderEditor();}
  else if(action==='add-task'){editorDraft.tasks_enabled=true;editorDraft.tasks_expanded=true;editorDraft.tasks.push({title:'',description:''});renderEditor();document.getElementById('task-name-'+(editorDraft.tasks.length-1))?.focus();}
  else if(action==='remove-task'){editorDraft.tasks.splice(Number(el.dataset.index),1);renderEditor();}
  else if(action==='add-trait'){editorDraft.helpful_traits.push('');renderEditor();document.getElementById('trait-'+(editorDraft.helpful_traits.length-1))?.focus();}
  else if(action==='remove-trait'){editorDraft.helpful_traits.splice(Number(el.dataset.index),1);renderEditor();}
  else if(action==='range'){const config=el.dataset.range==='bunkerArea'?{presets:[[10,50],[50,100],[100,500],[500,1000]]}:rangeConfig[el.dataset.range];const [min,max]=config.presets[Number(el.dataset.index)];editorDraft[el.dataset.range+'Range']={min,max};renderEditor();}
  else if(action==='upload')document.querySelector('[data-card-file="'+el.dataset.slot+'"]').click();
  else if(action==='remove-image'){const slot=el.dataset.slot;if(editorDraft.type==='disaster')delete editorDraft.images[slot];else editorDraft.image='';renderEditor();}
 });
 document.addEventListener('click',event=>{if(!editorDirty())return;const link=event.target.closest('button[data-section],a[data-section],button[data-catalog],a[data-catalog],a.sidebar-exit,a.brand');if(link){event.preventDefault();event.stopImmediatePropagation();confirmLeave(()=>link.click());}},true);
 window.addEventListener('beforeunload',event=>{if(editorDirty()){event.preventDefault();event.returnValue='';}});
 window.addEventListener('popstate',()=>{
  if(!document.body.dataset.section?.startsWith('admin-'))return;
  if(editorDirty()){
   const destination=location.href,current=new URL(destination);current.hash='card/'+encodeURIComponent(editorCreating?'new':editorDraft.id);history.pushState(null,'',current);
   confirmLeave(()=>{history.replaceState(null,'',destination);render(tab);});return;
  }
  render(tab);
 });
 document.addEventListener('submit',event=>{
  if(event.target.id!=='admin-card-form'||!editorDraft)return;event.preventDefault();if(pendingUploads)return;
  let record;try{record=validateCardDraft(editorDraft,types,packs.map(p=>p.id));}catch(error){toast(error.message);return;}
  const existing=state.cards.find(c=>c.id===record.id);
  if(store(()=>{if(existing)state.cards[state.cards.indexOf(existing)]=record;else state.cards.unshift(record);},(existing?'Изменена':'Создана')+' карта «'+record.name+'»',{record,id:record.id})){editorOriginal=JSON.stringify(editorDraft);closeEditor();toast('Карта сохранена во всех выбранных паках.');}
 });
 function packList(ids){return ids.length?'<ul class="admin-linked-packs">'+ids.map(id=>'<li>'+icon('cards')+esc(packName(id))+'</li>').join('')+'</ul>':'<p class="hint">Карта не привязана к пакам.</p>';}
 function confirmCardDelete(id){const c=state.cards.find(c=>c.id===id);if(!c)return;showModal('<h2>Удалить карту полностью?</h2><p>«'+esc(c.name)+'» будет удалена из общей библиотеки и всех связанных паков. Это действие нельзя отменить.</p><div class="admin-detail"><h3>Затронутые паки · '+c.packIds.length+'</h3>'+packList(c.packIds)+'<p class="hint">После удаления готовность этих паков нужно проверить повторно.</p></div>');const footer=$('#modal .modal-footer');footer.innerHTML=btn('Отмена','kit-small','data-modal-close="true"')+button('Удалить карту','confirm-delete',id,'danger');$('#modal').classList.add('editor-dialog');}
 function userDialog(id,action,roleValue){
  const u=state.users.find(u=>u.id===id);if(!u)return;
  const title=action==='role'?'Изменить права доступа?':action==='rename'?'Выдать предупреждение за никнейм?':u.blocked?'Разблокировать пользователя?':'Заблокировать бессрочно?';
  let text=action==='rename'?'Никнейм будет заменён на шаблонный «Игрок…». Пользователю будет выдано предупреждение: «Никнейм нарушает правила сообщества».':action==='role'?'Суперадмин получает доступ ко всем картам и управлению пользователями.':u.blocked?'Пользователь снова сможет пользоваться своим аккаунтом.':'Пользователь потеряет доступ к аккаунту до ручной разблокировки.';
  showModal('<h2>'+title+'</h2><p>'+text+'</p><div class="admin-user-summary"><strong>'+esc(u.nickname)+'</strong><code>ID '+esc(u.id)+'</code></div>'+(action==='role'?'<div class="field"><label for="admin-new-role">Права доступа</label><select id="admin-new-role"><option value="player" '+((roleValue??u.role)==='player'?'selected':'')+'>Игрок</option><option value="superadmin" '+((roleValue??u.role)==='superadmin'?'selected':'')+'>Суперадмин</option></select></div>':''));
  $('#modal .modal-footer').innerHTML=btn('Отмена','kit-small','data-modal-close="true"')+button(action==='role'?'Сохранить права':action==='rename'?'Сменить и предупредить':u.blocked?'Разблокировать':'Заблокировать','confirm-'+action,id,action==='block'&&!u.blocked?'danger':'primary');decorateKitControls();
 }
 document.addEventListener('input',event=>{if(event.target.id==='admin-search'){query=event.target.value;refresh();}});
 document.addEventListener('change',event=>{
  const userId=event.target.dataset.adminRole;
  if(userId){const user=state.users.find(u=>u.id===userId);if(!user)return;const next=event.target.value;event.target.value=user.role;if(next!==user.role)userDialog(userId,'role',next);return;}
  const filter=event.target.dataset.adminFilter;if(!filter)return;const value=event.target.value;if(filter==='pack')packFilter=value;if(filter==='type')typeFilter=value;if(filter==='role')roleFilter=value;if(filter==='status')statusFilter=value;refresh();
 });
 document.addEventListener('click',async event=>{
  if(!document.body.dataset.section?.startsWith('admin-'))return;
  const control=event.target.closest('[data-admin-action]');if(!control)return;
  const {adminAction:action,adminId:id}=control.dataset;
  if(action==='logs')showLogs();
  else if(action==='copy'){try{await copyText(id);toast('ID скопирован.');}catch{toast('Не удалось скопировать ID. Попробуйте ещё раз.');}}
  else if(action==='reset'){query=packFilter=typeFilter=roleFilter=statusFilter='';page=1;render();}
  else if(action==='prev'||action==='next'){page+=action==='next'?1:-1;results();}
  else if(action==='detail')detail(id);
  else if(action==='edit'||action==='create')editor(id);
  else if(action==='delete')confirmCardDelete(id);
  else if(['role','rename','block'].includes(action))userDialog(id,action);
  else if(action==='confirm-delete'){
   const card=state.cards.find(c=>c.id===id);if(!card)return;
   if(store(()=>{state.cards=state.cards.filter(c=>c.id!==id);},'Удалена карта «'+card.name+'» из '+card.packIds.length+' паков',{record:null,id})){$('#modal').close();results();toast('Карта удалена из библиотеки и всех связанных паков.');}
  }else if(action.startsWith('confirm-')){
   const operation=action.slice(8),value=$('#admin-new-role')?.value,user=state.users.find(u=>u.id===id);if(!user)return;
   if(store(()=>changeUser(state.users,id,operation,value),(operation==='rename'?'Предупреждение за никнейм':operation==='role'?'Изменение прав доступа':user.blocked?'Разблокировка':'Бессрочная блокировка')+' · ID '+id)){$('#modal').close();results();toast('Изменения сохранены в предпросмотре.');}
  }
 });
 $('#modal').addEventListener('close',()=>$('#modal').classList.remove('editor-dialog'));
 return {render,counts:()=>({cards:state.cards.length,users:state.users.length})};
}
