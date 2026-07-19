import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-on-surface-variant"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={[
              "w-full rounded-lg border bg-surface-container px-3 py-2.5 text-sm text-on-surface",
              "placeholder:text-outline-variant transition-colors duration-150",
              "focus:outline-none focus:ring-1",
              icon ? "pl-9" : "",
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-outline-variant focus:border-primary focus:ring-primary",
              "disabled:cursor-not-allowed disabled:opacity-60",
              className,
            ].join(" ")}
            {...props}
          />
        </div>

        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-red-500">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-outline">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";