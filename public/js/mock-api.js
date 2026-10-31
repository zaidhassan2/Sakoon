/**
 * Mock API implementation for Sukoon.
 * Enabled via "?mock=1" in the URL query string (and shared with the dev server middleware).
 * Simulates all API contract scenarios:
 * - normal reply
 * - low_energy reply ("low-energy-test" or tired/exhausted cues)
 * - suggestedExercise ("breathing" | "grounding" | "brain_dump")
 * - crisis ("crisis-test") -> always HTTP 200
 * - elevated ("elevated-test") -> HTTP 200
 * - rate_limited ("limit-test") -> HTTP 429
 * - provider_unavailable ("down-test") -> HTTP 503
 * - 2.5s slow reply ("slow-test")
 * - Roman Urdu reply ("roman-urdu-test" or Roman Urdu phrasing)
 * - Urdu-script reply ("urdu-test" or Urdu Unicode script)
 */

const URDU_SCRIPT_REGEX = /[\u0600-\u06FF]/;
const ROMAN_URDU_WORDS = /\b(mujhe|bohat|buhut|pareshan|tension|thak|thakan|neend|dil|dimagh|zindagi|samajh|nahi|kya|karoon|sakoon|sukoon|ghabrahat|udaas)\b/i;

export function evaluateMockScenario(payload) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  const lastMsg = messages[messages.length - 1];
  const rawText = String(lastMsg?.content || '').trim();
  const lower = rawText.toLowerCase();

  if (!rawText || lastMsg?.role !== 'user') {
    return {
      status: 400,
      delayMs: 120,
      body: {
        error: {
          code: 'bad_request',
          message: 'Last message must be from user and between 1 and 1000 characters.',
          retryAfterSeconds: null,
        },
      },
    };
  }

  const isSlow = lower.includes('slow-test');
  const baseDelayMs = isSlow ? 2500 : 520;

  // Error scenarios
  if (lower.includes('limit-test')) {
    return {
      status: 429,
      delayMs: baseDelayMs,
      body: {
        error: {
          code: 'rate_limited',
          message: 'Too many requests at the moment.',
          retryAfterSeconds: 60,
        },
      },
    };
  }

  if (lower.includes('down-test')) {
    return {
      status: 503,
      delayMs: baseDelayMs,
      body: {
        error: {
          code: 'provider_unavailable',
          message: 'The language service is temporarily unreachable.',
          retryAfterSeconds: 30,
        },
      },
    };
  }

  // Safety: Crisis (ALWAYS 200 per API contract; no phone numbers in reply text)
  if (lower.includes('crisis-test')) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          "I'm really glad you told me how heavy this feels right now. Please know you don't have to go through this moment by yourself. Talking to a caring human right now can help, and I am right here with you too.",
        safety: { level: 'crisis' },
        state: 'overwhelmed',
        suggestedExercise: 'breathing',
        quickReplies: ['Stay here with me', 'Let us breathe slowly'],
        source: 'fallback',
      },
    };
  }

  // Safety: Elevated
  if (lower.includes('elevated-test')) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'It sounds like you have been carrying a heavy load for a long time without much relief. We can take this one small breath at a time, and there is no rush to explain everything at once.',
        safety: { level: 'elevated' },
        state: 'overwhelmed',
        suggestedExercise: 'grounding',
        quickReplies: ['Everything feels heavy', 'Guide me gently', 'Just sit with me'],
        source: 'model',
      },
    };
  }

  // Roman Urdu reply
  if (lower.includes('roman-urdu-test') || (!URDU_SCRIPT_REGEX.test(rawText) && ROMAN_URDU_WORDS.test(rawText))) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'Main samajh sakta hoon ke is waqt dimagh par bohat bojh mehsoos ho raha hai. Aap ko abhi sab kuch theek karne ki zaroorat nahi hai. Agar aap chahein toh hum aahista aahista baat kar sakte hain.',
        safety: { level: 'none' },
        state: 'anxious',
        suggestedExercise: 'breathing',
        quickReplies: ['Bohat thakan hai', 'Saans ki mashq', 'Bas sun lein'],
        source: 'model',
      },
    };
  }

  // Urdu script reply
  if (lower.includes('urdu-test') || URDU_SCRIPT_REGEX.test(rawText)) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'میں آپ کی بات سن رہا ہوں۔ جب ذہن پر بہت بوجھ ہو تو تھکن محسوس ہونا بالکل فطری بات ہے۔ آپ کو ابھی سب کچھ حل کرنے کی ضرورت نہیں، بس ایک لمحے کے لیے سانس لیں۔',
        safety: { level: 'none' },
        state: 'overwhelmed',
        suggestedExercise: 'breathing',
        quickReplies: ['ذہن بہت بھاری ہے', 'سانس کی مشق کریں', 'تھوڑی دیر بات کریں'],
        source: 'model',
      },
    };
  }

  // Low energy state
  if (
    lower.includes('low-energy-test') ||
    lower.includes('exhausted') ||
    lower.includes('tired') ||
    lower.includes('drained') ||
    lower.includes('no energy')
  ) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'When your energy is this low, even putting words together takes effort. You do not need to explain everything. We can simply take a quiet moment here.',
        safety: { level: 'none' },
        state: 'low_energy',
        suggestedExercise: null,
        quickReplies: ['Just sit quietly', 'Too tired to think'],
        source: 'model',
      },
    };
  }

  // Angry state
  if (lower.includes('angry-test') || lower.includes('angry') || lower.includes('furious') || lower.includes('frustrated')) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'It makes sense that you feel frustrated when so much pressure keeps building up. If you would like, we can take a slow pause first, or you can let the words out here.',
        safety: { level: 'none' },
        state: 'angry',
        suggestedExercise: 'breathing',
        quickReplies: ['Pause for a breath', 'Let me vent', 'It feels unfair'],
        source: 'model',
      },
    };
  }

  // Brain dump suggestion
  if (
    lower.includes('brain-dump-test') ||
    lower.includes('piling up') ||
    lower.includes('full right now') ||
    lower.includes('too many things') ||
    lower.includes('work and family')
  ) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'When work, family, and expectations all ask for your attention at the same time, your mind rarely gets a quiet corner. Would it help to set those thoughts down outside your head for a few minutes, or talk about the loudest one first?',
        safety: { level: 'none' },
        state: 'overwhelmed',
        suggestedExercise: 'brain_dump',
        quickReplies: ['Talk about the loudest one', 'Everything feels urgent', 'I feel pulled in pieces'],
        source: 'model',
      },
    };
  }

  // Grounding suggestion
  if (lower.includes('grounding-test') || lower.includes('racing') || lower.includes('spinning') || lower.includes('anxious')) {
    return {
      status: 200,
      delayMs: baseDelayMs,
      body: {
        reply:
          'When thoughts start moving fast, coming back to the room around you can make things feel a little steadier. We can take it very slowly.',
        safety: { level: 'none' },
        state: 'anxious',
        suggestedExercise: 'grounding',
        quickReplies: ['My thoughts are racing', 'Help me slow down', 'Tell me more'],
        source: 'model',
      },
    };
  }

  // Default gentle stress response with breathing suggestion
  return {
    status: 200,
    delayMs: baseDelayMs,
    body: {
      reply:
        'Thank you for sharing that with me. You do not have to figure everything out all at once tonight. What part of this feels heaviest right now?',
      safety: { level: 'none' },
      state: 'overwhelmed',
      suggestedExercise: 'breathing',
      quickReplies: ['Work pressure', 'Feeling alone in it', 'Hard to rest'],
      source: 'model',
    },
  };
}

export async function mockChatRequest(payload, { signal } = {}) {
  const result = evaluateMockScenario(payload);

  await new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, result.delayMs);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true }
      );
    }
  });

  if (result.status !== 200) {
    const err = new Error(result.body?.error?.message || 'Request failed');
    err.status = result.status;
    err.errorData = result.body?.error || {
      code: 'server_error',
      message: 'Something went wrong',
      retryAfterSeconds: null,
    };
    throw err;
  }

  return result.body;
}
