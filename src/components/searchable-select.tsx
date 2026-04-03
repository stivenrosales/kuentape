"use client";

import * as React from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on click outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(val: string) {
    onChange(val);
    setSearch("");
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setSearch("");
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex w-full items-center justify-between h-8 rounded-md border border-input bg-background px-3 text-sm hover:bg-muted/30 transition-colors text-left"
      >
        <span className={selected ? "truncate" : "text-muted-foreground truncate"}>
          {selected?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span onClick={handleClear} className="text-muted-foreground/50 hover:text-foreground cursor-pointer">
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Buscar..."
            />
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground text-center">Sin resultados</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSelect(o.value)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                    o.value === value && "bg-accent/50 font-medium"
                  )}
                >
                  {o.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
