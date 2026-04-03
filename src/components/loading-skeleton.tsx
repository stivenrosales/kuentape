import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  /** Muestra encabezado de tabla falso */
  showHeader?: boolean;
}

export function LoadingSkeleton({
  rows = 5,
  columns = 4,
  className,
  showHeader = true,
}: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[1.25rem] bg-card p-4",
        "shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)]",
        "ring-1 ring-foreground/10",
        className
      )}
      role="status"
      aria-busy="true"
      aria-label="Cargando datos..."
    >
      {/* Toolbar skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        {/* Header */}
        {showHeader && (
          <div className="flex gap-4 bg-muted/40 px-3 py-2.5">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-4 rounded"
                style={{ width: `${100 / columns}%` }}
              />
            ))}
          </div>
        )}

        {/* Rows */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className={cn(
                "flex gap-4 px-3 py-3",
                rowIndex % 2 === 1 && "bg-muted/20"
              )}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className="h-4 rounded"
                  style={{
                    width: `${(100 / columns) * (colIndex === 0 ? 1.4 : 0.8)}%`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-7 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
