import pg from 'pg';
import {aggregate,periodRange} from './data.mjs';

// Fixed reporting columns only. Never accept table/column identifiers from requests.
const SALES = `SELECT ticket,date_out_date::text,prod_code,prod_name,net_wght,price_net,type_cach,status,status_cancel,source_deleted,synced_at::text FROM public.ticketsale WHERE date_out_date >= $1::date AND date_out_date <= $2::date AND status='O' AND status_cancel IS NULL AND source_deleted IS NOT TRUE ORDER BY ticket LIMIT 100001`;
const INTAKE = `SELECT ticket,date_in_date::text,prod_code,net_wght,statkeep,source_deleted,synced_at::text FROM public.ticketbuy WHERE date_in_date >= $1::date AND date_in_date <= $2::date AND prod_code='09' AND source_deleted IS NOT TRUE ORDER BY ticket LIMIT 100001`;
export async function readPostgres(env,range,Client=pg.Client){
  if(!env.HYPERDRIVE?.connectionString)throw Error('Missing source connection');
  // Reject malformed or oversized ranges even when called outside the HTTP handler.
  periodRange('day',range.start);periodRange('day',range.end);
  const days=(Date.parse(range.end)-Date.parse(range.start))/86400000;
  if(days<0||days>30)throw Error('Invalid reporting range');
  const client=new Client({connectionString:env.HYPERDRIVE.connectionString,connectionTimeoutMillis:10000,query_timeout:20000});
  try{
    await client.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    await client.query("SET LOCAL statement_timeout = '15s'");
    const sales=await client.query(SALES,[range.start,range.end]);
    const intake=await client.query(INTAKE,[range.start,range.end]);
    if(sales.rows.length>100000||intake.rows.length>100000)throw Error('Source too large');
    const result=aggregate(sales.rows,intake.rows,range);
    await client.query('COMMIT');
    return result;
  }finally{await client.end().catch(()=>{});}
}
