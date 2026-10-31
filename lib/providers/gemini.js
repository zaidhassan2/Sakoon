import { post, ProviderError, tokenCount } from './common.js';
// https://ai.google.dev/api/generate-content and /gemini-api/docs/thinking
export function createGemini(env = process.env, fetchImpl = fetch) {
 return { async generate({ system, messages, maxTokens, signal }) {
  if (!env.GEMINI_API_KEY) throw new ProviderError();
  const model = env.LLM_MODEL || 'gemini-3.8-flash';
  const generationConfig = { maxOutputTokens: maxTokens, responseMimeType: 'application/json' };
  if (model.startsWith('gemini-2.5')) generationConfig.thinkingConfig = { thinkingBudget: model.includes('pro') ? 128 : 0 };
  else if (/^gemini-[34]/.test(model)) generationConfig.thinkingConfig = { thinkingLevel: 'LOW' };
  const data = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { systemInstruction: { parts: [{ text: system }] }, contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), generationConfig }, { 'x-goog-api-key': env.GEMINI_API_KEY }, signal, fetchImpl);
  const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || '').join('');
  if (!text?.trim()) throw new ProviderError();
  return { text, usage: { input: tokenCount(data.usageMetadata?.promptTokenCount), output: tokenCount(data.usageMetadata?.candidatesTokenCount) + tokenCount(data.usageMetadata?.thoughtsTokenCount) } };
 } };
}
export const generate = args => createGemini().generate(args);
