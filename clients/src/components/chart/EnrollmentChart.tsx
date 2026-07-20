import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { EnrollmentChartProps } from "../../types";


// Custom tooltip so it picks up your design tokens instead of recharts' defaults
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-on-surface mb-0.5">{label}</p>
      <p className="text-primary font-semibold">{payload[0].value} students</p>
    </div>
  );
}

export function EnrollmentChart({ courses }: EnrollmentChartProps) {
  if (!courses?.length) {
    return (
      <div className="text-center py-lg">
        <p className="text-sm text-outline">No enrollment data yet — students will show up here once they enroll.</p>
      </div>
    );
  }

  // Truncate long titles for axis labels; full title still shows in the tooltip
  const data = courses.map((c) => ({
    ...c,
    shortTitle: c.title.length > 18 ? `${c.title.slice(0, 18)}…` : c.title,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-outline-variant" />
        <XAxis
          dataKey="shortTitle"
          tick={{ fontSize: 12 }}
          className="text-outline"
          interval={0}
          angle={-20}
          textAnchor="end"
          height={60}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-outline" />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-container)" }} />
        <Bar dataKey="students" radius={[6, 6, 0, 0]} className="fill-primary" barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default EnrollmentChart;