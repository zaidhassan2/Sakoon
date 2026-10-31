/**
 * Accessible Sheet / Dialog controller.
 * - Traps focus (Tab / Shift+Tab) inside the open dialog.
 * - Closes on Escape key and backdrop click.
 * - Restores focus to the triggering element on close.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

let activeModal = null;
let previousTrigger = null;

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
  );
}

function handleKeyDown(event) {
  if (!activeModal) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeModal();
    return;
  }

  if (event.key === 'Tab') {
    const focusables = getFocusableElements(activeModal);
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first || !activeModal.contains(document.activeElement)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || !activeModal.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    }
  }
}

export function openModal(modalElement, triggerElement = document.activeElement) {
  if (!modalElement) return;

  if (activeModal && activeModal !== modalElement) {
    activeModal.hidden = true;
    activeModal.setAttribute('aria-hidden', 'true');
  }

  previousTrigger = triggerElement instanceof HTMLElement ? triggerElement : document.activeElement;
  activeModal = modalElement;

  modalElement.hidden = false;
  modalElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const appRoot = document.getElementById('app-shell');
  if (appRoot) {
    appRoot.setAttribute('aria-hidden', 'true');
  }

  document.addEventListener('keydown', handleKeyDown);

  // Move focus to the first interactive element or dialog surface
  requestAnimationFrame(() => {
    if (!activeModal) return;
    const initialFocus =
      activeModal.querySelector('[data-autofocus]') || getFocusableElements(activeModal)[0] || activeModal;
    if (initialFocus && typeof initialFocus.focus === 'function') {
      initialFocus.focus();
    }
  });
}

export function closeModal() {
  if (!activeModal) return;

  const closing = activeModal;
  activeModal = null;

  closing.hidden = true;
  closing.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  const appRoot = document.getElementById('app-shell');
  if (appRoot) {
    appRoot.removeAttribute('aria-hidden');
  }

  document.removeEventListener('keydown', handleKeyDown);

  if (previousTrigger && typeof previousTrigger.focus === 'function' && document.contains(previousTrigger)) {
    previousTrigger.focus();
  }
  previousTrigger = null;
}

export function getActiveModal() {
  return activeModal;
}
