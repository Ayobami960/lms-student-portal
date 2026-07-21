"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: "primary" | "danger";
  label?: string;
  className?: string;
};

/**
 * A physical-feeling rocker switch with an LED glow, used for high-consequence
 * platform-wide toggles (maintenance mode, kill switches, etc). Deliberately
 * heavier and more tactile than a standard shadcn Switch — the weight of the
 * control should match the weight of the action.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  tone = "primary",
  label,
  className,
}: SwitchProps) {
  const onColor = tone === "danger" ? "var(--destructive)" : "var(--primary)";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        backgroundColor: checked ? onColor : "var(--muted)",
        borderColor: checked ? onColor : "var(--border)",
        boxShadow: checked ? `0 0 0 4px ${onColor}1f` : "none",
      }}
    >
      <span
        className="absolute left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ease-out"
        style={{ transform: checked ? "translateX(24px)" : "translateX(0px)" }}
      />
    </button>
  );
}