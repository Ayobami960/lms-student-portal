import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface AssignmentPerformanceChartProps {
  data: { name: string; score: number }[];
}

export function AssignmentPerformanceChart({ data }: AssignmentPerformanceChartProps) {
  if (data.length === 0) return null;

  return (
    <section className="bg-surface-container-lowest border border-outline-variant shadow-sm p-md rounded-xl">
      <h3 className="text-xl font-semibold mb-md">Assignment Performance</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} aria-label="Assignment performance chart">
          <CartesianGrid strokeDasharray="3 3" className="stroke-outline-variant" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value ?? 0}%`, "Score"]} />
          <Bar dataKey="score" fill="var(--color-primary, #4f46e5)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}