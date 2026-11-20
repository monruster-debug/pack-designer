import assert from 'node:assert/strict';
import fs from 'node:fs';
import {databaseSnapshot,appendDatabasePacks,reconcileDatabaseImages} from '../database-import.js';
import {buildCardLibrary} from '../admin-model.js';
const raw=JSON.parse(fs.readFileSync(new URL('../data/test-database-cards.json',import.meta.url),'utf8'));
const snapshot=databaseSnapshot(raw);
assert.equal(raw.length,2067);assert.equal(snapshot.packs.length,4);assert.equal(snapshot.unbound.length,46);
assert.deepEqual(Object.fromEntries(snapshot.packs.map(p=>[p.id,Object.values(p.cards).flat().length])),{default:379,advanced:836,halloween_2025:352,antibunker:454});
const imported=[...buildCardLibrary(snapshot.packs),...snapshot.unbound];
assert.equal(new Set(imported.map(c=>c.id)).size,2067);
for(const card of raw){const found=imported.find(c=>c.id===card._id);assert.equal(found.name,card.name);assert.equal(found.description,card.description||'');assert.deepEqual(found.effect,card.effect);assert.deepEqual(found.sourceImages,card.images||[]);}
assert.ok(snapshot.packs.every(p=>Array.isArray(p.cards.baggage)));
const original={id:'local',name:'Мой черновик',cards:{}};
const merged=appendDatabasePacks([original],snapshot.packs,p=>p);
assert.equal(merged[0],original);merged[1].name='Локальное изменение';
assert.equal(appendDatabasePacks(merged,snapshot.packs,p=>p).length,5);
assert.equal(appendDatabasePacks(merged,snapshot.packs,p=>p)[1].name,'Локальное изменение');
const shared=databaseSnapshot([{_id:'shared',category:'profession',name:'Общая',packs:['default','advanced']}]);
assert.deepEqual(buildCardLibrary(shared.packs)[0].packIds,['default','advanced']);
const dimensions={start:[520,680],final:[1508,384],game:[608,262],collapsed:[1556,67]};
for(const p of snapshot.packs)for(const c of p.cards.disaster)for(const [slot,r] of Object.entries(c.images)){
 assert.deepEqual([r.width,r.height],dimensions[slot]);assert.ok(r.bytes>0&&r.bytes<=1048576);assert.equal(r.sourceVerified,true);
}
const old=structuredClone(snapshot.packs);
const c=old.flatMap(p=>p.cards.disaster).find(c=>c.images.game&&c.images.collapsed);
const {game,collapsed}=c.images;c.images.game={...collapsed,sourceVerified:false};c.images.collapsed={...game,sourceVerified:false};c.name='Локальное название';
const repaired=reconcileDatabaseImages(old,snapshot.packs).flatMap(p=>p.cards.disaster).find(x=>x.id===c.id);
assert.equal(repaired.images.game.width,608);assert.equal(repaired.images.collapsed.width,1556);assert.equal(repaired.name,'Локальное название');
c.images.game={assetId:'local-upload',width:608,height:262};delete c.images.start;delete c.images.collapsed;
const preserved=reconcileDatabaseImages(old,snapshot.packs).flatMap(p=>p.cards.disaster).find(x=>x.id===c.id);
assert.equal(preserved.images.game.assetId,'local-upload');assert.ok(!preserved.images.start);assert.ok(!preserved.images.collapsed);
console.log('Database import: 4 packs, 2067 original card IDs, 46 unbound, metadata/media/effects, shared links and no overwrites passed.');
