import { CONFIG } from './config.js';

/**
 * Storage manager following strict privacy rules:
 * - Conversation, welcome-seen flag, country selection, and session safety emphasis live in sessionStorage ONLY.
 * - Theme, text size, and reduce-motion override live in localStorage ONLY (non-sensitive UI preferences).
 * - Zero cookies are ever read or written.
 */

function safeGetSession(key, fallback = null) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSetSession(key, value) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota or private mode errors gracefully
  }
}

function safeGetLocal(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw !== null ? raw : fallback;
  } catch {
    return fallback;
  }
}

function safeSetLocal(key, value) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore private browsing restrictions
  }
}

export const storage = {
  isWelcomeSeen() {
    return Boolean(safeGetSession(CONFIG.sessionKeys.welcomeSeen, false));
  },

  setWelcomeSeen(seen = true) {
    safeSetSession(CONFIG.sessionKeys.welcomeSeen, Boolean(seen));
  },

  getMessages() {
    const list = safeGetSession(CONFIG.sessionKeys.messages, []);
    return Array.isArray(list) ? list : [];
  },

  saveMessages(messages) {
    if (!Array.isArray(messages)) return;
    // Only persist non-failed or serializable message items in sessionStorage
    const clean = messages.slice(-30).map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      safetyLevel: m.safetyLevel || 'none',
      state: m.state || 'unclear',
      suggestedExercise: m.suggestedExercise || null,
      quickReplies: Array.isArray(m.quickReplies) ? m.quickReplies : [],
      errorCode: m.errorCode || null,
      failed: Boolean(m.failed),
      suggestionDismissed: Boolean(m.suggestionDismissed),
    }));
    safeSetSession(CONFIG.sessionKeys.messages, clean);
  },

  getCountry() {
    return safeGetSession(CONFIG.sessionKeys.country, CONFIG.defaultCountry) || CONFIG.defaultCountry;
  },

  setCountry(countryCode) {
    safeSetSession(CONFIG.sessionKeys.country, countryCode);
  },

  isSafetyEmphasised() {
    return Boolean(safeGetSession(CONFIG.sessionKeys.safetyEmphasised, false));
  },

  setSafetyEmphasised(flag = true) {
    safeSetSession(CONFIG.sessionKeys.safetyEmphasised, Boolean(flag));
  },

  getTheme() {
    const val = safeGetLocal(CONFIG.localKeys.theme, 'system');
    return ['system', 'light', 'dark'].includes(val) ? val : 'system';
  },

  setTheme(theme) {
    if (['system', 'light', 'dark'].includes(theme)) {
      safeSetLocal(CONFIG.localKeys.theme, theme);
    }
  },

  getTextSize() {
    const val = safeGetLocal(CONFIG.localKeys.textSize, 'normal');
    return ['normal', 'large', 'xlarge'].includes(val) ? val : 'normal';
  },

  setTextSize(size) {
    if (['normal', 'large', 'xlarge'].includes(size)) {
      safeSetLocal(CONFIG.localKeys.textSize, size);
    }
  },

  getReduceMotion() {
    const val = safeGetLocal(CONFIG.localKeys.reduceMotion, 'system');
    return ['system', 'on', 'off'].includes(val) ? val : 'system';
  },

  setReduceMotion(mode) {
    if (['system', 'on', 'off'].includes(mode)) {
      safeSetLocal(CONFIG.localKeys.reduceMotion, mode);
    }
  },

  clearChatSession() {
    try {
      window.sessionStorage.removeItem(CONFIG.sessionKeys.messages);
      window.sessionStorage.removeItem(CONFIG.sessionKeys.safetyEmphasised);
    } catch {
      // ignore
    }
  },

  clearAllAndLeave() {
    try {
      window.sessionStorage.clear();
    } catch {
      // ignore
    }
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    window.location.replace(CONFIG.safeExitUrl);
  },
};
