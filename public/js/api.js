import { CONFIG } from './config.js';
import { mockChatRequest } from './mock-api.js';

/**
 * Pure helper to prepare and validate the POST /api/chat payload
 * according to the API CONTRACT:
 * - module: string ("stress")
 * - messages: oldest -> newest, last item must be role "user", max 12 items, each content 1-1000 chars
 * - country: ISO-3166 alpha-2 (default "PK")
 */
export function buildApiRequestPayload({ moduleId = CONFIG.defaultModuleId, messages = [], country = CONFIG.defaultCountry }) {
  const validMessages = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, CONFIG.maxMessageChars),
    }))
    .slice(-CONFIG.maxMessages);

  const normalizedCountry =
    typeof country === 'string' && /^[A-Z]{2}$/i.test(country.trim())
      ? country.trim().toUpperCase()
      : CONFIG.defaultCountry;

  return {
    module: moduleId || CONFIG.defaultModuleId,
    messages: validMessages,
    country: normalizedCountry,
  };
}

/**
 * Pure helper to compute how `state` adjusts gentle UI emphasis after the latest reply.
 * Rules from spec:
 * - overwhelmed or anxious: emphasise the exercise card.
 * - low_energy: show at most ONE chip and extra spacing, no exercise card unless the user asks.
 * - angry: offer a pause (breathing).
 * - NEVER display the state or any label about the person.
 */
export function resolveStateUiEmphasis(response, userAskedForExercise = false) {
  const state = response?.state || 'unclear';
  const rawChips = Array.isArray(response?.quickReplies)
    ? response.quickReplies
        .filter((c) => typeof c === 'string' && c.trim().length > 0)
        .map((c) => c.trim().slice(0, 40))
        .slice(0, 3)
    : [];

  let suggestedExercise = response?.suggestedExercise || null;
  let emphasiseExerciseCard = false;
  let extraSpacing = false;
  let offerAngryPause = false;
  let visibleChips = rawChips;

  if (state === 'overwhelmed' || state === 'anxious') {
    emphasiseExerciseCard = Boolean(suggestedExercise);
  } else if (state === 'low_energy') {
    visibleChips = rawChips.slice(0, 1);
    extraSpacing = true;
    if (!userAskedForExercise) {
      suggestedExercise = null;
    }
  } else if (state === 'angry') {
    offerAngryPause = true;
    if (!suggestedExercise) {
      suggestedExercise = 'breathing';
    }
  }

  return {
    visibleChips,
    suggestedExercise,
    emphasiseExerciseCard,
    extraSpacing,
    offerAngryPause,
  };
}

export function isMockModeEnabled(searchString = typeof window !== 'undefined' ? window.location.search : '') {
  try {
    const params = new URLSearchParams(searchString);
    return params.get('mock') === '1';
  } catch {
    return false;
  }
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends chat request to POST /api/chat (or mock-api when ?mock=1 is active).
 * Enforces 25s timeout and 1 automatic retry ONLY on network error.
 */
export async function sendChatMessage({ moduleId, messages, country }) {
  const payload = buildApiRequestPayload({ moduleId, messages, country });

  if (isMockModeEnabled()) {
    return mockChatRequest(payload);
  }

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  };

  let response;
  let lastError;

  // Attempt up to 2 times (initial + 1 retry ONLY on network error, not abort/timeout or HTTP error)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      response = await fetchWithTimeout(CONFIG.apiEndpoint, requestOptions, CONFIG.apiTimeoutMs);
      break;
    } catch (err) {
      lastError = err;
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      if (isTimeout || attempt === 1) {
        const netErr = new Error('Network error');
        netErr.status = 0;
        netErr.errorData = {
          code: 'provider_unavailable',
          message: 'Network failure or timeout',
          retryAfterSeconds: null,
        };
        throw netErr;
      }
      // Small pause before single automatic retry on network error
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const apiErr = new Error(data?.error?.message || `HTTP ${response.status}`);
    apiErr.status = response.status;
    apiErr.errorData = data?.error || {
      code:
        response.status === 429
          ? 'rate_limited'
          : response.status === 400
          ? 'bad_request'
          : response.status === 503
          ? 'provider_unavailable'
          : 'server_error',
      message: 'Request did not complete',
      retryAfterSeconds: null,
    };
    throw apiErr;
  }

  return data;
}

export async function checkApiHealth() {
  try {
    const res = await fetchWithTimeout(CONFIG.healthEndpoint, { method: 'GET' }, 5000);
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}
