import test from 'node:test';import assert from 'node:assert/strict';import {aggregate,periodRange,readSource}from'../src/data.mjs';
test('Bangkok period selection',()=>{assert.deepEqual(periodRange('week','2026-11-02'),{start:'2026-10-27',end:'2026-11-02'});assert.throws(()=>periodRange('year'))});
const range={start:'2026-11-01',end:'2026-11-02'};
test('completed sales and cancelled exclusion',()=>{const r={date_out_date:'2026-11-01',price_net:'100',net_wght:1000,status:'O',status_cancel:null,type_cach:'เครดิต'};const d=aggregate([r,{...r,status_cancel:'Y'},{...r,status:'I'}],[],range);assert.equal(d.sales.amount,100);assert.equal(d.sales.tonnes,1);assert.equal(d.sales.credit,100)});
test('internal is not incoming; unknown preserved',()=>{const row={date_in_date:'2026-11-01',prod_code:'09',net_wght:1000};const d=aggregate([],['ขึ้นโม่','เทสต็อก','ตักสตีอกโม่',''].map(statkeep=>({...row,statkeep})),range);assert.equal(d.daily[0].intake,2);assert.equal(d.intake.internal,1);assert.equal(d.intake.unclassified,1)});
test('invalid monetary values fail instead of inventing zeros',()=>assert.throws(()=>aggregate([{date_out_date:'2026-11-01',status:'O',status_cancel:null,price_net:null}],[],range)));
test('source failure does not return partial totals',async()=>{await assert.rejects(()=>readSource({SUPABASE_URL:'https://example.supabase.co',SUPABASE_READ_KEY:'synthetic'},range,async()=>new Response('error',{status:500})))});
test('source secrets cannot be sent to arbitrary host',async()=>{await assert.rejects(()=>readSource({SUPABASE_URL:'https://evil.example',SUPABASE_READ_KEY:'synthetic'},range))});
test('invalid calendar dates fail',()=>{assert.throws(()=>periodRange('day','2026-02-30'));assert.throws(()=>aggregate([{status:'O',status_cancel:null,date_out_date:'2026-02-30'}],[],range))});
test('boolean numeric values fail',()=>assert.throws(()=>aggregate([{status:'O',status_cancel:null,date_out_date:'2026-11-01',price_net:true,net_wght:1000}],[],range)));
const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_READ_KEY:'synthetic'};
const row={ticket:1,date_out_date:'2026-11-01',status:'O',status_cancel:null,price_net:100,net_wght:1000,type_cach:'เงินสด'};
function fixture(mode){return async(url,options)=>{if(url.pathname.endsWith('ticketbuy'))return Response.json([],{headers:{'Content-Range':'*/0'}});const offset=Number(options.headers.Range.split('-')[0]);if(mode==='range')return Response.json([row],{headers:{'Content-Range':'5-5/1'}});return Response.json([{...row,ticket:mode==='duplicate'?1:offset+1}],{headers:{'Content-Range':`${offset}-${offset}/2`}})}}
test('pagination accepts server-limited pages and reconciles',async()=>assert.equal((await readSource(env,range,fixture('ok'))).sales.amount,200));
test('pagination duplicate row fails even with stable total',async()=>assert.rejects(()=>readSource(env,range,fixture('duplicate'))));
test('pagination incorrect range fails',async()=>assert.rejects(()=>readSource(env,range,fixture('range'))));
