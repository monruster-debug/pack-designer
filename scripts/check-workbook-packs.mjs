import assert from 'node:assert/strict';
import {workbookPacks,appendWorkbookPacks} from '../data/workbook-packs.js';
const original={id:'user',name:'Existing',cards:{}};
const merged=appendWorkbookPacks([original],p=>p);
assert.equal(merged[0],original);assert.equal(merged.length,6);
assert.equal(workbookPacks.reduce((n,p)=>n+Object.values(p.cards).reduce((s,c)=>s+c.length,0),0),2243);
assert.equal(appendWorkbookPacks(merged,p=>p).length,6);
merged[1].cards.profession[0].name='User edit';
assert.equal(appendWorkbookPacks(merged,p=>p)[1].cards.profession[0].name,'User edit');
assert.equal(workbookPacks[0].cards.profession[0].name,'Врач');
for(const p of workbookPacks){const cards=Object.values(p.cards).flat();assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);assert.ok(cards.every(c=>c.name&&c.sourceCell));assert.equal(p.status,'draft');}
console.log('Passed: 5 packs / 2243 cards, stable IDs, no overwrites, idempotent import, source coordinates.');
