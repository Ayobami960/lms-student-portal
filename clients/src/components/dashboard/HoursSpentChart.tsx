import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export interface MonthlyHours {
  month: string;
  hours: number;
}

interface HoursSpentChartProps {
  data: MonthlyHours[];
}


const COLORS = ["var(--color-tertiary)", "var(--color-secondary)"];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-on-surface">{label}</p>
      <p className="text-on-surface-variant">{payload[0].value} Hr</p>
    </div>
  );
}

export function HoursSpentChart({ data }: HoursSpentChartProps) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-on-surface">Hours Spent</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="32%">
            <YAxis
              axisLine={false}
              tickLine={false}
              width={34}
              tick={{ fill: "var(--color-on-surface-variant)", fontSize: 11 }}
              tickFormatter={(v) => `${v}Hr`}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
            />
            <Tooltip cursor={{ fill: "var(--color-surface-container)" }} content={<CustomTooltip />} />
            <Bar dataKey="hours" radius={[8, 8, 8, 8]} maxBarSize={44}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % 2]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}