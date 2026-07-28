import type { LucideIcon } from "lucide-react";
import { StatCard } from "../StatsCard";

// The real dashboard-analytics endpoint returns different fields for
// students vs. instructors (and has no "lessons" field), so instead of a
// fixed DashboardStats shape, StatsRow takes a pre-built list of items.
// The page decides which 4 stats to show based on the user's role.
export interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

interface StatsRowProps {
  items: StatItem[];
}

export function StatsRow({ items }: StatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} />
      ))}
    </div>
  );
}