import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible dialog primitive. Adds the WCAG-required behaviours that
 * ad-hoc modals were missing: role="dialog" + aria-modal, focus moves
 * inside on open, Escape dismisses, Tab stays inside (focus trap),
 * focus restores to the previously-focused element on close.
 *
 * Intentionally minimal: callers still control header / body / footer
 * markup. Use as `<Modal open onClose={...} labelledBy="my-id">…</Modal>`.
 */
export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  size = 'md',
  showCloseButton = true,
  children,
}) {
  const dialogRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement;

    // Focus the first interactive element in the dialog after render.
    requestAnimationFrame(() => {
      const root = dialogRef.current;
      if (!root) return;
      const focusable = root.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (focusable || root).focus();
    });

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(root.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      // Restore focus to the element that opened the modal
      if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
        previousFocus.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`bg-white rounded-2xl shadow-xl w-full ${sizes[size] || sizes.md} max-h-[90vh] overflow-y-auto outline-none`}
      >
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 p-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003366]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
