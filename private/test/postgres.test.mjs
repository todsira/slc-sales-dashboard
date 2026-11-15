import test from 'node:test';
import assert from 'node:assert/strict';
import {readPostgres} from '../src/postgres.mjs';
const range={start:'2026-11-01',end:'2026-11-15'};
function fixture(fail=false){const calls=[];class Client{constructor(config){calls.push(['config',config]);}async connect(){calls.push(['connect']);}async query(sql,args){calls.push([sql,args]);if(fail&&sql.startsWith('SELECT'))throw Error('upstream secret');return {rows:[]};}async end(){calls.push(['end']);}}return {Client,calls};}
test('fixed SQL in repeatable read and read only transaction',async()=>{const {Client,calls}=fixture();const result=await readPostgres({HYPERDRIVE:{connectionString:'test-only'}},range,Client);assert.equal(result.sales.trips,0);assert(calls.some(c=>c[0]==='BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY'));const selects=calls.filter(c=>c[0].startsWith('SELECT'));assert.equal(selects.length,2);selects.forEach(c=>assert.deepEqual(c[1],[range.start,range.end]));assert.equal(calls.at(-2)[0],'COMMIT');assert.equal(calls.at(-1)[0],'end');});
test('upstream failure closes connection without partial return',async()=>{const {Client,calls}=fixture(true);await assert.rejects(readPostgres({HYPERDRIVE:{connectionString:'test-only'}},range,Client));assert.equal(calls.at(-1)[0],'end');assert(!calls.some(c=>c[0]==='COMMIT'));});
test('missing Hyperdrive fails closed',async()=>{await assert.rejects(readPostgres({},range));});
test('range is bounded and strict',async()=>{for(const r of [{start:'2026-01-01',end:'2026-11-15'},{start:'2026-02-30',end:'2026-03-01'},{start:'2026-11-16',end:'2026-11-15'}])await assert.rejects(readPostgres({HYPERDRIVE:{connectionString:'test-only'}},r));});
