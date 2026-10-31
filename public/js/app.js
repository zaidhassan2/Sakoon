import { CONFIG } from './config.js';
import { EN } from './i18n/en.js';
import { getModule } from './modules/index.js';
import { sendChatMessage, resolveStateUiEmphasis } from './api.js';
import { storage } from './storage.js';
import { loadHelplines, filterVisibleHelplines, getAvailableCountries } from './helplines.js';
import { openModal, closeModal } from './ui/modal.js';
import { createBreathingController } from './exercises/breathing.js';
import { createGroundingController } from './exercises/grounding.js';
import { createBrainDumpController } from './exercises/brain-dump.js';

const state = {
  currentView: 'welcome', // 'welcome' | 'chat' | 'exercise-breathing' | 'exercise-grounding' | 'exercise-brain_dump'
  moduleId: CONFIG.defaultModuleId,
  messages: [],
  country: CONFIG.defaultCountry,
  helplinesData: null,
  safetyEmphasised: false,
  isWaitingForReply: false,
  showTypingIndicator: false,
  typingTimerId: null,
  activeExerciseController: null,
};

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return EN.greetings.morning;
  if (hour >= 12 && hour < 17) return EN.greetings.afternoon;
  if (hour >= 17 && hour < 22) return EN.greetings.evening;
  return EN.greetings.night;
}

function isReducedMotionActive() {
  const pref = storage.getReduceMotion();
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyAppearancePreferences() {
  const theme = storage.getTheme();
  const textSize = storage.getTextSize();
  const reduceMotion = storage.getReduceMotion();

  const root = document.documentElement;

  if (theme === 'light' || theme === 'dark') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }

  root.setAttribute('data-text-size', textSize);
  root.setAttribute('data-reduce-motion', isReducedMotionActive() ? 'true' : 'false');

  // Update segmented controls inside the menu if rendered
  document.querySelectorAll('[data-theme-opt]').forEach((btn) => {
    const active = btn.getAttribute('data-theme-opt') === theme;
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  document.querySelectorAll('[data-size-opt]').forEach((btn) => {
    const active = btn.getAttribute('data-size-opt') === textSize;
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  document.querySelectorAll('[data-motion-opt]').forEach((btn) => {
    const active = btn.getAttribute('data-motion-opt') === reduceMotion;
    btn.classList.toggle('is-selected', active);
    btn.setAttribute('aria-pressed', String(active));
  });
}

function updateSafetyHeaderState() {
  const helpBtn = document.getElementById('header-help-btn');
  if (helpBtn) {
    helpBtn.setAttribute('data-emphasised', state.safetyEmphasised ? 'true' : 'false');
  }
}

function updateOfflineBanner() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  banner.hidden = !isOffline;
}

function switchView(targetView, { prefillText = '' } = {}) {
  if (state.activeExerciseController) {
    state.activeExerciseController.destroy();
    state.activeExerciseController = null;
  }

  state.currentView = targetView;

  const welcomeEl = document.getElementById('view-welcome');
  const chatEl = document.getElementById('view-chat');
  const exerciseEl = document.getElementById('view-exercise');
  const backToChatBtn = document.getElementById('header-back-btn');
  const brandTitle = document.getElementById('header-brand-name');

  const isWelcome = targetView === 'welcome';
  const isChat = targetView === 'chat';
  const isExercise = targetView.startsWith('exercise-');

  if (welcomeEl) welcomeEl.hidden = !isWelcome;
  if (chatEl) chatEl.hidden = !isChat;
  if (exerciseEl) exerciseEl.hidden = !isExercise;

  if (backToChatBtn) {
    backToChatBtn.hidden = !isExercise;
  }
  if (brandTitle) {
    brandTitle.hidden = isExercise;
  }

  if (isChat) {
    renderChatView();
    if (prefillText) {
      const composer = document.getElementById('chat-composer-input');
      if (composer) {
        composer.value = prefillText;
        autoGrowTextarea(composer);
        composer.focus();
      }
    }
  } else if (isExercise && exerciseEl) {
    const stageContainer = document.getElementById('exercise-stage-container');
    if (stageContainer) {
      stageContainer.innerHTML = '';
      const commonOpts = {
        container: stageContainer,
        onExitToChat: (optionalPrompt) => switchView('chat', { prefillText: optionalPrompt || '' }),
        onOpenHelp: (triggerEl) => openHelpSheet(triggerEl),
        isReducedMotion: isReducedMotionActive,
      };

      if (targetView === 'exercise-breathing') {
        state.activeExerciseController = createBreathingController(commonOpts);
      } else if (targetView === 'exercise-grounding') {
        state.activeExerciseController = createGroundingController(commonOpts);
      } else if (targetView === 'exercise-brain_dump') {
        state.activeExerciseController = createBrainDumpController(commonOpts);
      }

      if (state.activeExerciseController) {
        state.activeExerciseController.mount();
      }
    }
  }
}

function renderCareCardHtml() {
  const info = filterVisibleHelplines(state.helplinesData, state.country);
  const s = EN.safety;

  let buttonsHtml = '';
  if (info.emergency) {
    buttonsHtml += `
      <a href="tel:${escapeHtml(info.emergency.number)}" class="care-call-btn care-call-emergency">
        <span class="care-call-name">${escapeHtml(s.emergencyPrefix)} ${escapeHtml(info.emergency.name)}</span>
        <span class="care-call-number">${escapeHtml(info.emergency.number)}</span>
      </a>
    `;
  }

  for (const line of info.lines) {
    buttonsHtml += `
      <a href="tel:${escapeHtml(line.number)}" class="care-call-btn">
        <div class="care-call-meta">
          <span class="care-call-name">${escapeHtml(line.name)}</span>
          <span class="care-call-hours">${escapeHtml(line.hours)}</span>
        </div>
        <span class="care-call-number">${escapeHtml(line.number)}</span>
      </a>
    `;
  }

  if (info.isOther || (!info.emergency && info.lines.length === 0)) {
    buttonsHtml += `
      <p class="care-fallback-note">${escapeHtml(EN.helpSheet.otherCountryEmergency)}</p>
      <a href="${escapeHtml(info.directoryUrl)}" target="_blank" rel="noopener noreferrer" class="care-call-btn">
        <span class="care-call-name">${escapeHtml(EN.helpSheet.otherCountryDirectoryBtn)}</span>
      </a>
    `;
  }

  return `
    <aside class="care-card" aria-label="Immediate human support">
      <p class="care-card-heading">${escapeHtml(s.crisisHeading)}</p>
      <div class="care-card-buttons">
        ${buttonsHtml}
      </div>
      <div class="care-card-footer">
        <p class="care-card-reassurance">${escapeHtml(s.crisisReassurance)}</p>
        <button type="button" class="btn-quiet care-more-btn" data-action="open-help">
          ${escapeHtml(s.seeSupportBtn)}
        </button>
      </div>
    </aside>
  `;
}

function renderMessageFollowup(lastAssistantMsg, allMessages) {
  if (!lastAssistantMsg || lastAssistantMsg.role !== 'assistant') return '';

  // Check if the preceding user message explicitly asked for an exercise
  const prevUserMsg = [...allMessages].reverse().find((m) => m.role === 'user');
  const userAskedForExercise = prevUserMsg
    ? /\b(exercise|breathe|breathing|grounding|brain dump|guide me|mashq|saans)\b/i.test(prevUserMsg.content)
    : false;

  const emphasis = resolveStateUiEmphasis(lastAssistantMsg, userAskedForExercise);

  let html = `<div class="assistant-followup ${emphasis.extraSpacing ? 'followup-extra-space' : ''}">`;

  // Suggested exercise card (unless dismissed)
  if (emphasis.suggestedExercise && !lastAssistantMsg.suggestionDismissed) {
    const exCard = EN.exercises.cards[emphasis.suggestedExercise];
    if (exCard) {
      const label = emphasis.offerAngryPause
        ? EN.chat.pauseOfferLabel
        : `${EN.chat.tryExercisePrefix} ${exCard.title}, ${exCard.durationLabel}`;
      html += `
        <div class="suggested-exercise-card ${emphasis.emphasiseExerciseCard ? 'is-emphasised' : ''}">
          <button
            type="button"
            class="suggested-exercise-trigger"
            data-action="start-exercise"
            data-exercise="${escapeHtml(exCard.id)}"
          >
            <span class="suggested-exercise-title">${escapeHtml(label)}</span>
            <span class="suggested-exercise-summary">${escapeHtml(exCard.summary)}</span>
          </button>
          <button
            type="button"
            class="suggested-exercise-dismiss"
            aria-label="${escapeHtml(EN.chat.dismissSuggestionLabel)}"
            data-action="dismiss-suggestion"
            data-msg-id="${escapeHtml(lastAssistantMsg.id)}"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      `;
    }
  }

  // Quick reply chips
  if (emphasis.visibleChips.length > 0) {
    html += `
      <div class="quick-replies-row" role="group" aria-label="Suggested replies">
        ${emphasis.visibleChips
          .map(
            (chip) => `
          <button
            type="button"
            class="chip-btn quick-reply-chip"
            dir="auto"
            data-action="send-chip"
            data-chip-text="${escapeHtml(chip)}"
          >
            ${escapeHtml(chip)}
          </button>
        `
          )
          .join('')}
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

function renderFailedMessageNotice(msg) {
  const code = msg.errorCode;
  if (code === 'rate_limited') {
    return `
      <div class="message-error-notice" role="status">
        <p>${escapeHtml(EN.errors.rateLimited)}</p>
        <div class="message-error-actions">
          <button type="button" class="chip-btn" data-action="start-exercise" data-exercise="breathing">
            ${escapeHtml(EN.errors.breathingBtn)}
          </button>
          <button type="button" class="chip-btn is-selected" data-action="retry-message" data-msg-id="${escapeHtml(msg.id)}">
            ${escapeHtml(EN.errors.tryAgainBtn)}
          </button>
        </div>
      </div>
    `;
  }

  if (code === 'provider_unavailable') {
    return `
      <div class="message-error-notice" role="status">
        <p>${escapeHtml(EN.errors.providerUnavailable)}</p>
        <div class="message-error-actions">
          <button type="button" class="chip-btn" data-action="start-exercise" data-exercise="breathing">
            ${escapeHtml(EN.errors.breathingBtn)}
          </button>
          <button type="button" class="chip-btn is-selected" data-action="retry-message" data-msg-id="${escapeHtml(msg.id)}">
            ${escapeHtml(EN.errors.tryAgainBtn)}
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div class="message-error-notice" role="status">
      <p>${escapeHtml(EN.errors.generic)}</p>
      <div class="message-error-actions">
        <button type="button" class="chip-btn is-selected" data-action="retry-message" data-msg-id="${escapeHtml(msg.id)}">
          ${escapeHtml(EN.errors.tryAgainBtn)}
        </button>
      </div>
    </div>
  `;
}

function renderChatView() {
  const emptyContainer = document.getElementById('chat-empty-state');
  const listContainer = document.getElementById('chat-message-list');
  const activeModule = getModule(state.moduleId);

  if (!emptyContainer || !listContainer) return;

  if (state.messages.length === 0 && !state.isWaitingForReply) {
    emptyContainer.hidden = false;
    listContainer.hidden = true;
    listContainer.innerHTML = '';

    emptyContainer.innerHTML = `
      <div class="empty-state-inner">
        <p class="time-greeting">${escapeHtml(getTimeGreeting())}</p>
        <h1 class="empty-heading">${escapeHtml(EN.chat.emptyHeading)}</h1>
        <div class="starter-chips-list" role="group" aria-label="Ways to begin">
          ${activeModule.starterChips
            .map(
              (chip) => `
            <button
              type="button"
              class="starter-chip-btn"
              dir="auto"
              data-action="send-chip"
              data-chip-text="${escapeHtml(chip)}"
            >
              ${escapeHtml(chip)}
            </button>
          `
            )
            .join('')}
        </div>
        <div class="guide-me-row">
          <button type="button" class="btn-secondary guide-me-btn" data-action="open-exercises">
            ${escapeHtml(EN.chat.guideMeBtn)}
          </button>
        </div>
      </div>
    `;
    return;
  }

  emptyContainer.hidden = true;
  listContainer.hidden = false;

  // Find index of the latest message overall to attach quickReplies/suggestedExercise only after the latest assistant reply
  const lastIndex = state.messages.length - 1;

  const itemsHtml = state.messages
    .map((msg, idx) => {
      const isUser = msg.role === 'user';
      const speakerLabel = isUser ? EN.chat.speakerUser : EN.chat.speakerAssistant;
      const isLatestAssistant = !isUser && idx === lastIndex && !state.isWaitingForReply;

      let safetyHtml = '';
      if (!isUser && msg.safetyLevel === 'elevated') {
        safetyHtml = `
          <div class="safety-elevated-note">
            <span>${escapeHtml(EN.safety.elevatedNote)}</span>
            <button type="button" class="inline-link-btn" data-action="open-help">
              ${escapeHtml(EN.safety.seeSupportBtn)}
            </button>
          </div>
        `;
      } else if (!isUser && msg.safetyLevel === 'crisis') {
        safetyHtml = renderCareCardHtml();
      }

      const followupHtml = isLatestAssistant ? renderMessageFollowup(msg, state.messages) : '';
      const errorHtml = isUser && msg.failed ? renderFailedMessageNotice(msg) : '';

      return `
        <article class="message-row ${isUser ? 'message-row-user' : 'message-row-assistant'}">
          <div class="message-bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}">
            <span class="visually-hidden">${escapeHtml(speakerLabel)}: </span>
            <p class="message-text" dir="auto">${escapeHtml(msg.content)}</p>
          </div>
          ${safetyHtml}
          ${errorHtml}
          ${followupHtml}
        </article>
      `;
    })
    .join('');

  const typingHtml = state.showTypingIndicator
    ? `
      <div class="message-row message-row-assistant typing-row" role="status" aria-live="polite">
        <div class="message-bubble bubble-assistant typing-bubble">
          <span class="visually-hidden">${escapeHtml(EN.chat.typingSrText)}</span>
          <span class="typing-dots" aria-hidden="true">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </div>
    `
    : '';

  listContainer.innerHTML = `<h1 class="visually-hidden">${escapeHtml(EN.appName)}</h1>` + itemsHtml + typingHtml;

  // Scroll smoothly or immediately depending on reduced motion
  requestAnimationFrame(() => {
    const lastElement = listContainer.lastElementChild;
    if (lastElement && typeof lastElement.scrollIntoView === 'function') {
      lastElement.scrollIntoView({
        behavior: isReducedMotionActive() ? 'auto' : 'smooth',
        block: 'nearest',
      });
    }
  });
}

async function submitUserMessage(rawContent, existingMsgId = null) {
  const content = String(rawContent || '').trim().slice(0, CONFIG.maxMessageChars);
  if (!content) return;

  if (existingMsgId) {
    // Retry an existing failed message
    state.messages = state.messages.map((m) =>
      m.id === existingMsgId ? { ...m, failed: false, errorCode: null } : m
    );
  } else {
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content,
      failed: false,
      errorCode: null,
    };
    state.messages.push(newMsg);
  }

  storage.saveMessages(state.messages);
  state.isWaitingForReply = true;
  state.showTypingIndicator = false;
  renderChatView();

  // Only show the typing indicator if the response takes longer than 400ms
  clearTimeout(state.typingTimerId);
  state.typingTimerId = setTimeout(() => {
    if (state.isWaitingForReply) {
      state.showTypingIndicator = true;
      renderChatView();
    }
  }, CONFIG.typingIndicatorDelayMs);

  const activeUserMsg = state.messages[state.messages.length - 1];

  try {
    const response = await sendChatMessage({
      moduleId: state.moduleId,
      messages: state.messages.filter((m) => !m.failed),
      country: state.country,
    });

    clearTimeout(state.typingTimerId);
    state.isWaitingForReply = false;
    state.showTypingIndicator = false;

    const safetyLevel = response?.safety?.level || 'none';
    if (safetyLevel === 'crisis') {
      state.safetyEmphasised = true;
      storage.setSafetyEmphasised(true);
      updateSafetyHeaderState();
    }

    const assistantMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content: String(response?.reply || ''),
      safetyLevel,
      state: response?.state || 'unclear',
      suggestedExercise: response?.suggestedExercise || null,
      quickReplies: Array.isArray(response?.quickReplies) ? response.quickReplies : [],
      suggestionDismissed: false,
    };

    state.messages.push(assistantMsg);
    storage.saveMessages(state.messages);
    renderChatView();
  } catch (err) {
    clearTimeout(state.typingTimerId);
    state.isWaitingForReply = false;
    state.showTypingIndicator = false;

    const code = err?.errorData?.code || 'provider_unavailable';
    if (activeUserMsg) {
      activeUserMsg.failed = true;
      activeUserMsg.errorCode = code;
    }
    storage.saveMessages(state.messages);
    renderChatView();
  }
}

function renderHelpSheetContent() {
  const container = document.getElementById('help-sheet-body');
  if (!container) return;

  const countries = getAvailableCountries(state.helplinesData);
  const info = filterVisibleHelplines(state.helplinesData, state.country);
  const t = EN.helpSheet;

  const optionsHtml = [
    ...countries.map(
      (c) =>
        `<option value="${escapeHtml(c.code)}" ${state.country === c.code ? 'selected' : ''}>${escapeHtml(
          c.name
        )}</option>`
    ),
    `<option value="OTHER" ${state.country === 'OTHER' ? 'selected' : ''}>${escapeHtml(
      t.otherCountryOption
    )}</option>`,
  ].join('');

  let detailsHtml = '';

  if (info.isOther) {
    detailsHtml = `
      <div class="help-other-country-box">
        <h3 class="help-section-heading">${escapeHtml(t.otherCountryHeading)}</h3>
        <p class="help-other-emergency">${escapeHtml(t.otherCountryEmergency)}</p>
        <a
          href="${escapeHtml(info.directoryUrl)}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-primary btn-wide help-directory-link"
        >
          ${escapeHtml(t.otherCountryDirectoryBtn)}
        </a>
      </div>
    `;
  } else {
    if (info.emergency) {
      detailsHtml += `
        <div class="help-section">
          <h3 class="help-section-heading">${escapeHtml(t.emergencySectionLabel)}</h3>
          <div class="helpline-item helpline-item-emergency">
            <div class="helpline-meta">
              <span class="helpline-name">${escapeHtml(info.emergency.name)}</span>
              <span class="helpline-hours">${escapeHtml(info.emergency.hours)}</span>
            </div>
            <a href="tel:${escapeHtml(info.emergency.number)}" class="helpline-call-btn">
              <span>${escapeHtml(EN.safety.callPrefix)} ${escapeHtml(info.emergency.number)}</span>
            </a>
          </div>
        </div>
      `;
    }

    if (info.lines.length > 0) {
      detailsHtml += `
        <div class="help-section">
          <h3 class="help-section-heading">${escapeHtml(t.helplinesSectionLabel)}</h3>
          <div class="helpline-list" role="list">
            ${info.lines
              .map(
                (line) => `
              <div class="helpline-item" role="listitem">
                <div class="helpline-meta">
                  <span class="helpline-name">${escapeHtml(line.name)}</span>
                  <span class="helpline-hours">${escapeHtml(line.hours)}</span>
                </div>
                <a href="tel:${escapeHtml(line.number)}" class="helpline-call-btn">
                  <span>${escapeHtml(EN.safety.callPrefix)} ${escapeHtml(line.number)}</span>
                </a>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `;
    }
  }

  container.innerHTML = `
    <div class="help-country-picker-row">
      <label for="help-country-select" class="field-label">${escapeHtml(t.countryLabel)}</label>
      <select id="help-country-select" class="calm-select" data-help-country-select>
        ${optionsHtml}
      </select>
    </div>
    ${detailsHtml}
    ${
      info.lastVerified
        ? `<p class="help-last-verified">${escapeHtml(t.lastCheckedPrefix)} ${escapeHtml(info.lastVerified)}</p>`
        : ''
    }
  `;

  const selectEl = container.querySelector('[data-help-country-select]');
  if (selectEl) {
    selectEl.addEventListener('change', (e) => {
      state.country = e.target.value;
      storage.setCountry(state.country);
      renderHelpSheetContent();
      if (state.currentView === 'chat') {
        renderChatView();
      }
    });
  }
}

function openHelpSheet(triggerEl) {
  renderHelpSheetContent();
  const modal = document.getElementById('modal-help');
  openModal(modal, triggerEl);
}

function openExercisePicker(triggerEl) {
  const modal = document.getElementById('modal-exercises');
  openModal(modal, triggerEl);
}

function openMenuSheet(triggerEl) {
  applyAppearancePreferences();
  const modal = document.getElementById('modal-menu');
  openModal(modal, triggerEl);
}

function openHowItWorksSheet(triggerEl) {
  const modal = document.getElementById('modal-how-it-works');
  openModal(modal, triggerEl);
}

function openAboutSheet(triggerEl) {
  const modal = document.getElementById('modal-about');
  openModal(modal, triggerEl);
}

function autoGrowTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  const maxHeight = 148; // ~5 lines
  const nextHeight = Math.min(maxHeight, Math.max(48, textarea.scrollHeight));
  textarea.style.height = `${nextHeight}px`;
}

function updateCharCounter(textarea) {
  const counterEl = document.getElementById('composer-char-counter');
  if (!counterEl || !textarea) return;
  const len = textarea.value.length;
  if (len >= CONFIG.softCounterThreshold) {
    const remaining = Math.max(0, CONFIG.maxMessageChars - len);
    counterEl.textContent = `${remaining} ${EN.chat.charRemainingSuffix}`;
    counterEl.hidden = false;
  } else {
    counterEl.hidden = true;
  }
}

function bindEvents() {
  // Global click delegation for data-action controls
  document.addEventListener('click', (e) => {
    // Close modal if clicking backdrop
    if (e.target.matches('.modal-backdrop')) {
      closeModal();
      return;
    }

    // Theme, Text Size, Motion segmented buttons inside Menu
    const themeBtn = e.target.closest('[data-theme-opt]');
    if (themeBtn) {
      storage.setTheme(themeBtn.getAttribute('data-theme-opt'));
      applyAppearancePreferences();
      return;
    }

    const sizeBtn = e.target.closest('[data-size-opt]');
    if (sizeBtn) {
      storage.setTextSize(sizeBtn.getAttribute('data-size-opt'));
      applyAppearancePreferences();
      return;
    }

    const motionBtn = e.target.closest('[data-motion-opt]');
    if (motionBtn) {
      storage.setReduceMotion(motionBtn.getAttribute('data-motion-opt'));
      applyAppearancePreferences();
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-action');

    switch (action) {
      case 'welcome-continue':
        storage.setWelcomeSeen(true);
        switchView('chat');
        break;

      case 'open-how-it-works':
        openHowItWorksSheet(actionEl);
        break;

      case 'open-help':
        openHelpSheet(actionEl);
        break;

      case 'open-menu':
        openMenuSheet(actionEl);
        break;

      case 'open-exercises':
        closeModal();
        openExercisePicker(actionEl);
        break;

      case 'open-about':
        closeModal();
        openAboutSheet(actionEl);
        break;

      case 'close-modal':
        closeModal();
        break;

      case 'back-to-chat':
        closeModal();
        switchView('chat');
        break;

      case 'start-exercise': {
        const exId = actionEl.getAttribute('data-exercise') || 'breathing';
        closeModal();
        switchView(`exercise-${exId}`);
        break;
      }

      case 'dismiss-suggestion': {
        const msgId = actionEl.getAttribute('data-msg-id');
        state.messages = state.messages.map((m) =>
          m.id === msgId ? { ...m, suggestionDismissed: true } : m
        );
        storage.saveMessages(state.messages);
        renderChatView();
        break;
      }

      case 'send-chip': {
        const text = actionEl.getAttribute('data-chip-text');
        if (text) {
          submitUserMessage(text);
        }
        break;
      }

      case 'retry-message': {
        const msgId = actionEl.getAttribute('data-msg-id');
        const msg = state.messages.find((m) => m.id === msgId);
        if (msg) {
          submitUserMessage(msg.content, msg.id);
        }
        break;
      }

      case 'clear-chat': {
        state.messages = [];
        state.safetyEmphasised = false;
        storage.clearChatSession();
        updateSafetyHeaderState();
        closeModal();
        if (state.currentView !== 'chat') {
          switchView('chat');
        } else {
          renderChatView();
        }
        break;
      }

      case 'clear-and-leave': {
        storage.clearAllAndLeave();
        break;
      }

      default:
        break;
    }
  });

  // Composer form submission & keyboard behaviour
  const composerForm = document.getElementById('chat-composer-form');
  const composerInput = document.getElementById('chat-composer-input');

  if (composerInput) {
    composerInput.addEventListener('input', () => {
      autoGrowTextarea(composerInput);
      updateCharCounter(composerInput);
    });

    composerInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const isCoarsePointer =
          window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        // On touch devices: Enter = newline. On desktop: Enter sends, Shift+Enter = newline.
        if (!isCoarsePointer && !e.shiftKey) {
          e.preventDefault();
          const val = composerInput.value.trim();
          if (val) {
            composerInput.value = '';
            autoGrowTextarea(composerInput);
            updateCharCounter(composerInput);
            submitUserMessage(val);
          }
        }
      }
    });
  }

  if (composerForm && composerInput) {
    composerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = composerInput.value.trim();
      if (!val) return;
      composerInput.value = '';
      autoGrowTextarea(composerInput);
      updateCharCounter(composerInput);
      submitUserMessage(val);
    });
  }

  window.addEventListener('online', updateOfflineBanner);
  window.addEventListener('offline', updateOfflineBanner);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore SW errors in restricted environments
      });
    });
  }
}

async function initApp() {
  applyAppearancePreferences();

  state.country = storage.getCountry();
  state.messages = storage.getMessages();
  state.safetyEmphasised = storage.isSafetyEmphasised();
  updateSafetyHeaderState();
  updateOfflineBanner();

  bindEvents();
  registerServiceWorker();

  try {
    state.helplinesData = await loadHelplines();
  } catch {
    state.helplinesData = null;
  }

  const params = new URLSearchParams(window.location.search);
  const skipWelcome =
    params.get('autostart') === '1' || storage.isWelcomeSeen() || state.messages.length > 0;

  if (skipWelcome) {
    storage.setWelcomeSeen(true);
    switchView('chat');
  } else {
    switchView('welcome');
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}
