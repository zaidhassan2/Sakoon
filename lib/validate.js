import { modules } from './modules/index.js';
export const MAX_BYTES = 52000;
const countries = new Set('AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' '));
export function validate(body) {
 if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.byteLength(JSON.stringify(body)) > MAX_BYTES) throw new Error('bad_request');
 if (!modules.has(body.module) || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 12) throw new Error('bad_request');
 for (const m of body.messages) if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 1000) throw new Error('bad_request');
 if (body.messages.at(-1).role !== 'user' || (body.country !== undefined && !countries.has(body.country))) throw new Error('bad_request');
 return { module: body.module, country: body.country ?? 'PK', messages: body.messages.map(({ role, content }) => ({ role, content })) };
}
export async function readBody(req) {
 if (req.body !== undefined) return typeof req.body === 'string' || Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString()) : req.body;
 let size = 0; const chunks = [];
 for await (const chunk of req) { size += chunk.length; if (size > MAX_BYTES) throw new Error('bad_request'); chunks.push(chunk); }
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
