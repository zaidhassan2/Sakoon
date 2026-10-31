import { createGroq } from './groq.js';
import { createGemini } from './gemini.js';
import { ProviderError } from './common.js';
export function getProvider(env = process.env) {
 if ((env.LLM_PROVIDER || 'groq') === 'groq') return createGroq(env);
 if (env.LLM_PROVIDER === 'gemini') return createGemini(env);
 throw new ProviderError();
}
