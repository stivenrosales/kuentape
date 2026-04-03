"use client";

import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  formatValue?: (value: number) => string;
  innerRadius?: number;
  outerRadius?: number;
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
  payload?: Array<{ name: string; value: number; payload: { color?: string } }>;
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, formatValue }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];

  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] text-sm">
      <div className="flex items-center gap-2">
        <span className="font-medium text-foreground">{entry.name}:</span>
        <span className="text-muted-foreground">
          {formatValue ? formatValue(entry.value) : entry.value}
        </span>
      </div>
    </div>
  );
}

export function DonutChart({
  data,
  height = 300,
  formatValue,
  innerRadius = 60,
  outerRadius = 100,
  className,
}: DonutChartProps) {
  if (!data || data.length === 0) return <EmptyState />;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        </RechartsPieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  entry.color ?? CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
