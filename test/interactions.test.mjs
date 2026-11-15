import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {sets,products} from '../public/demo-data.js';
test('period switching, repeated switching, detail open and close',async()=>{
 const nodes=new Map();
 const get=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',handlers:{},addEventListener(n,f){this.handlers[n]=f},showModal(){this.open=true},close(){this.open=false}});return nodes.get(id)};
 const buttons=['day','week','month'].map(p=>({dataset:{p},classList:{toggle(){}},setAttribute(k,v){this[k]=v}}));
 const context=vm.createContext({sets,products,document:{querySelectorAll:()=>buttons,getElementById:get}});
 const js=(await readFile('public/app.js','utf8')).replace(/^import[^\n]+\n/,'');vm.runInContext(js,context);
 assert.match(get('cards').innerHTML,/420,000/);
 for(const b of [...buttons,...buttons]){b.onclick();assert.match(get('cards').innerHTML,new RegExp(sets[b.dataset.p].amount.toLocaleString('en-US')));assert.equal(b['aria-pressed'],'true')}
 get('details-button').handlers.click();assert.equal(get('modal').open,true);assert.match(get('table').innerHTML,/16,200/);
 get('close-dialog').handlers.click();assert.equal(get('modal').open,false);
});
