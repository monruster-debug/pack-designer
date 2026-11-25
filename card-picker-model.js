import {buildCardLibrary} from './admin-model.js';
export function availableLibraryCards(packs,unbound,type='',{query='',packId=''}={}){
 if(['special','disaster'].includes(type))return [];
 const cards=new Map(buildCardLibrary(packs).map(c=>[c.id,c]));
 for(const c of unbound||[])if(!cards.has(c.id))cards.set(c.id,c);
 const needle=query.trim().toLocaleLowerCase('ru-RU');
 return [...cards.values()].filter(c=>!['special','disaster'].includes(c.type)&&(!type||c.type===type)&&(!packId||c.packIds?.includes(packId))&&(!needle||String(c.name||'').toLocaleLowerCase('ru-RU').includes(needle)));
}
export function addSelectedLibraryCards(pack,cards,selected,types){
 let count=0;
 for(const type of types){
  const added=addLibraryCards(pack,type.id,cards,selected);count+=added;
  if(added&&type.id.startsWith('custom_')&&!pack.customTypes.some(t=>t.id===type.id))pack.customTypes.push(structuredClone(type));
 }
 return count;
}
export function addLibraryCards(pack,type,cards,selected){
 if(['special','disaster'].includes(type))return 0;
 const list=pack.cards[type]??=[],existing=new Set(list.map(c=>c.id));let count=0;
 for(const card of cards)if(card.type===type&&selected.has(card.id)&&!existing.has(card.id)){
  const {type:ignored,packIds,...record}=structuredClone(card);list.push(record);existing.add(card.id);count++;
 }
 return count;
}
