// Review-only data adapter. Replace with authenticated API calls before production.
export const ADMIN_PAGE_SIZE=50;
export function paginateAdmin(items,page=1){
 const totalPages=Math.max(1,Math.ceil(items.length/ADMIN_PAGE_SIZE));
 const current=Math.max(1,Math.min(totalPages,page));
 return {page:current,totalPages,rows:items.slice((current-1)*ADMIN_PAGE_SIZE,current*ADMIN_PAGE_SIZE)};
}
export function buildCardLibrary(packs){
 const cards=new Map();
 for(const pack of packs)for(const [type,list] of Object.entries(pack.cards||{}))for(const card of list){
  const key=String(card.id);
  if(!cards.has(key))cards.set(key,{...structuredClone(card),id:key,type,packIds:[]});
  const record=cards.get(key);
  if(!record.packIds.includes(pack.id))record.packIds.push(pack.id);
 }
 return [...cards.values()];
}
export function filterAdminCards(cards,{query='',pack='',type=''}){
 const needle=query.trim().toLocaleLowerCase('ru-RU');
 return cards.filter(card=>(!pack||card.packIds.includes(pack))&&(!type||card.type===type)&&(!needle||[card.id,card.name,card.description].some(value=>String(value||'').toLocaleLowerCase('ru-RU').includes(needle))));
}
export function demoLinkedPacks(){
 const makeCard=(id,name,description)=>({id:'admin-demo-link-'+id,name,description,image:'',adminDemo:true});
 const one=makeCard('one','Демо: одна связь','Карта используется в одном паке.');
 const two=makeCard('two','Демо: две связи','Одна карта используется в двух паках.');
 const many=makeCard('many','Демо: несколько связей','Карта используется в трёх паках. В таблице видны два названия и счётчик остальных.');
 return [
  {id:'admin-demo-pack-a',name:'Демо: Полярная станция',cards:{profession:[one,two,many]}},
  {id:'admin-demo-pack-b',name:'Демо: Последний сигнал',cards:{profession:[two,many]}},
  {id:'admin-demo-pack-c',name:'Демо: Долгая зима',cards:{profession:[many]}}
 ].map(pack=>({...structuredClone(pack),version:1,status:'draft',theme:'classic',description:'Демонстрационный пак для просмотра связей карт.',cover:'',customTypes:[],adminDemo:true}));
}
export function updateCardInPacks(packs,record,id,types=[]){
 return packs.map(pack=>{
  const contains=Object.values(pack.cards).some(cards=>cards.some(card=>card.id===id));
  if(!contains&&!record?.packIds.includes(pack.id))return pack;
  const result=structuredClone(pack);
  for(const type of Object.keys(result.cards))result.cards[type]=result.cards[type].filter(card=>card.id!==id);
  if(record?.packIds.includes(pack.id)){
   const {type,packIds,...card}=structuredClone(record);
   result.cards[type]??=[];result.cards[type].push(card);
   const custom=types.find(t=>t.id===type);
   if(custom&&!['profession','biology','health','hobby','fact','baggage','bunker','special','disaster'].includes(type)&&!result.customTypes.some(t=>t.id===type))result.customTypes.push(custom);
  }
  result.updatedAt=new Date().toISOString();
  return result;
 });
}
export function changeUser(users,id,action,value){
 const user=users.find(user=>user.id===id);
 if(!user)throw new Error('Пользователь не найден.');
 const lastAdmin=user.role==='superadmin'&&!user.blocked&&users.filter(u=>u.role==='superadmin'&&!u.blocked).length===1;
 if(lastAdmin&&((action==='role'&&value==='player')||(action==='block'&&!user.blocked)))throw new Error('Нельзя заблокировать последнего суперадмина или снять его права.');
 if(action==='role'){
  if(!['player','superadmin'].includes(value))throw new Error('Неизвестная роль.');
  user.role=value;
 }else if(action==='block')user.blocked=!user.blocked;
 else if(action==='rename'){
  const oldName=user.nickname;
  let suffix=String(user.id).replace(/\D/g,'').slice(-6)||'123';
  let nickname='Игрок'+suffix;
  while(users.some(other=>other.id!==id&&other.nickname===nickname))nickname='Игрок'+(++suffix);
  user.nickname=nickname;
  user.warnings.push({date:new Date().toISOString(),reason:'Никнейм нарушает правила сообщества',previousNickname:oldName});
 }else throw new Error('Неизвестное действие.');
 return user;
}
export function mergeAdminDemoData(state){
 const users=[...state.users];
 for(const user of demoUsers())if(!users.some(existing=>existing.id===user.id))users.push(user);
 const examples=[
  ['Создана карта «Полярный врач»','Shelter42'],
  ['Карта «Радист» добавлена в два пака','Смотритель'],
  ['Изменено описание карты «Теплица»','Shelter42'],
  ['Выдано предупреждение за никнейм · ID 100512','Смотритель'],
  ['Пользователь заблокирован бессрочно · ID 102048','Shelter42'],
  ['Пользователю назначена роль суперадмина · ID 101024','Shelter42'],
  ['Удалена карта «Запасная карта» из одного пака','Смотритель'],
  ['Пользователь разблокирован · ID 200002','Shelter42']
 ].map(([description,actor],index)=>({id:'demo-audit-v1-'+index,demo:true,date:new Date(Date.UTC(2026,10,16,9-index,20)).toISOString(),description,actor}));
 return {...state,users,audit:[...state.audit,...examples.filter(example=>!state.audit.some(entry=>entry.id===example.id))]};
}
export function demoUsers(){const base=[
 {id:'100042',nickname:'Shelter42',role:'superadmin',blocked:false,warnings:[]},
 {id:'100128',nickname:'Северный ветер',role:'player',blocked:false,warnings:[]},
 {id:'100256',nickname:'Последний выживший',role:'player',blocked:false,warnings:[]},
 {id:'100512',nickname:'Игрок100512',role:'player',blocked:false,warnings:[{date:'2026-11-15T10:00:00Z',reason:'Никнейм нарушает правила сообщества',previousNickname:'Нарушающий никнейм'}]},
 {id:'101024',nickname:'Смотритель',role:'superadmin',blocked:false,warnings:[]},
 {id:'102048',nickname:'Путник',role:'player',blocked:true,warnings:[]},
 {id:'104096',nickname:'Полярная ночь',role:'player',blocked:false,warnings:[]}
].map((user,index)=>({...user,created_at:['2026-10-19T10:54:49Z','2026-10-22T09:20:00Z','2026-10-28T15:40:00Z','2026-11-02T11:15:00Z','2026-10-20T07:30:00Z','2026-11-05T18:00:00Z','2026-11-10T08:10:00Z'][index],last_online:['2026-11-16T09:30:00Z','2026-11-16T08:45:00Z','2026-11-15T19:20:00Z','2026-11-15T12:05:00Z','2026-11-16T09:10:00Z','2026-11-12T14:00:00Z','2026-11-16T07:55:00Z'][index]}));
 const names=['Картограф','Врач станции','Тихая гавань','Радиосигнал','Лесной странник','Архивариус','Ночной дозор','Метеоролог','Механик','Зелёный свет','Искатель','Хранитель ключей','Теплица','Последний поезд','Астроном','Проводник','Полярная сова','Длинный никнейм для проверки обрезки в таблице','Пилот','Эхо','Север','Следопыт','Новая смена'];
 return [...base,...names.map((nickname,index)=>({id:String(200000+index),nickname,role:'player',blocked:index%7===0,warnings:index%5===0?[{date:'2026-11-15T10:00:00Z',reason:'Никнейм нарушает правила сообщества',previousNickname:'Пример прежнего никнейма'}]:[],created_at:new Date(Date.UTC(2026,9,20+index,8,15)).toISOString(),last_online:new Date(Date.UTC(2026,10,16-(index%5),6+index%12,20)).toISOString()}))];
}
