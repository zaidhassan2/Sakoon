export function send(res, status, body) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.end(JSON.stringify(body)); }
export const errorBody = (code, retryAfterSeconds = null) => ({ error: { code, message: { bad_request: 'Please check your message and try again.', rate_limited: 'Please give us a little time before trying again.', provider_unavailable: 'We could not connect just now. Please try again shortly.', server_error: 'Something went wrong. Please try again shortly.' }[code], retryAfterSeconds } });
export function cors(req, res, env) {
 const origin = req.headers.origin;
 res.setHeader('Vary', 'Origin');
 if (!origin) return true;
 const host = req.headers.host;
 const same = origin === `https://${host}` || (env.VERCEL !== '1' && origin === `http://${host}`);
 if (!same && origin !== env.ALLOWED_ORIGIN) return false;
 res.setHeader('Access-Control-Allow-Origin', origin);
 res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
 res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 return true;
}
