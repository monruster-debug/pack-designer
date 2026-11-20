const types=['profession','biology','health','hobby','fact','baggage','bunker','special','disaster'];
const names={default:'Базовый [Классика]',advanced:'Расширенный [Классика]',halloween_2025:'Хэллоуинская паника',antibunker:'Антибункер'};
export function databaseSnapshot(cards,origin='http://test.37.230.114.30.nip.io'){
 const packs=new Map(),unbound=[];
 for(const raw of cards){
  const id=String(raw._id?.$oid||raw._id||raw.id||'');if(!id)throw Error('В карте отсутствует ID.');
  const type=raw.category==='luggage'?'baggage':raw.category;
  if(!types.includes(type))throw Error('Неизвестный вид карты: '+type);
  const card={...structuredClone(raw),id,name:raw.name||'',description:raw.description||'',typeName:raw.category_name||'',databaseImported:true};
  delete card._id;
  card.sourceImages=structuredClone(raw.images||[]);
  card.image='';card.images={};
  const paths=card.sourceImages.map(image=>({...image,url:new URL('/'+String(image.path||'').replace(/^\//,''),origin).href}));
  if(type==='bunker'){card.image=paths[0]?.url||'';card.extraImages=paths.slice(1).map(image=>image.url);}
  if(type==='disaster'){
   const slots={modal:'start',final:'final',small:'collapsed',table:'game'};
   for(const image of paths){const slot=slots[String(image.type).toLowerCase()];if(!slot)continue;const measured=image.verifiedMetadata||{};card.images[slot]={assetId:'test-db:'+id+':'+slot,sourceUrl:image.url,mime:image.mime_type,bytes:Number(image.size?.low??image.size??0),...measured,sourceVerified:!!measured.width};}
   card.duration=raw.disaster_duration;card.population=raw.disaster_population;
  }
  if(type==='special'){card.sourceId=id;card.cardType=raw.effect?.category||'special';card.categoryId='database-special';card.mechanicId=raw.effect?.name||id;}
  const codes=Array.isArray(raw.packs)?raw.packs:raw.pack?[raw.pack]:[];
  if(!codes.length){unbound.push({...card,type,packIds:[]});continue;}
  for(const code of codes){
   if(!packs.has(code))packs.set(code,{id:code,version:1,name:names[code]||code,description:'',cover:'',status:'draft',theme:code==='halloween_2025'?'halloween':code==='antibunker'?'antibunker':'classic',customTypes:[],cards:Object.fromEntries(types.map(t=>[t,[]])),source:{kind:'test-database',pack:code}});
   packs.get(code).cards[type].push(structuredClone(card));
  }
 }
 return {packs:[...packs.values()],unbound};
}
export function appendDatabasePacks(library,packs,normalize){
 const ids=new Set(library.map(p=>p.id));
 return [...library,...packs.filter(p=>!ids.has(p.id)).map(p=>normalize(structuredClone(p)))];
}
export function reconcileDatabaseImages(library,packs){
 const verified=new Map(packs.flatMap(p=>p.cards.disaster).map(c=>[c.id,Object.entries(c.images)]));
 return library.map(pack=>{
  if(!pack.cards?.disaster?.some(c=>verified.has(c.id)))return pack;
  const copy=structuredClone(pack);
  for(const card of copy.cards.disaster){
   const source=verified.get(card.id);if(!source)continue;
   const next={...card.images},updates=[];
   for(const [slot,record] of Object.entries(card.images||{})){
    const match=source.find(([,r])=>r.sourceVerified&&r.sourceUrl===record?.sourceUrl);
    if(match){delete next[slot];updates.push({slot,target:match[0],record:match[1]});}
   }
   for(const update of updates){
    if(next[update.target])next[update.slot]={...update.record,verificationError:'Этот формат уже занят другим изображением.'};
    else next[update.target]=structuredClone(update.record);
   }
   card.images=next;
  }
  return copy;
 });
}
