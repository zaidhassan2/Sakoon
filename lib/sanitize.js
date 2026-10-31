export const states = ['overwhelmed', 'anxious', 'low_energy', 'angry', 'mixed', 'unclear'];
export function sanitize(value) {
 if (typeof value !== 'string') return '';
 let text = value.replace(/<[^>]*>/g, '').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/(?:https?:\/\/|www\.)\S+|\b[\w-]+(?:\.[\w-]+)*\.(?:com|org|net|io|pk|gov|edu|co|uk)(?:\/\S*)?/gi, '').replace(/[+\p{Nd}][\p{Nd}\s().–—-]*\p{Nd}/gu, match => (match.match(/\p{Nd}/gu) || []).length >= 7 ? '' : match).replace(/^\s*(?:[-+*>#]+|\d+[.)])\s*/gm, '').replace(/[*_`~#|>]/g, '').replace(/\s+/g, ' ').trim();
 const words = text.split(/\s+/);
 if (words.length > 140) { text = words.slice(0, 140).join(' '); const end = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'), text.lastIndexOf('۔'), text.lastIndexOf('؟')); if (end >= 0) text = text.slice(0, end + 1); }
 return text;
}
export function parseOutput(text) {
 try { const parsed = JSON.parse(text); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { data: parsed, parsed: true }; } catch {}
 try { const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { data: parsed, parsed: true }; } catch {}
 return { data: { reply: text }, parsed: false };
}
export function cleanOutput(data) {
 return { reply: sanitize(data.reply), state: states.includes(data.state) ? data.state : 'unclear', suggestedExercise: ['breathing', 'grounding', 'brain_dump'].includes(data.suggestedExercise) ? data.suggestedExercise : null, quickReplies: Array.isArray(data.quickReplies) ? data.quickReplies.filter(s => typeof s === 'string' && s.length <= 40).map(sanitize).filter(Boolean).slice(0, 3) : [] };
}

// Prevent substantial verbatim instruction leakage; not a complete semantic safety classifier.
export function leaksInstructions(reply, system) {
 const words = system.toLowerCase().split(/\s+/);
 const text = reply.toLowerCase().replace(/\s+/g, ' ');
 for (let i = 0; i <= words.length - 12; i++) if (text.includes(words.slice(i, i + 12).join(' '))) return true;
 return false;
}
