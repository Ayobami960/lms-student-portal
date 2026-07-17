import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="label">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={clsx("input", error && "border-red-400 focus:border-red-500 focus:ring-red-500", className)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && <p id={`${id}-error`} className="mt-1 text-sm text-destructive" role="alert">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
