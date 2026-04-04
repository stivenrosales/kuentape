"use client";

import {
  Bar,
  Line,
  ComposedChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import { cn } from "@/lib/utils";

interface IncomeExpenseChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
}

const COLORS = {
  ingreso: "#10b981",
  egreso: "#ef4444",
  utilidad: "var(--chart-1)",
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatValue?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatValue }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const labels: Record<string, string> = {
    ingreso: "Ingreso",
    egreso: "Egreso",
    utilidad: "Utilidad",
  };

  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 shadow-md text-xs">
      <p className="mb-1 font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className={cn("size-2 shrink-0", entry.name === "utilidad" ? "rounded-full" : "rounded-sm")}
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {labels[entry.name] ?? entry.name}:
          </span>
          <span className="font-mono font-medium text-foreground">
            {formatValue ? formatValue(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-4 pt-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2.5 rounded-sm border" style={{ backgroundColor: `${COLORS.ingreso}33`, borderColor: COLORS.ingreso }} />
        Ingreso
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2.5 rounded-sm" style={{ backgroundColor: `${COLORS.egreso}bf` }} />
        Egreso
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ backgroundColor: COLORS.utilidad }} />
        Utilidad
      </div>
    </div>
  );
}

export function IncomeExpenseChart({
  data,
  xKey,
  height = 300,
  formatValue,
  className,
}: IncomeExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] items-center justify-center rounded-xl bg-muted/30">
        <p className="text-sm text-muted-foreground">Sin datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
          barGap={-14}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatValue}
            width={60}
          />
          <Tooltip
            content={<CustomTooltip formatValue={formatValue} />}
            cursor={{ fill: "var(--muted)", opacity: 0.3 }}
          />
          <Legend content={<CustomLegend />} />

          <Bar
            dataKey="ingreso"
            name="ingreso"
            fill={COLORS.ingreso}
            fillOpacity={0.8}
            radius={[6, 6, 0, 0]}
            barSize={14}
          />
          <Bar
            dataKey="egreso"
            name="egreso"
            fill={COLORS.egreso}
            fillOpacity={0.8}
            radius={[6, 6, 0, 0]}
            barSize={14}
          />

          {/* Línea de utilidad: la consecuencia */}
          <Line
            dataKey="utilidad"
            name="utilidad"
            type="monotone"
            stroke={COLORS.utilidad}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 0, fill: COLORS.utilidad }}
            activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.utilidad }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
