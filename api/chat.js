import { validate, readBody } from '../lib/validate.js';
import { modules } from '../lib/modules/index.js';
import { assess, higher } from '../lib/safety/detect.js';
import { templates, thirdPartyTemplates } from '../lib/safety/templates.js';
import { parseOutput, cleanOutput, leaksInstructions } from '../lib/sanitize.js';
import { createLimiter, clientKey } from '../lib/ratelimit.js';
import { getProvider } from '../lib/providers/index.js';
import { withRetry } from '../lib/providers/common.js';
import { send, errorBody, cors } from '../lib/http.js';
export function createHandler({ env = process.env, provider, limiter, retryOptions } = {}) {
 let activeLimiter = limiter;
 return async function handler(req, res) {
  let level = 'none', payload, module, lang = 'roman', earlierCrisis = false;
  const fallback = () => {
   const crisisMode = level === 'crisis' || earlierCrisis;
   const thirdParty = /\bmy (?:friend|sister|brother|mother|father)\b/i.test(payload.messages.at(-1).content);
   return { reply: (crisisMode ? (thirdParty ? thirdPartyTemplates : templates) : module.fallbackTemplates)[lang], safety: { level }, state: 'unclear', suggestedExercise: null, quickReplies: [], source: 'fallback' };
  };
  try {
   if (!cors(req, res, env)) return send(res, 400, errorBody('bad_request'));
   if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
   if (req.method !== 'POST' || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return send(res, 400, errorBody('bad_request'));
   try { payload = validate(await readBody(req)); } catch { return send(res, 400, errorBody('bad_request')); }
   module = modules.get(payload.module);
   ({ level, earlierCrisis } = assess(payload.messages));
   // Detection always precedes any quota/provider operation.
   activeLimiter ||= createLimiter(env);
   const quota = await activeLimiter.consume(clientKey(req, env));
   if (!quota.allowed) {
    if (level === 'crisis') return send(res, 200, fallback());
    res.setHeader('Retry-After', String(quota.retryAfterSeconds));
    return send(res, 429, errorBody('rate_limited', quota.retryAfterSeconds));
   }
   let output;
   try {
    const chosen = provider || getProvider(env);
    output = await withRetry(args => chosen.generate(args), { system: module.systemPrompt + (earlierCrisis ? '\nEarlier in this conversation the user showed crisis signals; stay in careful, warm check-in mode.' : ''), messages: payload.messages, maxTokens: 350 }, retryOptions);
   } catch (error) {
    if (level === 'crisis') return send(res, 200, fallback());
    const limited = error?.status === 429;
    const delay = limited ? error.retryAfterSeconds || 60 : null;
    if (limited) res.setHeader('Retry-After', String(delay));
    return send(res, limited ? 429 : 503, errorBody(limited ? 'rate_limited' : 'provider_unavailable', delay));
   }
   // The only runtime log: numeric usage, never model text or errors.
   console.info(JSON.stringify({ inputTokens: Number.isFinite(output.usage?.input) ? output.usage.input : 0, outputTokens: Number.isFinite(output.usage?.output) ? output.usage.output : 0 }));
   const { data, parsed } = parseOutput(output.text);
   level = higher(level, ['none', 'elevated', 'crisis'].includes(data.risk) ? data.risk : 'none');
   const cleaned = cleanOutput(data);
   // Use reviewed templates for all crisis responses; model assessment can only increase risk.
   if (leaksInstructions(cleaned.reply, module.systemPrompt) || /calm down|just think positive|it could be worse|everything happens for a reason/i.test(cleaned.reply)) return send(res, 200, fallback());
   if (level === 'crisis' || !cleaned.reply || (parsed && typeof data.reply !== 'string')) return send(res, 200, fallback());
   return send(res, 200, { ...cleaned, safety: { level }, source: 'model' });
  } catch {
   if (level === 'crisis' && payload) return send(res, 200, fallback());
   return send(res, 500, errorBody('server_error'));
  }
 };
}
export default createHandler();
