import { EN } from '../i18n/en.js';

/**
 * Pure helper to calculate breathing phase and countdown from elapsed seconds.
 * Exported for deterministic unit testing.
 */
export function computeBreathingTick(elapsedSeconds, paceConfig, totalDurationSeconds) {
  const inSec = paceConfig?.inSeconds || 4;
  const outSec = paceConfig?.outSeconds || 6;
  const cycleSec = inSec + outSec;

  if (elapsedSeconds >= totalDurationSeconds) {
    return {
      completed: true,
      phase: 'done',
      phaseRemainingSeconds: 0,
      totalRemainingSeconds: 0,
      progressInPhase: 0,
    };
  }

  const posInCycle = elapsedSeconds % cycleSec;
  const isInhale = posInCycle < inSec;
  const phase = isInhale ? 'in' : 'out';
  const phaseElapsed = isInhale ? posInCycle : posInCycle - inSec;
  const phaseDuration = isInhale ? inSec : outSec;
  const phaseRemainingSeconds = Math.max(1, Math.ceil(phaseDuration - phaseElapsed));
  const progressInPhase = Math.min(1, Math.max(0, phaseElapsed / phaseDuration));

  return {
    completed: false,
    phase,
    phaseDuration,
    phaseRemainingSeconds,
    totalRemainingSeconds: Math.max(0, Math.ceil(totalDurationSeconds - elapsedSeconds)),
    progressInPhase,
  };
}

export function createBreathingController({ container, onExitToChat, onOpenHelp, isReducedMotion }) {
  const t = EN.exercises.breathing;
  let selectedPace = 'gentle';
  let selectedMinutes = 2;
  let stage = 'setup'; // 'setup' | 'active' | 'complete'
  let checkinChoice = null; // null | 'lighter' | 'same' | 'heavy'
  let intervalId = null;
  let startTimestamp = 0;
  let currentPhase = null;

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startSession() {
    stopTimer();
    stage = 'active';
    checkinChoice = null;
    currentPhase = null;
    startTimestamp = performance.now();
    render();
    updateActiveTick();
    intervalId = setInterval(updateActiveTick, 200);
  }

  function finishSession() {
    stopTimer();
    stage = 'complete';
    render();
    const heading = container.querySelector('[data-complete-heading]');
    if (heading) heading.focus();
  }

  function updateActiveTick() {
    if (stage !== 'active') return;
    const paceObj = t.paces[selectedPace] || t.paces.gentle;
    const totalSec = selectedMinutes * 60;
    const elapsedSec = (performance.now() - startTimestamp) / 1000;
    const tick = computeBreathingTick(elapsedSec, paceObj, totalSec);

    if (tick.completed) {
      finishSession();
      return;
    }

    const phaseTextEl = container.querySelector('[data-breath-phase]');
    const countdownEl = container.querySelector('[data-breath-countdown]');
    const circleEl = container.querySelector('[data-breath-circle]');
    const totalTimerEl = container.querySelector('[data-breath-total-remaining]');

    if (phaseTextEl) {
      const label = tick.phase === 'in' ? t.breatheIn : t.breatheOut;
      if (phaseTextEl.textContent !== label) {
        phaseTextEl.textContent = label;
      }
    }

    if (countdownEl) {
      countdownEl.textContent = `${tick.phaseRemainingSeconds}s`;
    }

    if (totalTimerEl) {
      const mins = Math.floor(tick.totalRemainingSeconds / 60);
      const secs = String(tick.totalRemainingSeconds % 60).padStart(2, '0');
      totalTimerEl.textContent = `${mins}:${secs}`;
    }

    if (circleEl && currentPhase !== tick.phase) {
      currentPhase = tick.phase;
      const reduced = isReducedMotion();
      circleEl.setAttribute('data-phase', tick.phase);
      if (!reduced) {
        circleEl.style.setProperty('--breath-transition-s', `${tick.phaseDuration}s`);
      } else {
        circleEl.style.removeProperty('--breath-transition-s');
      }
    }
  }

  function render() {
    if (!container) return;

    if (stage === 'setup') {
      container.innerHTML = `
        <div class="exercise-card-surface">
          <h1 class="view-title" tabindex="-1">${t.title}</h1>
          <p class="view-subtitle">${t.intro}</p>

          <fieldset class="option-fieldset">
            <legend class="option-legend">${t.paceLabel}</legend>
            <div class="segmented-group" role="group" aria-label="${t.paceLabel}">
              ${Object.values(t.paces)
                .map(
                  (p) => `
                <button
                  type="button"
                  class="segment-btn ${selectedPace === p.id ? 'is-selected' : ''}"
                  aria-pressed="${selectedPace === p.id}"
                  data-pace="${p.id}"
                >
                  <span class="segment-title">${p.label}</span>
                  <span class="segment-detail">${p.detail}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </fieldset>

          <fieldset class="option-fieldset">
            <legend class="option-legend">${t.durationLabel}</legend>
            <div class="segmented-group segmented-group-3" role="group" aria-label="${t.durationLabel}">
              ${t.durations
                .map(
                  (d) => `
                <button
                  type="button"
                  class="segment-btn ${selectedMinutes === d.minutes ? 'is-selected' : ''}"
                  aria-pressed="${selectedMinutes === d.minutes}"
                  data-duration="${d.minutes}"
                >
                  <span class="segment-title">${d.label}</span>
                </button>
              `
                )
                .join('')}
            </div>
          </fieldset>

          <div class="exercise-actions">
            <button type="button" class="btn-primary btn-wide" data-action="start-breathing">
              ${t.beginBtn}
            </button>
          </div>
        </div>
      `;
    } else if (stage === 'active') {
      const reduced = isReducedMotion();
      container.innerHTML = `
        <div class="exercise-card-surface breathing-active-surface">
          <h1 class="visually-hidden">${t.title}</h1>
          <div class="breathing-stage" data-reduced-motion="${reduced}">
            <div class="breathing-circle-wrap">
              <div class="breathing-glow" aria-hidden="true"></div>
              <div class="breathing-circle" data-breath-circle data-phase="in">
                <span class="breathing-phase-label" data-breath-phase aria-live="polite">${t.breatheIn}</span>
                <span class="breathing-countdown" data-breath-countdown>4s</span>
              </div>
            </div>
            <p class="breathing-remaining" aria-label="Time remaining" data-breath-total-remaining>
              ${selectedMinutes}:00
            </p>
          </div>
          <div class="exercise-actions">
            <button type="button" class="btn-secondary" data-action="stop-breathing">
              ${t.stopAnytimeBtn}
            </button>
          </div>
        </div>
      `;
    } else if (stage === 'complete') {
      container.innerHTML = `
        <div class="exercise-card-surface">
          <h1 class="view-title" tabindex="-1" data-complete-heading>${t.readyHeading}</h1>
          <p class="view-subtitle">${t.checkinPrompt}</p>

          <div class="checkin-choices" role="group" aria-label="${t.checkinPrompt}">
            <button
              type="button"
              class="chip-btn ${checkinChoice === 'lighter' ? 'is-selected' : ''}"
              aria-pressed="${checkinChoice === 'lighter'}"
              data-checkin="lighter"
            >${t.feelings.lighter}</button>
            <button
              type="button"
              class="chip-btn ${checkinChoice === 'same' ? 'is-selected' : ''}"
              aria-pressed="${checkinChoice === 'same'}"
              data-checkin="same"
            >${t.feelings.same}</button>
            <button
              type="button"
              class="chip-btn ${checkinChoice === 'heavy' ? 'is-selected' : ''}"
              aria-pressed="${checkinChoice === 'heavy'}"
              data-checkin="heavy"
            >${t.feelings.heavy}</button>
          </div>

          ${
            checkinChoice === 'heavy'
              ? `
            <div class="gentle-followup-box" role="region" aria-label="Support follow-up">
              <p>${t.heavyFollowup}</p>
              <div class="followup-actions">
                <button type="button" class="btn-primary" data-action="talk-about-it">${t.talkAboutItBtn}</button>
                <button type="button" class="btn-care" data-action="open-support">${t.supportOptionsBtn}</button>
              </div>
            </div>
          `
              : `
            <div class="exercise-actions">
              <button type="button" class="btn-primary" data-action="back-to-chat">
                ${EN.exercises.doneBtn}
              </button>
              <button type="button" class="btn-quiet" data-action="skip-checkin">
                ${EN.exercises.skipBtn}
              </button>
            </div>
          `
          }
        </div>
      `;
    }
  }

  function handleClick(e) {
    const paceBtn = e.target.closest('[data-pace]');
    if (paceBtn) {
      selectedPace = paceBtn.getAttribute('data-pace');
      render();
      return;
    }

    const durBtn = e.target.closest('[data-duration]');
    if (durBtn) {
      selectedMinutes = Number(durBtn.getAttribute('data-duration')) || 2;
      render();
      return;
    }

    const checkinBtn = e.target.closest('[data-checkin]');
    if (checkinBtn) {
      const choice = checkinBtn.getAttribute('data-checkin');
      checkinChoice = choice;
      if (choice === 'lighter' || choice === 'same') {
        onExitToChat();
        return;
      }
      render();
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');

    if (action === 'start-breathing') {
      startSession();
    } else if (action === 'stop-breathing') {
      finishSession();
    } else if (action === 'back-to-chat' || action === 'skip-checkin') {
      onExitToChat();
    } else if (action === 'talk-about-it') {
      onExitToChat('Things still feel quite heavy right now');
    } else if (action === 'open-support') {
      onOpenHelp(actionEl);
    }
  }

  container.addEventListener('click', handleClick);

  return {
    mount() {
      stopTimer();
      stage = 'setup';
      checkinChoice = null;
      render();
    },
    destroy() {
      stopTimer();
      container.removeEventListener('click', handleClick);
    },
  };
}
