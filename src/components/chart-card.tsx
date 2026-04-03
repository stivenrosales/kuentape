import * as React from "react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function ChartCard({
  title,
  description,
  children,
  actions,
  className,
  loading = false,
}: ChartCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[1.25rem] bg-card p-5",
        "shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)]",
        "ring-1 ring-foreground/10",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold leading-snug">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="shrink-0" aria-label="Opciones del gráfico">
            {actions}
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="min-h-0 w-full">
        {loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando gráfico">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
