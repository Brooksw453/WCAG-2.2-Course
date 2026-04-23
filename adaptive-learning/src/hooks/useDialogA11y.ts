'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';

/**
 * Dialog accessibility hook — Escape to close, Tab focus trap, focus return.
 *
 * Pattern mirrors AskQuestionPanel (our reference implementation). Apply to
 * any modal/slide-over to satisfy WCAG 2.2 AA:
 *   - 4.1.2 Name/Role/Value — caller still must set role="dialog" aria-modal="true" + aria-label
 *   - 2.1.2 No Keyboard Trap — Escape closes; Tab cycles within panel only
 *   - 2.4.3 Focus Order — focus returns to the trigger after close
 */
export function useDialogA11y(
  isOpen: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
) {
  const triggerRef = useRef<HTMLElement | null>(null);

  // Remember what had focus before the dialog opened so we can restore it.
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    // On close, return focus to the originating element if still in the DOM.
    const el = triggerRef.current;
    if (el && document.body.contains(el)) {
      el.focus();
    }
    triggerRef.current = null;
  }, [isOpen]);

  // Escape closes.
  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Tab cycles within the panel.
  const handleFocusTrap = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [panelRef],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleFocusTrap);
    return () => document.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen, handleFocusTrap]);
}
