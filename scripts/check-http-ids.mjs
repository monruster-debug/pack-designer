import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const source = fs.readFileSync('app.js', 'utf8').replace(/^import .*?;\r?\n/gm, '');
const bootstrap = source.slice(0, source.indexOf('const KEY='));
// HTTP origins expose getRandomValues but not the secure-context randomUUID API.
const api = vm.runInNewContext(bootstrap + ';({uid,initial})', {
  crypto: { getRandomValues: bytes => crypto.getRandomValues(bytes) }
});
const ids = new Set();
for (let i=0;i<1000;i++) {
  const id=api.uid();
  assert.match(id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  ids.add(id);
}
assert.equal(ids.size,1000);
const pack=api.initial();
assert.ok(pack.cards.profession.length>0,'Fresh HTTP storage must initialize a starter pack');
const native=vm.runInNewContext(bootstrap+';uid()', {crypto:{randomUUID:()=> 'native-id'}});
assert.equal(native,'native-id','Keep native UUID support in HTTPS/localhost');
console.log('HTTP IDs: fresh pack bootstrap without randomUUID, UUID v4 bits, uniqueness and native path passed.');
