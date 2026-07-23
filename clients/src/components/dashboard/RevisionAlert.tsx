import { Link } from "react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface RevisionAlertProps {
  count: number;
}

/**
 * Warns a student that one or more assignments must be revised before a
 * certificate can be claimed. Rendered only when `count > 0`.
 */
export function RevisionAlert({ count }: RevisionAlertProps) {
  if (count <= 0) return null;

  return (
    <Link
      to="/assignments"
      role="alert"
      className="flex items-center justify-between gap-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
    >
      <span className="flex items-center gap-2 font-medium">
        <AlertTriangle size={16} aria-hidden="true" />
        {count} assignment{count > 1 ? "s" : ""} need revision before you can claim a certificate
      </span>
      <span className="flex items-center gap-1 shrink-0">
        Fix now <ArrowRight size={14} aria-hidden="true" />
      </span>
    </Link>
  );
}