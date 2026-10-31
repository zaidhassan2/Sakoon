import assert from 'node:assert/strict';
import { states, sanitize } from '../lib/sanitize.js';
export function assertContract(status, data) {
 if (status !== 200) {
  assert.deepEqual(Object.keys(data), ['error']);
  assert.deepEqual(Object.keys(data.error).sort(), ['code','message','retryAfterSeconds']);
  assert.equal(data.error.code, {400:'bad_request',429:'rate_limited',503:'provider_unavailable',500:'server_error'}[status]);
  assert.equal(typeof data.error.message,'string');
  assert.ok(data.error.retryAfterSeconds === null || (Number.isFinite(data.error.retryAfterSeconds) && data.error.retryAfterSeconds >= 0));
  return;
 }
 assert.deepEqual(Object.keys(data).sort(), ['quickReplies','reply','safety','source','state','suggestedExercise']);
 assert.equal(typeof data.reply,'string'); assert.ok(data.reply.length > 0);
 assert.ok(data.reply.split(/\s+/).length <= 140);
 assert.equal(sanitize(data.reply),data.reply);
 assert.deepEqual(Object.keys(data.safety),['level']);
 assert.ok(['none','elevated','crisis'].includes(data.safety.level));
 assert.ok(states.includes(data.state));
 assert.ok([null,'breathing','grounding','brain_dump'].includes(data.suggestedExercise));
 assert.ok(['model','fallback'].includes(data.source));
 assert.ok(Array.isArray(data.quickReplies) && data.quickReplies.length <= 3);
 for (const chip of data.quickReplies) { assert.equal(typeof chip,'string'); assert.ok(chip.length <= 40); assert.equal(sanitize(chip),chip); }
 if(data.safety.level === 'crisis') assert.equal(data.quickReplies.length,0);
}
