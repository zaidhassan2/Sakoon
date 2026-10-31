export class ProviderError extends Error {
 constructor(status = 503, retryAfterSeconds = null) { super('provider_unavailable'); this.status = status; this.retryAfterSeconds = retryAfterSeconds; }
}
export async function post(url, body, headers, signal, fetchImpl = fetch) {
 const response = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal });
 if (!response.ok) { const seconds = Number(response.headers.get('retry-after')); throw new ProviderError(response.status, response.status === 429 ? (Number.isFinite(seconds) && seconds > 0 ? seconds : 60) : null); }
 try { return await response.json(); } catch { throw new ProviderError(); }
}
export const tokenCount = n => Number.isFinite(n) && n >= 0 ? n : 0;
// One shared twenty-second budget, including a possible retry. No retry on 4xx.
export async function withRetry(generate, args, { budgetMs = 20000, attemptMs = 12000 } = {}) {
 const deadline = Date.now() + budgetMs;
 for (let attempt = 0; attempt < 2; attempt++) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new ProviderError();
  const controller = new AbortController(); let timer;
  try {
   return await Promise.race([
    generate({ ...args, signal: controller.signal }),
    new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ProviderError(504)); }, Math.min(attemptMs, remaining)); })
   ]);
  } catch (error) {
   const retryable = error?.name === 'AbortError' || error?.name === 'TimeoutError' || error?.status >= 500;
   if (attempt || !retryable || deadline - Date.now() < 100) throw error;
  } finally { clearTimeout(timer); }
 }
}
