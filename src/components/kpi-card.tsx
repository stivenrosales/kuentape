"use client";

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  trend?: { value: number; isPositive: boolean };
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ label, value, trend, icon, className }: KPICardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-card px-4 py-3 shadow-sm border border-border",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className="text-muted-foreground/50 [&>svg]:h-3 [&>svg]:w-3">
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-2 mt-0.5">
        <span className="text-lg font-bold leading-none">
          {value}
        </span>

        {trend && (
          <div
            className={cn(
              "mb-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.isPositive
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            )}
            aria-label={`${trend.isPositive ? "Incremento" : "Reducción"} de ${Math.abs(trend.value).toFixed(1)}%`}
          >
            {trend.isPositive ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
