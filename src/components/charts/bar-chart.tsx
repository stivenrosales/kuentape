"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: { key: string; color?: string; label: string }[];
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl bg-muted/30">
      <p className="text-sm text-muted-foreground">Sin datos para mostrar</p>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatValue?: (value: number) => string;
  bars: { key: string; label: string }[];
}

function CustomTooltip({ active, payload, label, formatValue, bars }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] text-sm">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((entry) => {
        const barDef = bars.find((b) => b.key === entry.name);
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {barDef?.label ?? entry.name}:
            </span>
            <span className="font-medium text-foreground">
              {formatValue ? formatValue(entry.value) : entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BarChart({
  data,
  xKey,
  bars,
  height = 300,
  formatValue,
  className,
}: BarChartProps) {
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatValue}
            width={60}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} bars={bars} />}
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          />
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.key}
              fill={bar.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
