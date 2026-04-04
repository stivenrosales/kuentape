"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

interface HorizontalBarChartProps {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
  formatValue?: (value: number) => string;
  color?: string;
  height?: number;
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] text-sm">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {formatValue ? formatValue(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
}

export function HorizontalBarChart({
  data,
  nameKey,
  valueKey,
  formatValue,
  color = "var(--chart-1)",
  height = 300,
  className,
}: HorizontalBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-xl bg-muted/30">
        <p className="text-sm text-muted-foreground">Sin datos</p>
      </div>
    );
  }

  const sorted = [...data].sort(
    (a, b) => (b[valueKey] as number) - (a[valueKey] as number)
  );

  // Compute dynamic height based on rows if not overridden
  const computedHeight = Math.max(height, sorted.length * 44 + 24);

  return (
    <div className={cn("w-full", className)} style={{ height: computedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 4, right: 70, left: 4, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={100}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          />
          <Bar dataKey={valueKey} fill={color} radius={[0, 6, 6, 0]} maxBarSize={32}>
            <LabelList
              dataKey={valueKey}
              position="right"
              formatter={(v: unknown) => (formatValue ? formatValue(v as number) : String(v))}
              style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
