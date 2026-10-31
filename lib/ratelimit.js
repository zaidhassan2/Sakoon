import { createHmac, randomBytes } from 'node:crypto';
const ephemeralSecret = randomBytes(32).toString('hex');
export function clientKey(req, env = process.env, now = Date.now()) {
 // Only trust the platform-overwritten header on Vercel; local proxy headers are untrusted.
 const ip = env.VERCEL === '1' ? String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
 const salt = createHmac('sha256', env.RATE_LIMIT_SECRET || ephemeralSecret).update(String(Math.floor(now / 86400000))).digest();
 return createHmac('sha256', salt).update(ip).digest('hex');
}
export class RateLimiter { async consume(_key) { throw new Error('not_implemented'); } }
export const dailyCap = env => /^\d+$/.test(env.DAILY_REQUEST_CAP || '') ? Number(env.DAILY_REQUEST_CAP) : 800;
function buckets(key, now, cap) { return [[`short:${key}:${Math.floor(now / 600000)}`, 20, 600000 - now % 600000], [`day:${key}:${Math.floor(now / 86400000)}`, 100, 86400000 - now % 86400000], [`global:${Math.floor(now / 86400000)}`, cap, 86400000 - now % 86400000]]; }
export class MemoryRateLimiter extends RateLimiter {
 constructor({ cap = 800, now = Date.now } = {}) { super(); this.cap = cap; this.now = now; this.entries = new Map(); }
 async consume(key) {
  const now = this.now();
  for (const [k, v] of this.entries) if (v.expires <= now) this.entries.delete(k);
  const rows = buckets(key, now, this.cap);
  const blocked = rows.filter(([k, limit]) => (this.entries.get(k)?.count || 0) >= limit);
  if (blocked.length) return { allowed: false, retryAfterSeconds: Math.ceil(Math.max(...blocked.map(r => r[2])) / 1000) };
  for (const [k, , ttl] of rows) this.entries.set(k, { count: (this.entries.get(k)?.count || 0) + 1, expires: now + ttl });
  return { allowed: true, retryAfterSeconds: null };
 }
}
// Atomic EVAL avoids quota races: https://upstash.com/docs/redis/features/restapi
const script = `local wait = 0
for i=1,3 do
 if tonumber(redis.call('GET',KEYS[i]) or '0') >= tonumber(ARGV[(i-1)*2+1]) then wait = math.max(wait, tonumber(ARGV[i*2])) end
end
if wait > 0 then return wait end
for i=1,3 do redis.call('INCR',KEYS[i]); redis.call('PEXPIRE',KEYS[i],ARGV[i*2]) end
return 0`;
export class UpstashRateLimiter extends RateLimiter {
 constructor(env, fetchImpl = fetch) { super(); this.env = env; this.fetch = fetchImpl; }
 async consume(key) {
  const rows = buckets(key, Date.now(), dailyCap(this.env));
  const response = await this.fetch(this.env.UPSTASH_REDIS_REST_URL, { method: 'POST', headers: { Authorization: `Bearer ${this.env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(['EVAL', script, 3, ...rows.map(r => `sukoon:${r[0]}`), ...rows.flatMap(r => [r[1], r[2]])]), signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error('limiter_unavailable');
  const data = await response.json();
  if (data.error || !Number.isFinite(data.result)) throw new Error('limiter_unavailable');
  return { allowed: data.result === 0, retryAfterSeconds: data.result ? Math.ceil(data.result / 1000) : null };
 }
}
export function createLimiter(env = process.env) {
 if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  if (!env.RATE_LIMIT_SECRET) throw new Error('limiter_unavailable');
  return new UpstashRateLimiter(env);
 }
 return new MemoryRateLimiter({ cap: dailyCap(env) });
}
