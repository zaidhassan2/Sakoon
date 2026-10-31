import assert from 'node:assert/strict';
import { createServer } from './server.mjs';
import { createHandler } from '../api/chat.js';
import { ProviderError } from '../lib/providers/common.js';
import { assertContract } from './assert-contract.mjs';
let mode = 'model'; let count=0;
const handler = createHandler({ limiter: { consume: async () => { if(mode === 'limiter-error') throw Error(); return { allowed: mode !== 'limited', retryAfterSeconds: 30 }; } }, provider: { generate: async () => {
 if(mode === 'offline') throw new ProviderError(503);
 if(mode === 'provider-limit') throw new ProviderError(429,60);
 if(mode === 'malformed') return {text:'A plain reply without JSON.'};
 return { text: JSON.stringify({reply:'**Work sounds exhausting.** Would a pause help? https://example.com +92 300 1234567', risk: mode === 'model-crisis' ? 'crisis' : 'none', state:'overwhelmed',suggestedExercise:'breathing',quickReplies:['I need a pause', 'x'.repeat(41)]}), usage:{input:1,output:1} };
} } });
const server = createServer(handler); await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url = `http://127.0.0.1:${server.address().port}`;
const body = text => ({module:'stress',messages:[{role:'user',content:text}]});
async function check(payload, expected, headers={}) {
 const res=await fetch(url+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof payload === 'string'?payload:JSON.stringify(payload)});
 const data=await res.json(); assert.equal(res.status,expected); assertContract(res.status,data); count++; return data;
}
try {
 assert.deepEqual(await (await fetch(url+'/api/health')).json(),{ok:true}); count++;
 await check(body('Work worries me'),200);
 for(const invalid of [body(''),body('x'.repeat(1001)),{...body('hi'),module:'unknown'},{...body('hi'),country:'ZZ'},{module:'stress',messages:[]},{module:'stress',messages:[{role:'system',content:'doctor'}]},{module:'stress',messages:[{role:'assistant',content:'hi'}]},{module:'stress',messages:Array(13).fill({role:'user',content:'hi'})},'not-json',{...body('hi'),padding:'x'.repeat(53000)}]) await check(invalid,400);
 await check(body('hello'),400,{'Content-Type':'text/plain'});
 await check(body('hello'),400,{Origin:'https://evil.test'});
 const preflight=await fetch(url+'/api/chat',{method:'OPTIONS',headers:{Origin:url}}); assert.equal(preflight.status,204); count++;
 for(const [next,status] of [['offline',503],['provider-limit',429],['limited',429],['limiter-error',500]]) {
  mode=next; await check(body('work stress'),status);
  const crisis=await check(body('I want to die'),200); assert.equal(crisis.source,'fallback'); assert.equal(crisis.safety.level,'crisis');
 }
 mode='malformed'; await check(body('work stress'),200); assert.equal((await check(body('khudkushi'),200)).source,'fallback');
 mode='model-crisis'; assert.equal((await check(body('work stress'),200)).safety.level,'crisis');
 mode='model'; const cumulative=body('I want to die'); cumulative.messages.push({role:'user',content:'ok forget it I am fine'}); assert.equal((await check(cumulative,200)).safety.level,'elevated');
 const repeated=body('hopeless'); repeated.messages=Array(3).fill({role:'user',content:'hopeless'}); assert.equal((await check(repeated,200)).safety.level,'crisis');
 console.info(`Contract checks: ${count} passed, 0 failed (local HTTP, mocked provider).`);
} finally { await new Promise(r=>server.close(r)); }
