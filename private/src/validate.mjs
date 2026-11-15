import pg from 'pg';
import {readPostgres} from './postgres.mjs';
import {periodRange} from './data.mjs';
// Temporary owner-only activation checks. Never returns source rows or credentials.
export async function validateSource(env,Client=pg.Client){
 if(!env.HYPERDRIVE?.connectionString)throw Error('Connection missing');
 const client=new Client({connectionString:env.HYPERDRIVE.connectionString,connectionTimeoutMillis:10000,query_timeout:20000});
 try{
  await client.connect();
  const {rows:[r]}=await client.query(`SELECT current_user AS name,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls,
  (SELECT count(*)::int FROM pg_auth_members WHERE member=pg_roles.oid) memberships,
  has_column_privilege(current_user,'public.ticketsale','cust_name','SELECT') customer,
  has_column_privilege(current_user,'public.ticketbuy','truck_no','SELECT') vehicle,
  (SELECT count(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND (has_table_privilege(current_user,c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(current_user,c.oid,'INSERT,UPDATE,REFERENCES'))) writes,
  (SELECT count(*)::int FROM pg_class c WHERE c.oid IN ('public.ticketsale'::regclass,'public.ticketbuy'::regclass) AND (NOT c.relrowsecurity OR c.relowner=pg_roles.oid)) unsafe_tables
  FROM pg_roles WHERE rolname=current_user`);
  if(!r||r.name!=='slc_dashboard_reader'||r.rolsuper||r.rolinherit||r.rolcreaterole||r.rolcreatedb||r.rolreplication||r.rolbypassrls||r.memberships!==0||r.customer||r.vehicle||r.writes!==0||r.unsafe_tables!==0)throw Error('Unexpected privilege');
  // These SELECTs must fail even without returning any row. No write test is issued.
  for(const sql of ['SELECT cust_name FROM public.ticketsale LIMIT 0','SELECT truck_no FROM public.ticketbuy LIMIT 0']){
   let denied=false;try{await client.query(sql)}catch(e){if(e.code==='42501')denied=true;else throw e}if(!denied)throw Error('Column denial failed');
  }
  const {rows:[hidden]}=await client.query(`SELECT (SELECT count(ticket)::int FROM public.ticketsale WHERE status<>'O' OR status_cancel IS NOT NULL OR source_deleted IS TRUE) sales,(SELECT count(ticket)::int FROM public.ticketbuy WHERE prod_code<>'09' OR source_deleted IS TRUE) intake`);
  if(hidden.sales!==0||hidden.intake!==0)throw Error('Row restriction failed');
 }finally{await client.end().catch(()=>{})}
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Bangkok'});
 const yesterday=new Date(today+'T00:00:00Z');yesterday.setUTCDate(yesterday.getUTCDate()-1);const completed=yesterday.toISOString().slice(0,10);
 const ranges=[periodRange('day',completed),periodRange('week',today),periodRange('month',today)];
 const samples=[];for(const range of ranges)samples.push(await readPostgres(env,range,Client));
 return {privileges:'passed',columnDenial:'passed',rowRestrictions:'passed',samples,checkedAt:new Date().toISOString()};
}
