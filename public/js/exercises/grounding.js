import { EN } from '../i18n/en.js';

/**
 * 5-4-3-2-1 Sensory Grounding exercise controller.
 * - One prompt per screen (5 See, 4 Feel, 3 Hear, 2 Smell, 1 Anchor)
 * - Big calm text, tap to continue
 * - Optional notes field (never saved or persisted anywhere; wiped on exit)
 */
export function createGroundingController({ container, onExitToChat }) {
  const t = EN.exercises.grounding;
  let stepIndex = 0;
  let notesInMemory = ['', '', '', '', ''];

  function resetMemory() {
    stepIndex = 0;
    notesInMemory = ['', '', '', '', ''];
  }

  function render() {
    if (!container) return;

    if (stepIndex >= t.steps.length) {
      container.innerHTML = `
        <div class="exercise-card-surface">
          <h1 class="view-title" tabindex="-1" data-grounding-heading>${t.closingHeading}</h1>
          <p class="view-subtitle">${t.closingBody}</p>
          <div class="exercise-actions">
            <button type="button" class="btn-primary" data-action="grounding-done">
              ${EN.exercises.doneBtn}
            </button>
          </div>
        </div>
      `;
      return;
    }

    const step = t.steps[stepIndex];
    const currentNote = notesInMemory[stepIndex] || '';

    container.innerHTML = `
      <div class="exercise-card-surface grounding-step-surface">
        <div class="grounding-progress-header">
          <span class="grounding-step-badge" aria-label="Step ${stepIndex + 1} of 5">${step.count} · ${step.sense}</span>
          <span class="grounding-step-fraction" aria-hidden="true">${stepIndex + 1} / ${t.steps.length}</span>
        </div>

        <h1 class="grounding-prompt-heading" tabindex="-1" data-grounding-heading>${step.prompt}</h1>
        <p class="grounding-hint">${step.hint}</p>

        <div class="grounding-note-group">
          <label for="grounding-note-input" class="field-label">${t.optionalNoteLabel}</label>
          <textarea
            id="grounding-note-input"
            class="calm-textarea grounding-textarea"
            rows="2"
            dir="auto"
            placeholder="${t.optionalNotePlaceholder}"
            data-grounding-note
          ></textarea>
        </div>

        <div class="exercise-actions exercise-actions-row">
          ${
            stepIndex > 0
              ? `<button type="button" class="btn-secondary" data-action="grounding-prev">${t.prevBtn}</button>`
              : ''
          }
          <button type="button" class="btn-primary" data-action="grounding-next">
            ${stepIndex === t.steps.length - 1 ? t.finishBtn : t.nextBtn}
          </button>
        </div>
      </div>
    `;

    const noteEl = container.querySelector('[data-grounding-note]');
    if (noteEl) {
      noteEl.value = currentNote;
    }
  }

  function handleInput(e) {
    if (e.target.matches('[data-grounding-note]')) {
      notesInMemory[stepIndex] = e.target.value;
    }
  }

  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');

    if (action === 'grounding-next') {
      stepIndex += 1;
      render();
      const heading = container.querySelector('[data-grounding-heading]');
      if (heading) heading.focus();
    } else if (action === 'grounding-prev') {
      if (stepIndex > 0) {
        stepIndex -= 1;
        render();
        const heading = container.querySelector('[data-grounding-heading]');
        if (heading) heading.focus();
      }
    } else if (action === 'grounding-done') {
      resetMemory();
      onExitToChat();
    }
  }

  container.addEventListener('input', handleInput);
  container.addEventListener('click', handleClick);

  return {
    mount() {
      resetMemory();
      render();
    },
    destroy() {
      resetMemory();
      container.removeEventListener('input', handleInput);
      container.removeEventListener('click', handleClick);
    },
  };
}
