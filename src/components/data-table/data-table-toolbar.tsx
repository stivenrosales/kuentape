"use client";

import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchKey?: string;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchKey,
  searchPlaceholder = "Buscar...",
  filterComponent,
  className,
}: DataTableToolbarProps<TData>) {
  const searchColumn = searchKey ? table.getColumn(searchKey) : undefined;
  const searchValue = (searchColumn?.getFilterValue() as string) ?? "";
  const isFiltered = table.getState().columnFilters.length > 0 || searchValue !== "";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {searchColumn && (
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => searchColumn.setFilterValue(e.target.value)}
            className="pl-8 h-8"
            aria-label={searchPlaceholder}
          />
          {searchValue && (
            <button
              onClick={() => searchColumn.setFilterValue("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {filterComponent}

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters();
            searchColumn?.setFilterValue("");
          }}
          className="h-8 gap-1.5 text-muted-foreground"
          aria-label="Limpiar todos los filtros"
        >
          <X className="size-3.5" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
