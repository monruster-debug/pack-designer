import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const s=fs.readFileSync('app.js','utf8').replace(/^import .*?;\r?\n/gm,'');
const api=vm.runInNewContext(s.slice(0,s.indexOf('const KEY='))+s.split('\n').filter(l=>l.startsWith('function validPackImage(')||l.startsWith('function hasCardImage(')||l.startsWith('function packImageStatus(')).join('\n')+s.slice(s.indexOf('function sectionChecklistChecks('),s.indexOf('function checklistMarkup('))+';({SPECIAL_GROUPS,sectionChecklistChecks,normalizeDisaster,DISASTER_IMAGES,packImageStatus})',{crypto});
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG3sAAAAASUVORK5CYII=',p={name:'Пак',description:'Описание',cover:image,cards:{}};
const get=id=>api.sectionChecklistChecks(id,p);
assert.ok(get('about').every(c=>c.valid));p.description=' ';assert.equal(get('about')[1].valid,false);p.description='x'.repeat(121);assert.equal(get('about')[1].valid,false);p.description='Описание';
for(const cover of ['', 'data:image/png;base64,AAAA', 'data:image/png;base64,'+'AAAA'.repeat(350000), 'https://example.com/cover.jpg', image]){
 p.cover=cover;const check=get('about')[2];
 assert.equal(check.detail,cover?api.packImageStatus(cover):'Не загружено · JPG, PNG или WebP · до 1 МБ');
 assert.equal(check.error,!!cover&&!check.valid);
 if(cover&&cover!==image)assert.match(check.detail,/Изображение добавлено/);
}
p.cover=image;
for(const id of ['profession','biology','health','hobby','fact','baggage','bunker']){const minimum=id==='bunker'?5:32;p.cards[id]=[];assert.ok(get(id).every(c=>!c.valid));p.cards[id]=Array.from({length:minimum},()=>({name:'Имя',description:'Описание',image}));assert.ok(get(id).every(c=>c.valid));p.cards[id][0].description=' ';if(['fact','bunker'].includes(id))assert.equal(get(id)[2].valid,false);else assert.equal(get(id).length,2);}
p.cards.bunker[0].image='';assert.equal(get('bunker')[3].valid,false);
p.cards.disaster=Array.from({length:10},()=>{const c={name:'Катастрофа',description:'Описание',images:{}};api.normalizeDisaster(c);for(const spec of api.DISASTER_IMAGES)c.images[spec.id]={assetId:'test',width:spec.width,height:spec.height,bytes:100,mime:'image/png'};return c;});assert.ok(get('disaster').every(c=>c.valid));delete p.cards.disaster[0].images.start;assert.equal(get('disaster')[3].valid,false);p.cards.disaster[0].durationRange={min:1,max:99};assert.equal(get('disaster')[4].valid,false);
console.log('Passed: all section checklists, empty/complete states, length limit, missing images and ranges.');

for(const id of ['profession','biology','health','hobby','fact','baggage','bunker']){
 const minimum=id==='bunker'?5:32;
 p.cards[id]=Array.from({length:3},()=>({name:'Имя',description:'Описание',image}));
 assert.equal(get(id)[1].detail,'3 / '+minimum);if(['fact','bunker'].includes(id))assert.equal(get(id)[2].detail,'3 / '+minimum);assert.equal(get(id)[1].valid,false);if(['fact','bunker'].includes(id))assert.equal(get(id)[2].valid,false);else assert.equal(get(id).length,2);
 if(id==='bunker'){assert.equal(get(id)[3].detail,'3 / 5 · до 3 МБ');assert.equal(get(id)[3].valid,false);}
 p.cards[id]=Array.from({length:minimum+1},()=>({name:'Имя',description:'Описание',image}));assert.equal(get(id)[1].detail,(minimum+1)+' / '+(minimum+1));p.cards[id][minimum].name='';assert.equal(get(id)[1].valid,false);
}
p.cards.disaster=p.cards.disaster.slice(1,2);assert.equal(get('disaster')[1].detail,'1 / 10');assert.equal(get('disaster')[3].detail,'4 / 40');assert.ok(get('disaster').every(c=>!c.valid));
console.log('Passed: required denominators, incomplete minimum, above-minimum cards and 40 disaster images.');

p.cards.special=api.SPECIAL_GROUPS.flatMap(g=>g.cards).slice(0,16).map(c=>({...c,sourceId:c.id}));assert.equal(get('special').length,1);assert.equal(get('special')[0].valid,true);p.cards.special.pop();assert.equal(get('special')[0].valid,false);console.log('Passed: special conditions require only 16 cards from any categories.');
