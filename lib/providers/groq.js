import { post, ProviderError, tokenCount } from './common.js';
// https://console.groq.com/docs/openai and /docs/reasoning
export function createGroq(env = process.env, fetchImpl = fetch) {
 return { async generate({ system, messages, maxTokens, signal }) {
  if (!env.GROQ_API_KEY) throw new ProviderError();
  const model = env.LLM_MODEL || 'openai/gpt-oss-120b';
  const body = { model, messages: [{ role: 'system', content: system }, ...messages], max_completion_tokens: maxTokens, response_format: { type: 'json_object' } };
  if (model.includes('gpt-oss')) body.reasoning_effort = 'low';
  const data = await post('https://api.groq.com/openai/v1/chat/completions', body, { Authorization: `Bearer ${env.GROQ_API_KEY}` }, signal, fetchImpl);
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new ProviderError();
  return { text, usage: { input: tokenCount(data.usage?.prompt_tokens), output: tokenCount(data.usage?.completion_tokens) } };
 } };
}
export const generate = args => createGroq().generate(args);
