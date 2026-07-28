import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

export function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="card flex items-center justify-between p-5">
      <div>
        <p className="text-sm text-on-surface-variant">{label}</p>
        <p className="mt-1 text-2xl font-bold text-on-surface">{value}</p>
      </div>
      <div className="stat-icon-badge">
        <Icon size={18} />
      </div>
    </div>
  );
}