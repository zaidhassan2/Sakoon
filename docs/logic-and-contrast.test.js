import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { buildApiRequestPayload, resolveStateUiEmphasis } from '../public/js/api.js';
import { evaluateMockScenario } from '../tests/fixtures/mock-api.js';
import { filterVisibleHelplines } from '../public/js/helplines.js';
import { computeBreathingTick } from '../public/js/exercises/breathing.js';
import { parseBrainDumpLines } from '../public/js/exercises/brain-dump.js';
import { getModule } from '../public/js/modules/index.js';

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

test('WCAG 2.2 AA Contrast Verification — Light & Dark Themes', () => {
  const light = {
    bg: '#F6F3EE',
    surface: '#FCFBF8',
    surfaceElevated: '#FAF7F2',
    text: '#1F2A2E',
    muted: '#526167',
    primary: '#2D665F',
    primaryContrast: '#FAF8F4',
    primarySoft: '#DCEBE7',
    primarySoftText: '#1A423D',
    userBubble: '#EFE7DA',
    uiOutline: '#738288',
    careBg: '#FFF1E3',
    careBorder: '#B3773B',
    careText: '#4A2F12',
    careBtnBg: '#5E3A14',
    careBtnText: '#FFF8F0',
  };

  const dark = {
    bg: '#0F1514',
    surface: '#172120',
    surfaceElevated: '#1E2B29',
    text: '#E8EFED',
    muted: '#9FB0AC',
    primary: '#84C7BA',
    primaryContrast: '#0F1514',
    primarySoft: '#1F3330',
    primarySoftText: '#D7EFEA',
    userBubble: '#24302D',
    uiOutline: '#6B807C',
    careBg: '#2A2118',
    careBorder: '#C4925A',
    careText: '#F7E6D4',
    careBtnBg: '#E8B98A',
    careBtnText: '#231609',
  };

  // Rule: Never pure #000 or #FFF backgrounds
  for (const [name, hex] of Object.entries({ ...light, ...dark })) {
    if (name.toLowerCase().includes('bg') || name.toLowerCase().includes('surface')) {
      assert.notEqual(hex.toUpperCase(), '#FFFFFF', `${name} must not be pure #FFFFFF`);
      assert.notEqual(hex.toUpperCase(), '#000000', `${name} must not be pure #000000`);
    }
  }

  // Light theme text pairs (>= 4.5:1)
  assert.ok(contrastRatio(light.text, light.bg) >= 4.5);
  assert.ok(contrastRatio(light.text, light.surface) >= 4.5);
  assert.ok(contrastRatio(light.text, light.userBubble) >= 4.5);
  assert.ok(contrastRatio(light.muted, light.bg) >= 4.5);
  assert.ok(contrastRatio(light.muted, light.surface) >= 4.5);
  assert.ok(contrastRatio(light.primary, light.bg) >= 4.5);
  assert.ok(contrastRatio(light.primary, light.surface) >= 4.5);
  assert.ok(contrastRatio(light.primaryContrast, light.primary) >= 4.5);
  assert.ok(contrastRatio(light.primarySoftText, light.primarySoft) >= 4.5);
  assert.ok(contrastRatio(light.careText, light.careBg) >= 4.5);
  assert.ok(contrastRatio(light.careBtnText, light.careBtnBg) >= 4.5);

  // Light theme UI component outlines (>= 3.0:1)
  assert.ok(contrastRatio(light.uiOutline, light.bg) >= 3.0);
  assert.ok(contrastRatio(light.uiOutline, light.surface) >= 3.0);
  assert.ok(contrastRatio(light.careBorder, light.careBg) >= 3.0);

  // Dark theme text pairs (>= 4.5:1)
  assert.ok(contrastRatio(dark.text, dark.bg) >= 4.5);
  assert.ok(contrastRatio(dark.text, dark.surface) >= 4.5);
  assert.ok(contrastRatio(dark.text, dark.userBubble) >= 4.5);
  assert.ok(contrastRatio(dark.muted, dark.bg) >= 4.5);
  assert.ok(contrastRatio(dark.muted, dark.surface) >= 4.5);
  assert.ok(contrastRatio(dark.primary, dark.bg) >= 4.5);
  assert.ok(contrastRatio(dark.primary, dark.surface) >= 4.5);
  assert.ok(contrastRatio(dark.primaryContrast, dark.primary) >= 4.5);
  assert.ok(contrastRatio(dark.primarySoftText, dark.primarySoft) >= 4.5);
  assert.ok(contrastRatio(dark.careText, dark.careBg) >= 4.5);
  assert.ok(contrastRatio(dark.careBtnText, dark.careBtnBg) >= 4.5);

  // Dark theme UI component outlines (>= 3.0:1)
  assert.ok(contrastRatio(dark.uiOutline, dark.bg) >= 3.0);
  assert.ok(contrastRatio(dark.uiOutline, dark.surface) >= 3.0);
  assert.ok(contrastRatio(dark.careBorder, dark.careBg) >= 3.0);
});

test('API contract payload builder trims to 12 messages and 1000 chars', () => {
  const fifteenMessages = Array.from({ length: 15 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `Message ${i + 1} ` + 'x'.repeat(1050),
  }));

  const payload = buildApiRequestPayload({
    moduleId: 'stress',
    messages: fifteenMessages,
    country: 'pk',
  });

  assert.equal(payload.module, 'stress');
  assert.equal(payload.country, 'PK');
  assert.equal(payload.messages.length, 12);
  assert.equal(payload.messages[11].role, 'user');
  assert.equal(payload.messages[11].content.length, 1000);
});

test('State UI emphasis rules respect overwhelmed, low_energy, and angry states', () => {
  const overwhelmedRes = resolveStateUiEmphasis({
    state: 'overwhelmed',
    suggestedExercise: 'breathing',
    quickReplies: ['One', 'Two', 'Three', 'Four'],
  });
  assert.equal(overwhelmedRes.emphasiseExerciseCard, true);
  assert.equal(overwhelmedRes.visibleChips.length, 3);

  const lowEnergyRes = resolveStateUiEmphasis(
    {
      state: 'low_energy',
      suggestedExercise: 'breathing',
      quickReplies: ['Chip 1', 'Chip 2', 'Chip 3'],
    },
    false
  );
  assert.equal(lowEnergyRes.visibleChips.length, 1);
  assert.equal(lowEnergyRes.extraSpacing, true);
  assert.equal(lowEnergyRes.suggestedExercise, null);

  const lowEnergyAskedRes = resolveStateUiEmphasis(
    {
      state: 'low_energy',
      suggestedExercise: 'breathing',
      quickReplies: ['Chip 1', 'Chip 2'],
    },
    true
  );
  assert.equal(lowEnergyAskedRes.suggestedExercise, 'breathing');

  const angryRes = resolveStateUiEmphasis({
    state: 'angry',
    suggestedExercise: null,
    quickReplies: ['Pause'],
  });
  assert.equal(angryRes.offerAngryPause, true);
  assert.equal(angryRes.suggestedExercise, 'breathing');
});

test('Mock API scenarios cover crisis, elevated, rate_limited, provider_unavailable, slow, Roman Urdu, and Urdu script', () => {
  const crisis = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'crisis-test' }],
  });
  assert.equal(crisis.status, 200);
  assert.equal(crisis.body.safety.level, 'crisis');
  assert.equal(/\d{3,}/.test(crisis.body.reply), false, 'Crisis reply must never contain phone numbers');

  const elevated = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'elevated-test' }],
  });
  assert.equal(elevated.status, 200);
  assert.equal(elevated.body.safety.level, 'elevated');

  const limit = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'limit-test' }],
  });
  assert.equal(limit.status, 429);
  assert.equal(limit.body.error.code, 'rate_limited');

  const down = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'down-test' }],
  });
  assert.equal(down.status, 503);
  assert.equal(down.body.error.code, 'provider_unavailable');

  const slow = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'slow-test' }],
  });
  assert.equal(slow.delayMs, 2500);

  const romanUrdu = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'roman-urdu-test' }],
  });
  assert.equal(romanUrdu.status, 200);
  assert.ok(romanUrdu.body.reply.includes('Main samajh sakta hoon'));

  const urdu = evaluateMockScenario({
    module: 'stress',
    messages: [{ role: 'user', content: 'urdu-test' }],
  });
  assert.equal(urdu.status, 200);
  assert.ok(/[\u0600-\u06FF]/.test(urdu.body.reply));
});

test('Helplines filter excludes show=false entries and supports PK and OTHER', () => {
  const helplinesRaw = fs.readFileSync(path.resolve('public/data/helplines.json'), 'utf-8');
  const helplinesData = JSON.parse(helplinesRaw);

  const pk = filterVisibleHelplines(helplinesData, 'PK');
  assert.equal(pk.isOther, false);
  assert.equal(pk.emergency.number, '1122');
  assert.equal(pk.lines.length, 3);
  assert.equal(
    pk.lines.some((l) => l.id === 'pk-unverified-legacy' || l.number === '0800-00000'),
    false,
    'Entries with show=false must never be returned'
  );

  const other = filterVisibleHelplines(helplinesData, 'OTHER');
  assert.equal(other.isOther, true);
  assert.equal(other.directoryUrl, 'https://findahelpline.com');
});

test('Breathing and Brain Dump pure helpers', () => {
  const gentlePace = { inSeconds: 4, outSeconds: 6 };
  const t1 = computeBreathingTick(1.5, gentlePace, 120);
  assert.equal(t1.phase, 'in');
  assert.equal(t1.phaseRemainingSeconds, 3);

  const t2 = computeBreathingTick(5.2, gentlePace, 120);
  assert.equal(t2.phase, 'out');
  assert.equal(t2.phaseRemainingSeconds, 5);

  const tDone = computeBreathingTick(120, gentlePace, 120);
  assert.equal(tDone.completed, true);

  const dumpItems = parseBrainDumpLines('- First thought\n• Second thought\n\nThird thought');
  assert.equal(dumpItems.length, 3);
  assert.equal(dumpItems[0].text, 'First thought');
  assert.equal(dumpItems[1].text, 'Second thought');

  const mod = getModule('stress');
  assert.equal(mod.id, 'stress');
  assert.equal(mod.starterChips.length, 3);
});
