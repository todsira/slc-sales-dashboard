import {createRemoteJWKSet,jwtVerify} from 'jose';
const caches=new Map();
export async function authorize(request,env){
  if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN??'')||!env.ACCESS_AUD||!env.OWNER_EMAIL||!env.APP_ORIGIN)throw Error('Unconfigured access');
  const origin=new URL(env.APP_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.APP_ORIGIN||new URL(request.url).origin!==env.APP_ORIGIN)throw Error('Invalid origin');
  const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)throw Error('Unauthorized');
  const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
  if(!caches.has(issuer))caches.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
  const {payload}=await jwtVerify(token,caches.get(issuer),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
  if(payload.email!==env.OWNER_EMAIL||payload.type!=='app')throw Error('Forbidden');return payload.sub;
}
