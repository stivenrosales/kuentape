"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DATE_FORMAT = "dd/MM/yyyy";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue =
    value && isValid(value) ? format(value, DATE_FORMAT, { locale: es }) : null;

  function handleSelect(day: Date | undefined) {
    onChange(day ?? null);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-8 items-center justify-start gap-2 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-normal whitespace-nowrap transition-colors outline-none",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          !displayValue && "text-muted-foreground",
          className
        )}
      >
        <CalendarIcon className="size-3.5 shrink-0" />
        <span className="font-mono">
          {displayValue ?? placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleSelect}
          locale={es}
          captionLayout="dropdown"
          autoFocus
          aria-label="Calendario de selección de fecha"
        />
      </PopoverContent>
    </Popover>
  );
}
