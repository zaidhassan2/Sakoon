import { EN } from '../i18n/en.js';

/**
 * Pure helper to split brain dump text into individual thought cards.
 * Exported for deterministic unit tests.
 */
export function parseBrainDumpLines(rawText) {
  if (typeof rawText !== 'string') return [];
  return rawText
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter((line) => line.length > 0)
    .slice(0, 25)
    .map((text, index) => ({
      id: `item-${index + 1}`,
      text,
      bucket: null, // 'influence' | 'not_in_control' | null
    }));
}

export function createBrainDumpController({ container, onExitToChat }) {
  const t = EN.exercises.brainDump;
  let step = 1; // 1: write, 2: sort cards, 3: pick one tiny thing, 4: soft closing
  let rawInput = '';
  let items = [];
  let chosenItemText = '';

  function wipeAll() {
    step = 1;
    rawInput = '';
    items = [];
    chosenItemText = '';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function render() {
    if (!container) return;

    if (step === 1) {
      const parsedCount = parseBrainDumpLines(rawInput).length;
      container.innerHTML = `
        <div class="exercise-card-surface">
          <div class="exercise-header-inline">
            <h1 class="view-title" tabindex="-1" data-bd-heading>${t.title}</h1>
            <button type="button" class="btn-quiet" data-action="bd-clear">${t.clearBtn}</button>
          </div>
          <label for="brain-dump-textarea" class="field-label">${t.step1Label}</label>
          <p class="field-hint">${t.step1Hint}</p>
          <textarea
            id="brain-dump-textarea"
            class="calm-textarea brain-dump-textarea"
            rows="5"
            dir="auto"
            placeholder="${t.step1Placeholder}"
            data-bd-input
          ></textarea>
          <div class="exercise-actions">
            <button
              type="button"
              class="btn-primary"
              data-action="bd-to-step2"
              ${parsedCount === 0 ? 'disabled aria-disabled="true"' : ''}
            >
              ${t.sortBtn}
            </button>
          </div>
        </div>
      `;
      const textarea = container.querySelector('[data-bd-input]');
      if (textarea) textarea.value = rawInput;
      return;
    }

    if (step === 2) {
      const allSorted = items.length > 0 && items.every((item) => item.bucket !== null);
      container.innerHTML = `
        <div class="exercise-card-surface">
          <div class="exercise-header-inline">
            <h1 class="view-title" tabindex="-1" data-bd-heading>${t.step2Heading}</h1>
            <button type="button" class="btn-quiet" data-action="bd-clear">${t.clearBtn}</button>
          </div>
          <p class="view-subtitle">${t.step2Sub}</p>

          <div class="brain-dump-card-list" role="list">
            ${items
              .map(
                (item) => `
              <div class="thought-card" role="listitem">
                <p class="thought-card-text" dir="auto">${escapeHtml(item.text)}</p>
                <div class="thought-card-actions" role="group" aria-label="Sort thought">
                  <button
                    type="button"
                    class="chip-btn ${item.bucket === 'influence' ? 'is-selected' : ''}"
                    aria-pressed="${item.bucket === 'influence'}"
                    data-sort-id="${item.id}"
                    data-bucket="influence"
                  >
                    ${t.influenceBtn}
                  </button>
                  <button
                    type="button"
                    class="chip-btn ${item.bucket === 'not_in_control' ? 'is-selected' : ''}"
                    aria-pressed="${item.bucket === 'not_in_control'}"
                    data-sort-id="${item.id}"
                    data-bucket="not_in_control"
                  >
                    ${t.notInControlBtn}
                  </button>
                </div>
              </div>
            `
              )
              .join('')}
          </div>

          <div class="exercise-actions">
            <button
              type="button"
              class="btn-primary"
              data-action="bd-to-step3"
              ${!allSorted ? 'disabled aria-disabled="true"' : ''}
            >
              ${t.continueToPickBtn}
            </button>
          </div>
        </div>
      `;
      return;
    }

    if (step === 3) {
      const influenceItems = items.filter((i) => i.bucket === 'influence');
      container.innerHTML = `
        <div class="exercise-card-surface">
          <div class="exercise-header-inline">
            <h1 class="view-title" tabindex="-1" data-bd-heading>${t.step3Heading}</h1>
            <button type="button" class="btn-quiet" data-action="bd-clear">${t.clearBtn}</button>
          </div>
          <p class="view-subtitle">${t.step3Sub}</p>

          ${
            influenceItems.length > 0
              ? `
            <div class="pick-one-list" role="group" aria-label="${t.step3Heading}">
              ${influenceItems
                .map(
                  (item) => `
                <button
                  type="button"
                  class="pick-one-card"
                  data-pick-text="${escapeHtml(item.text)}"
                  dir="auto"
                >
                  ${escapeHtml(item.text)}
                </button>
              `
                )
                .join('')}
            </div>
          `
              : `
            <p class="gentle-note">${t.noInfluenceItemsMsg}</p>
            <div class="pick-one-list">
              <button
                type="button"
                class="pick-one-card"
                data-pick-text="${escapeHtml(t.restStepOption)}"
              >
                ${escapeHtml(t.restStepOption)}
              </button>
            </div>
          `
          }
        </div>
      `;
      return;
    }

    if (step === 4) {
      container.innerHTML = `
        <div class="exercise-card-surface">
          <div class="exercise-header-inline">
            <h1 class="view-title" tabindex="-1" data-bd-heading>${t.closingHeading}</h1>
            <button type="button" class="btn-quiet" data-action="bd-clear">${t.clearBtn}</button>
          </div>
          <p class="view-subtitle">${t.closingPrefix}</p>
          <div class="chosen-tiny-thing" dir="auto">
            ${escapeHtml(chosenItemText)}
          </div>
          <p class="gentle-note">${t.closingLetGo}</p>
          <div class="exercise-actions">
            <button type="button" class="btn-primary" data-action="bd-done">
              ${EN.exercises.doneBtn}
            </button>
          </div>
        </div>
      `;
    }
  }

  function handleInput(e) {
    if (e.target.matches('[data-bd-input]')) {
      rawInput = e.target.value;
      const toStep2Btn = container.querySelector('[data-action="bd-to-step2"]');
      if (toStep2Btn) {
        const hasLines = parseBrainDumpLines(rawInput).length > 0;
        toStep2Btn.disabled = !hasLines;
        if (hasLines) {
          toStep2Btn.removeAttribute('aria-disabled');
        } else {
          toStep2Btn.setAttribute('aria-disabled', 'true');
        }
      }
    }
  }

  function handleClick(e) {
    const sortBtn = e.target.closest('[data-sort-id]');
    if (sortBtn) {
      const id = sortBtn.getAttribute('data-sort-id');
      const bucket = sortBtn.getAttribute('data-bucket');
      items = items.map((item) => (item.id === id ? { ...item, bucket } : item));
      render();
      return;
    }

    const pickBtn = e.target.closest('[data-pick-text]');
    if (pickBtn) {
      chosenItemText = pickBtn.getAttribute('data-pick-text') || '';
      step = 4;
      render();
      const heading = container.querySelector('[data-bd-heading]');
      if (heading) heading.focus();
      return;
    }

    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;
    const action = actionEl.getAttribute('data-action');

    if (action === 'bd-clear') {
      wipeAll();
      render();
      const input = container.querySelector('[data-bd-input]');
      if (input) input.focus();
    } else if (action === 'bd-to-step2') {
      items = parseBrainDumpLines(rawInput);
      if (items.length > 0) {
        step = 2;
        render();
        const heading = container.querySelector('[data-bd-heading]');
        if (heading) heading.focus();
      }
    } else if (action === 'bd-to-step3') {
      step = 3;
      render();
      const heading = container.querySelector('[data-bd-heading]');
      if (heading) heading.focus();
    } else if (action === 'bd-done') {
      wipeAll();
      onExitToChat();
    }
  }

  container.addEventListener('input', handleInput);
  container.addEventListener('click', handleClick);

  return {
    mount() {
      wipeAll();
      render();
    },
    destroy() {
      wipeAll();
      container.removeEventListener('input', handleInput);
      container.removeEventListener('click', handleClick);
    },
  };
}
