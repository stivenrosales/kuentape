"use client";

import { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn("text-sm font-medium", className)}>{title}</div>;
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "-ml-2 h-8 gap-1 font-medium text-muted-foreground hover:text-foreground data-[sorted]:text-foreground",
        className
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-label={
        sorted === "asc"
          ? "Ordenado ascendente. Clic para ordenar descendente"
          : sorted === "desc"
            ? "Ordenado descendente. Clic para quitar orden"
            : "Sin orden. Clic para ordenar ascendente"
      }
    >
      <span>{title}</span>
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}
