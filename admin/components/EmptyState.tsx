import { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: LucideIcon; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <Icon size={36} className="mb-3 text-gray-300 dark:text-gray-700" />
      <h3 className="font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
