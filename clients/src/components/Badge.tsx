const VARIANTS: Record<string, string> = {
  default: "bg-none text-foreground",
  // success: "bg-none text-green-700 dark:bg-green-900/40 dark:text-green-400",
  // warning: "bg-none text-orange-700 dark:bg-amber-900/40 dark:text-amber-400",
  // danger: "bg-none text-red-700 dark:bg-red-900/40 dark:text-red-400",
  info: "bg-none text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
};

export function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: keyof typeof VARIANTS }) {
  return <span className={`inline-block rounded-full px-2.5 uppercase border-2 py-0.5 text-xs font-medium ${VARIANTS[variant]}`}>{children}</span>;
}