import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, disabled, className, children, ...props }, ref) => {
    const base = "inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
      primary: "bg-primary text-on-primary hover:opacity-90 focus-visible:ring-primary",
      secondary: "border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:text-primary focus-visible:ring-primary",
      danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      ghost: "text-on-surface hover:bg-surface-container focus-visible:ring-primary",
    };
    return (
      <button ref={ref} disabled={disabled || loading} className={clsx(base, variants[variant], className)} {...props}>
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";