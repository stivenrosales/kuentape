"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  /** Valor en centavos (entero) */
  valueCentavos: number | null;
  onChange: (centavos: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Input para moneda. Recibe/emite el valor en CENTAVOS (entero).
 * El usuario escribe soles con decimales (ej: "123.50") y el
 * componente convierte a centavos (12350) en el callback.
 */
export function CurrencyInput({
  valueCentavos,
  onChange,
  placeholder = "0.00",
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
}: CurrencyInputProps) {
  // Estado local para la cadena que ve el usuario mientras escribe
  const [display, setDisplay] = React.useState<string>(() =>
    valueCentavos !== null && valueCentavos !== undefined
      ? (valueCentavos / 100).toFixed(2)
      : ""
  );
  const [focused, setFocused] = React.useState(false);

  // Sincronizar cuando cambia el valor externo (solo si no estamos en foco)
  React.useEffect(() => {
    if (!focused) {
      setDisplay(
        valueCentavos !== null && valueCentavos !== undefined
          ? (valueCentavos / 100).toFixed(2)
          : ""
      );
    }
  }, [valueCentavos, focused]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Solo dígitos, punto y un signo negativo al inicio
    if (/^-?\d*\.?\d{0,2}$/.test(raw) || raw === "" || raw === "-") {
      setDisplay(raw);
      const parsed = parseFloat(raw);
      if (raw === "" || raw === "-") {
        onChange(null);
      } else if (!isNaN(parsed)) {
        onChange(Math.round(parsed * 100));
      }
    }
  }

  function handleBlur() {
    setFocused(false);
    // Formatear al salir del input
    const parsed = parseFloat(display);
    if (!isNaN(parsed)) {
      const formatted = parsed.toFixed(2);
      setDisplay(formatted);
      onChange(Math.round(parsed * 100));
    } else {
      setDisplay("");
      onChange(null);
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      <span
        className={cn(
          "flex h-8 items-center rounded-l-lg border border-r-0 border-input bg-muted/50 px-2.5 font-mono text-sm text-muted-foreground select-none",
          disabled && "opacity-50"
        )}
        aria-hidden="true"
      >
        S/.
      </span>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel ?? "Monto en soles"}
        aria-describedby={ariaDescribedby}
        className={cn(
          "rounded-l-none font-mono",
          "focus-visible:z-10"
        )}
      />
    </div>
  );
}
