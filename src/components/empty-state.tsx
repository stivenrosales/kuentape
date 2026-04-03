import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  message = "No hay datos para mostrar",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-[1.25rem] bg-muted/30 px-6 py-12 text-center",
        className
      )}
      role="status"
      aria-label={title ?? message}
    >
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {title && (
          <p className="text-sm font-medium text-foreground">{title}</p>
        )}
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          aria-label={action.label}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
