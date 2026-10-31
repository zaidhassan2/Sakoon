import { crisis, elevated } from './phrases.js';
export const ranks = { none: 0, elevated: 1, crisis: 2 };
export const higher = (a, b) => ranks[a] >= (ranks[b] ?? 0) ? a : b;
export function normalize(text) {
 return text.normalize('NFKD').toLowerCase().replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f]/g, '').replace(/\p{M}/gu, '').replace(/[يك]/g, c => c === 'ي' ? 'ی' : 'ک').replace(/[أإآ]/g, 'ا').replace(/[ؤ]/g, 'و').replace(/[’']/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/(.)\1{2,}/gu, '$1').replace(/\s+/g, ' ').trim();
}
const contains = (text, phrase) => (' ' + text + ' ').includes(' ' + normalize(phrase) + ' ');
export function detect(text) {
 const value = normalize(text);
 const hits = crisis.filter(p => contains(value, p));
 if (hits.length) {
  // Only downgrade a single, explicitly negated/historical/third-party clause.
  // Additional clauses/signals remain crisis, even after a denial.
  const clauses = text.split(/[.!?;۔؟]|\b(?:but|however|lekin)\b/i).filter(s => s.trim());
  const contextual = /\b(?:would never|will never|never would|dont want to|do not want to|used to|years ago|my friend|my sister|my brother|my mother|my father)\b/i;
  if (clauses.length === 1 && hits.length === 1 && contextual.test(value) && !/dont want to be alive|do not want to be alive/.test(value)) return 'elevated';
  if (/^\s*["“].*["”]\s*$/s.test(text) && hits.length === 1) return 'elevated';
  return 'crisis';
 }
 return elevated.some(p => contains(value, p)) ? 'elevated' : 'none';
}
export function assess(messages) {
 const levels = messages.filter(m => m.role === 'user').map(m => detect(m.content));
 const earlierCrisis = levels.slice(0, -1).includes('crisis');
 let level = levels.at(-1) || 'none';
 if (earlierCrisis) level = higher(level, 'elevated');
 if (levels.filter(l => l === 'elevated').length >= 3) level = 'crisis';
 return { level, earlierCrisis };
}
export function language(text) {
 if (/[\u0600-\u06ff]/u.test(text)) return 'ur';
 return /\b(?:mujhe|mera|meri|main|mein|hoon|hun|hai|hain|nahi|bohat|bahut|kya|aap|zindagi|khudkushi|thak|pareshan)\b/i.test(text) ? 'roman' : 'en';
}
