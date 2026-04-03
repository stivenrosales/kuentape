"use client";

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
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

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: { key: string; color?: string; label: string }[];
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
  lines: { key: string; label: string }[];
}

function CustomTooltip({ active, payload, label, formatValue, lines }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] text-sm">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((entry) => {
        const lineDef = lines.find((l) => l.key === entry.name);
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {lineDef?.label ?? entry.name}:
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

export function LineChart({
  data,
  xKey,
  lines,
  height = 300,
  formatValue,
  className,
}: LineChartProps) {
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
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
            content={<CustomTooltip formatValue={formatValue} lines={lines} />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.key}
              stroke={line.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
