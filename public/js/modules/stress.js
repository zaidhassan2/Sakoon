/**
 * Module configuration for "stress".
 * Adding a new module (such as "overthinking") later requires only one new module file
 * and one line in js/modules/index.js.
 */
export const stressModule = Object.freeze({
  id: 'stress',
  name: 'Stress',
  tagline: 'A quiet space when everything feels like too much at once.',
  tint: 'var(--color-primary)',
  starterChips: [
    'My mind feels really full right now',
    'I feel tense and exhausted',
    'Work and family pressure is piling up',
  ],
  exercises: ['breathing', 'grounding', 'brain_dump'],
});
