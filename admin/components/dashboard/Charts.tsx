import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetDashboardAnalyticsQuery } from "../../store/api/apiSlice";

interface CategoryDatum {
  name: string;
  value: number;
  color: string;
}

interface SalesDatum {
  time: string;
  sales: number;
}

interface DashboardAnalyticsResponse {
  salesData: SalesDatum[];
  categoryData: CategoryDatum[];
  totalIncome: number;
}


export default function Charts() {
 const { data, isLoading } = useGetDashboardAnalyticsQuery(undefined, {
  pollingInterval: 60000,
}) as { data?: { data: DashboardAnalyticsResponse }; isLoading: boolean };


  const chartData = data?.data;

  if (isLoading || !chartData) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-100">
        <Skeleton className="xl:col-span-2 rounded-lg h-full w-full" />
        <Skeleton className="rounded-lg h-full w-full" />
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto xl:h-100">
      <div className="xl:col-span-2 bg-white dark:bg-card rounded-lg p-6 shadow-sm border border-border flex flex-col h-100 xl:h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground tracking-tight">
            Past 7days Sales
          </h2>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData.salesData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10 dark:opacity-20" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground" dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-muted-foreground" tickFormatter={(val) => `$${val}`} />
              <Tooltip
                formatter={(value) => [typeof value === "number" ? formatCurrency(value as number) : "", "Sales"]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                cursor={{ stroke: "#f97316", strokeWidth: 1, strokeDasharray: "3 3" }}
              />
              <Area type="monotone" dataKey="sales" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-lg p-6 shadow-sm border border-border flex flex-col h-100 xl:h-full">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Total Income</h2>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.categoryData} innerRadius="70%" outerRadius="90%" paddingAngle={5} dataKey="value" stroke="none">
                {chartData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), "Income"]}
                contentStyle={{ borderRadius: "8px", border: "none", backgroundColor: "var(--card)", color: "var(--foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-foreground tracking-tight">
              {formatCurrency(chartData.totalIncome)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {chartData.categoryData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
              {item.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}