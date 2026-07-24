import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Constrains the dialog width. Defaults to "md". */
  size?: "sm" | "md" | "lg" | "xl";
}



const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Unique per-instance ids, so nested/duplicate modals never collide on aria-labelledby/aria-describedby.
  const titleId = useId();
  const descriptionId = useId();

  // Close on Escape, trap Tab focus, lock body scroll, restore focus on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    // Move focus into the dialog so keyboard/screen-reader users land
    // somewhere sensible as soon as it opens.
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      // Return focus to whatever triggered the modal.
      previouslyFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        // Only close when the mousedown originated on the backdrop itself,
        // not when a drag/selection that started inside the dialog ends
        // outside it.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" aria-hidden="true" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-xl animate-fade-in focus:outline-none`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-on-surface">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-outline">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;