"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  filterComponent?: React.ReactNode;
  pagination?: boolean;
  pageSizeOptions?: number[];
  className?: string;
  emptyMessage?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Buscar...",
  filterComponent,
  pagination = true,
  pageSizeOptions = [10, 25, 50],
  className,
  emptyMessage = "No hay resultados.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [paginationState, setPaginationState] = React.useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: pageSizeOptions[0] ?? 10,
    }
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPaginationState,
    state: {
      sorting,
      columnFilters,
      pagination: paginationState,
    },
  });

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[1.25rem] bg-card p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12),0_2px_8px_-2px_rgba(0,0,0,0.08)] ring-1 ring-foreground/10",
        className
      )}
    >
      {(searchKey || filterComponent) && (
        <DataTableToolbar
          table={table}
          searchKey={searchKey}
          searchPlaceholder={searchPlaceholder}
          filterComponent={filterComponent}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/40 hover:bg-muted/40"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-10 px-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "h-12",
                    index % 2 === 0
                      ? "bg-background"
                      : "bg-muted/20 hover:bg-muted/40"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <DataTablePagination
          table={table}
          pageSizeOptions={pageSizeOptions}
        />
      )}
    </div>
  );
}
