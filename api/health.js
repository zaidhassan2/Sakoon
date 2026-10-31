import { send, errorBody } from '../lib/http.js';
export default function handler(req, res) { if (req.method !== 'GET') return send(res, 400, errorBody('bad_request')); send(res, 200, { ok: true }); }
