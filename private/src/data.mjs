export function periodRange(period, today = new Date().toLocaleDateString('en-CA', {timeZone:'Asia/Bangkok'})) {
  if (!['day','week','month'].includes(period) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) throw Error('Invalid period');
  const end = new Date(today+'T00:00:00Z');
  if(!Number.isFinite(end.getTime())||end.toISOString().slice(0,10)!==today)throw Error('Invalid date');
  const start = new Date(end);
  if (period==='week') start.setUTCDate(start.getUTCDate()-6);
  if (period==='month') start.setUTCDate(1);
  return {start:start.toISOString().slice(0,10),end:today};
}
function validDate(value,range){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('Invalid source date');return value>=range.start&&value<=range.end;}
function number(value) { if(!['number','string'].includes(typeof value) || (typeof value==='string'&&!/^-?\d+(?:\.\d+)?$/.test(value)) || !Number.isFinite(Number(value))) throw Error('Invalid source number'); return Number(value); }
export function aggregate(sales,intake,range) {
  const out={range,sales:{amount:0,tonnes:0,trips:0,cash:0,credit:0,other:0,products:[]},intake:{direct:0,stock:0,internal:0,unclassified:0,trips:0},daily:[],sourceMaxSync:null,warning:'ข้อมูลตามรอบซิงก์ ไม่ใช่การยืนยันว่าซิงก์ครบ; วันนี้อาจยังไม่สิ้นวัน'};
  const products=new Map(),daily=new Map();
  const day=d=>{if(!daily.has(d))daily.set(d,{date:d,sales:0,intake:0});return daily.get(d)};
  const sync=r=>{if(r.synced_at && (!out.sourceMaxSync || r.synced_at>out.sourceMaxSync))out.sourceMaxSync=r.synced_at};
  for(const r of sales){
    if(r.source_deleted===true||r.status!=='O'||r.status_cancel!==null)continue;
    if(!validDate(r.date_out_date,range))continue;
    const amount=number(r.price_net),tonnes=number(r.net_wght)/1000;
    out.sales.amount+=amount;out.sales.tonnes+=tonnes;out.sales.trips++;
    out.sales[r.type_cach==='เงินสด'?'cash':r.type_cach==='เครดิต'?'credit':'other']+=amount;
    const key=String(r.prod_code??'');if(!products.has(key))products.set(key,{code:key,name:String(r.prod_name??key),tonnes:0,amount:0});
    const p=products.get(key);p.tonnes+=tonnes;p.amount+=amount;day(r.date_out_date).sales+=tonnes;sync(r);
  }
  for(const r of intake){
    if(r.source_deleted===true||r.prod_code!=='09'||!validDate(r.date_in_date,range))continue;
    const tonnes=number(r.net_wght)/1000;
    const kind=r.statkeep==='ขึ้นโม่'?'direct':r.statkeep==='เทสต็อก'?'stock':['ตักสต็อกโม่','ตักสตีอกโม่'].includes(r.statkeep)?'internal':'unclassified';
    out.intake[kind]+=tonnes;out.intake.trips++;if(['direct','stock'].includes(kind))day(r.date_in_date).intake+=tonnes;sync(r);
  }
  out.sales.products=[...products.values()].sort((a,b)=>b.tonnes-a.tonnes);out.daily=[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date));return out;
}
export async function readSource(env,range,fetcher=fetch){
  const origin=new URL(env.SUPABASE_URL);if(origin.protocol!=='https:'||!origin.hostname.endsWith('.supabase.co')||origin.pathname!=='/'||origin.search||origin.username||origin.password)throw Error('Invalid source configuration');
  if(!env.SUPABASE_READ_KEY)throw Error('Missing source credential');
  async function rows(table,date,columns,filters){
    const all=[];const seen=new Set();let expected;
    for(let offset=0;offset<100000;){
      const url=new URL('/rest/v1/'+table,origin);
      url.searchParams.set('select',columns);url.searchParams.set('order','ticket.asc');url.searchParams.set('and',`(${date}.gte.${range.start},${date}.lte.${range.end})`);
      for(const[k,v]of Object.entries(filters))url.searchParams.set(k,v);
      const res=await fetcher(url,{headers:{apikey:env.SUPABASE_READ_KEY,...(env.SUPABASE_READ_KEY.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+env.SUPABASE_READ_KEY}),Range:`${offset}-${offset+999}`,Prefer:'count=exact'},redirect:'error',signal:AbortSignal.timeout(15000)});
      if(!res.ok)throw Error('Source unavailable');
      const total=Number(res.headers.get('Content-Range')?.split('/')[1]);if(!Number.isInteger(total)||total<0||total>100000)throw Error('Source count unavailable');
      if(expected!==undefined&&expected!==total)throw Error('Source changed during read');expected=total;
      const page=await res.json();if(!Array.isArray(page)||page.length>1000)throw Error('Invalid source');
      const part=res.headers.get('Content-Range').split('/')[0];if(page.length && part!==`${offset}-${offset+page.length-1}`)throw Error('Invalid source range');
      for(const row of page){if(!Number.isInteger(row.ticket)||seen.has(row.ticket))throw Error('Duplicate/invalid source row');seen.add(row.ticket)}
      all.push(...page);offset+=page.length;
      if(all.length===total)return all;if(!page.length||all.length>total)throw Error('Incomplete source');
    }throw Error('Source too large');
  }
  const [sales,intake]=await Promise.all([
    rows('ticketsale','date_out_date','ticket,date_out_date,prod_code,prod_name,net_wght,price_net,type_cach,status,status_cancel,source_deleted,synced_at',{status:'eq.O',status_cancel:'is.null',source_deleted:'not.is.true'}),
    rows('ticketbuy','date_in_date','ticket,date_in_date,prod_code,net_wght,statkeep,source_deleted,synced_at',{prod_code:'eq.09',source_deleted:'not.is.true'})]);
  return aggregate(sales,intake,range);
}
