import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('app.js','utf8');
const start=source.indexOf('function catalogBanner(){');
const end=source.indexOf("document.addEventListener('click',async e=>{if(!e.target.closest('[data-remove-banner]'))",start);
assert.ok(start>=0&&end>start,'Catalog banner renderer must be present');

function banner(value='',admin=true){
 const ctx={catalogBannerUrl:value,superadminWorkspace:admin,esc:value=>String(value),icon:()=>'',btn:(label,kind='',attrs='')=>'<button class="'+kind+'" '+attrs+'>'+label+'</button>'};
 return vm.runInNewContext(source.slice(start,end)+';catalogBanner()',ctx);
}

const empty=banner();
assert.match(empty,/data-upload-kind="advertising"/);
assert.match(empty,/data-upload-state="empty"/);
assert.match(empty,/Добавить баннер/);
assert.match(empty,/1500 × 300/);
assert.match(empty,/JPG, PNG или WebP · до 1 МБ/);
assert.doesNotMatch(empty,/Баннер добавлен/);

const uploaded=banner('data:image/png;base64,ok');
assert.match(uploaded,/data-upload-state="uploaded"/);
assert.match(uploaded,/Баннер добавлен/);
assert.match(uploaded,/Заменить баннер/);
assert.match(uploaded,/data-remove-banner="true"/);

const playerBanner=banner('data:image/png;base64,ok',false);
assert.match(playerBanner,/data-upload-state="uploaded"/);
assert.doesNotMatch(playerBanner,/Заменить баннер|Баннер добавлен|type="file"/,'Players must see the shared banner without admin controls');

for(const required of [
 "fetch('/api/catalog-banner')",
 "await saveCatalogBanner(legacy);localStorage.removeItem(LEGACY_BANNER_KEY)",
 "await saveCatalogBanner(await fileDataUrl(file));render();toast('Баннер сохранён для всех пользователей')",
 "data-image-input",
 "data-disaster-image",
 "data-constructor-audio-file"
]) assert.ok(source.includes(required),'Expected state transition is missing: '+required);

const css=fs.readFileSync('style.css','utf8');
assert.match(css,/\.catalog-banner>img\{[^}]*object-fit:cover/,'Banner must crop with cover, not squeeze with contain');
const server=fs.readFileSync('server.mjs','utf8');
assert.match(server,/pathname==='\/api\/catalog-banner'/,'Server must expose a shared banner endpoint');
assert.match(server,/writeFile\(bannerFile/,'Server must persist the shared banner');

assert.match(source,/<aside class="catalog-ad-rail" aria-label="Рекламные баннеры">/);
assert.match(source,/<section class="catalog-ad-slot" aria-label="Рекламный баннер /);
assert.doesNotMatch(source.slice(source.indexOf('<aside class="catalog-ad-rail"'),source.indexOf('<aside class="catalog-ad-rail"')+600),/type="file"/,'Static ad rail must not masquerade as a file uploader');
console.log('Upload states: ad banner, user images, disaster images and audio transitions passed.');
