"use client";

import {
  Area,
  AreaChart as RechartsAreaChart,
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

interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  areas: { key: string; color?: string; label: string }[];
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
  areas: { key: string; label: string }[];
}

function CustomTooltip({ active, payload, label, formatValue, areas }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] text-sm">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {payload.map((entry) => {
        const areaDef = areas.find((a) => a.key === entry.name);
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {areaDef?.label ?? entry.name}:
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

export function AreaChart({
  data,
  xKey,
  areas,
  height = 300,
  formatValue,
  className,
}: AreaChartProps) {
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
        >
          <defs>
            {areas.map((area, index) => {
              const color = area.color ?? CHART_COLORS[index % CHART_COLORS.length];
              return (
                <linearGradient
                  key={area.key}
                  id={`gradient-${area.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              );
            })}
          </defs>
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
            content={<CustomTooltip formatValue={formatValue} areas={areas} />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          {areas.map((area, index) => {
            const color = area.color ?? CHART_COLORS[index % CHART_COLORS.length];
            return (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                name={area.key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${area.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
