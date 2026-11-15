import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sets,products} from '../public/demo-data.js';
for(const [period,d] of Object.entries(sets)){
 test(`${period}: chart and KPI totals reconcile`,()=>{
  assert.equal(d.a.reduce((a,b)=>a+b,0),d.sold);
  assert.equal(d.b.reduce((a,b)=>a+b,0),d.intake);
  assert.equal(d.labels.length,d.a.length);assert.equal(d.a.length,d.b.length);
  assert.equal(d.amount*.35+d.amount*.65,d.amount);
  assert.equal(products.reduce((n,p)=>n+p[1],0),1);
  assert.ok(d.internal>=0); assert.ok(d.trips>0);
 });
}
test('page includes explicit demo disclosure, local logo and no inline handlers',async()=>{
 const s=await readFile('public/index.html','utf8');
 assert.match(s,/ข้อมูลสมมติ/);assert.match(s,/ยังไม่ได้เชื่อมฐานข้อมูล/);
 assert.match(s,/slc-logo\.png/);assert.doesNotMatch(s,/onclick=/);
 assert.match(s,/aria-labelledby="detail-title"/);
 const b=await readFile('public/slc-logo.png');assert.equal(b.subarray(1,4).toString(),'PNG');
});
test('demo does not connect to a backend or include credential placeholders',async()=>{
 const s=(await Promise.all(['app.js','demo-data.js','index.html'].map(p=>readFile('public/'+p,'utf8')))).join('');
 assert.doesNotMatch(s,/fetch\(|XMLHttpRequest|supabase\.co|service_role|sb_secret_|eyJ[A-Za-z0-9_-]{20,}/);
 const h=await readFile('public/_headers','utf8');assert.match(h,/connect-src 'none'/);
});
