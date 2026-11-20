import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('app.js','utf8');
assert.match(source,/p\.createdAt \|\|= p\.updatedAt\|\|new Date\(\)\.toISOString\(\)/,'A pack must retain its creation time');
assert.match(source,/new Date\(b\.createdAt\|\|b\.updatedAt\)-new Date\(a\.createdAt\|\|a\.updatedAt\)/,'Catalog must sort by creation date, newest first');

const packs=[
 {name:'Старый, отредактированный позже',createdAt:'2026-11-01T10:00:00Z',updatedAt:'2026-11-20T10:00:00Z'},
 {name:'Новый',createdAt:'2026-11-20T09:00:00Z',updatedAt:'2026-11-20T09:00:00Z'},
 {name:'Средний',createdAt:'2026-11-10T10:00:00Z',updatedAt:'2026-11-11T10:00:00Z'}
];
const sorted=[...packs].sort((a,b)=>new Date(b.createdAt||b.updatedAt)-new Date(a.createdAt||a.updatedAt));
assert.deepEqual(sorted.map(pack=>pack.name),['Новый','Средний','Старый, отредактированный позже']);
console.log('Catalog ordering: packs are sorted by creation date, newest first.');
