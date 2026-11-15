import test from 'node:test';import assert from 'node:assert/strict';
import {generateKeyPair,exportJWK,SignJWT}from'jose';import {authorize}from'../src/auth.mjs';import worker from '../src/worker.mjs';
const {publicKey,privateKey}=await generateKeyPair('RS256');const jwk=await exportJWK(publicKey);jwk.kid='test-only';jwk.alg='RS256';
const env={ACCESS_TEAM_DOMAIN:'synthetic-test.cloudflareaccess.com',ACCESS_AUD:'synthetic-audience',OWNER_EMAIL:'owner@example.invalid',APP_ORIGIN:'https://dashboard.example.invalid',REAL_DATA_ENABLED:'false'};
const original=globalThis.fetch;globalThis.fetch=async url=>{assert.equal(String(url),'https://synthetic-test.cloudflareaccess.com/cdn-cgi/access/certs');return Response.json({keys:[jwk]})};
async function token(overrides={}){return new SignJWT({email:env.OWNER_EMAIL,type:'app',...overrides}).setProtectedHeader({alg:'RS256',kid:jwk.kid}).setIssuer('https://'+env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).setSubject('synthetic-owner').setIssuedAt().setExpirationTime('1h').sign(privateKey)}
const req=t=>new Request(env.APP_ORIGIN+'/api/summary',{headers:t?{'Cf-Access-Jwt-Assertion':t}:{}});
test('valid signed owner accepted',async()=>assert.equal(await authorize(req(await token()),env),'synthetic-owner'));
test('missing assertion rejected',async()=>assert.rejects(()=>authorize(req(),env)));
test('wrong owner rejected',async()=>assert.rejects(async()=>authorize(req(await token({email:'other@example.invalid'})),env)));
test('wrong audience rejected',async()=>assert.rejects(async()=>authorize(req(await token()),{...env,ACCESS_AUD:'wrong'})));
test('missing audience config rejected',async()=>assert.rejects(async()=>authorize(req(await token()),{...env,ACCESS_AUD:''})));
test('service type rejected',async()=>assert.rejects(async()=>authorize(req(await token({type:'service'})),env)));
test('alternate hostname rejected',async()=>assert.rejects(async()=>authorize(new Request('https://other.example.invalid',{headers:{'Cf-Access-Jwt-Assertion':await token()}}),env)));
test('tampered token rejected',async()=>{const t=await token();await assert.rejects(()=>authorize(req(t.slice(0,-5)+'xxxxx'),env))});
test('expired token rejected',async()=>{const t=await new SignJWT({email:env.OWNER_EMAIL,type:'app'}).setProtectedHeader({alg:'RS256',kid:jwk.kid}).setIssuer('https://'+env.ACCESS_TEAM_DOMAIN).setAudience(env.ACCESS_AUD).setSubject('owner').setIssuedAt(1).setExpirationTime(2).sign(privateKey);await assert.rejects(()=>authorize(req(t),env))});
test('disabled API never contacts source',async()=>{const r=await worker.fetch(req(await token()),env);assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'private, no-store')});
test('anonymous static assets denied',async()=>{const r=await worker.fetch(new Request(env.APP_ORIGIN+'/'),{...env,ASSETS:{fetch(){throw Error('must not serve')}}});assert.equal(r.status,403)});
test.after(()=>{globalThis.fetch=original});
