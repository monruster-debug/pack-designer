export function makeCardDraft(card,id,type='profession'){
 return {...structuredClone(card||{id,type,name:'',description:'',packIds:[]}),category_name:card?.category_name??card?.typeName??'',short_description:card?.short_description??'',helpful_traits:structuredClone(Array.isArray(card?.helpful_traits)?card.helpful_traits:[]),helpful_traits_enabled:card?.helpful_traits_enabled??!!card?.helpful_traits?.length,tasks:structuredClone(Array.isArray(card?.tasks)?card.tasks:[]),tasks_enabled:card?.tasks_enabled??!!card?.tasks?.length,relation:card?.relation??false,players_count:card?.players_count??0};
}
export function validateCardDraft(draft,types,packIds){
 const record=structuredClone(draft);record.name=String(record.name||'').trim();
 if(!record.name||record.name.length>30)throw new Error('Укажите название карты до 30 символов.');
 if(!types.some(t=>t.id===record.type))throw new Error('Выберите вид карты.');
 if(!Number.isSafeInteger(Number(record.players_count))||Number(record.players_count)<0)throw new Error('Количество игроков должно быть целым неотрицательным числом.');
 record.players_count=record.relation?Number(record.players_count):0;
 record.category_name=String(record.category_name||'').trim();record.typeName=record.category_name;
 record.description=String(record.description||'').trim();
 const descriptionLimit=record.type==='disaster'?1200:130;
 if(record.description.length>descriptionLimit)throw new Error('Описание карты должно быть не длиннее '+descriptionLimit+' символов.');
 record.packIds=[...new Set(record.packIds)].filter(id=>packIds.includes(id));
 record.helpful_traits=record.helpful_traits.filter(value=>typeof value==='string'?value.trim():value&&typeof value==='object').map(value=>typeof value==='string'?value.trim():value);
 if(record.helpful_traits_enabled===false)record.helpful_traits=[];
 if(record.tasks_enabled===false)record.tasks=[];
 record.tasks=(record.tasks||[]).map(task=>({...task,title:String(task.title||'').trim(),description:String(task.description||'').trim()}));
 if(record.tasks.some(task=>!task.title))throw new Error('Укажите название каждой задачи.');
 if(record.tasks.some(task=>task.description.length>240))throw new Error('Описание задачи должно быть не длиннее 240 символов.');
 if(!['bunker','disaster'].includes(record.type)){delete record.image;delete record.images;delete record.extraImages;}
 else if(record.type==='bunker'){delete record.images;record.extraImages=(record.extraImages||[]).filter(value=>typeof value==='string'&&value);}
 else{delete record.image;delete record.extraImages;}
 return record;
}
