import {validateSource} from './validate.mjs';
import {authorize} from './auth.mjs';
import {periodRange} from './data.mjs';
import {readPostgres as readSource} from './postgres.mjs';
function safe(response){const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");return new Response(response.body,{status:response.status,headers});}
export default {async fetch(request,env){
  try{await authorize(request,env)}catch{return safe(new Response('Sign-in required or access not configured',{status:403}))}
  if(request.method!=='GET')return safe(new Response('Method not allowed',{status:405}));
  const url=new URL(request.url);
  if(url.pathname==='/api/validate' && env.VALIDATION_ONLY==='true'){
    if(url.search) return safe(new Response('Invalid parameters',{status:400}));
    try{return safe(Response.json(await validateSource(env)))}catch{return safe(Response.json({error:'Validation failed; activation blocked'},{status:503}))}
  }
  if(url.pathname==='/api/summary'){
    if(env.REAL_DATA_ENABLED!=='true')return safe(Response.json({error:'Real data is disabled'},{status:503}));
    let range;try{if([...url.searchParams.keys()].some(k=>k!=='period'))throw Error();range=periodRange(url.searchParams.get('period')??'day')}catch{return safe(Response.json({error:'Invalid period'},{status:400}))}
    try{return safe(Response.json({...await readSource(env,range),checkedAt:new Date().toISOString()}))}catch{return safe(Response.json({error:'Data unavailable; no partial totals returned'},{status:503}))}
  }
  if(url.pathname.startsWith('/api/'))return safe(new Response('Not found',{status:404}));
  return safe(await env.ASSETS.fetch(request));
}};
