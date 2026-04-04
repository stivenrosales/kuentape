"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  className?: string
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    },
    []
  )

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, handleClickOutside, handleKeyDown])

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectAll = () => {
    onChange(options.map((o) => o.value))
  }

  const clearAll = () => {
    onChange([])
  }

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : `${placeholder} (${selected.length})`

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-border bg-card px-3 text-xs",
          "transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          open && "ring-2 ring-ring/50"
        )}
      >
        <span className="truncate text-foreground">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            triggerLabel
          )}
        </span>
        <ChevronDown
          className={cn(
            "ml-2 size-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-sm",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {/* Actions */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-primary hover:underline"
            >
              Seleccionar todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Limpiar
            </button>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto py-1">
            {options.map((option) => {
              const isSelected = selected.includes(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors",
                    "hover:bg-muted/50",
                    isSelected && "text-foreground",
                    !isSelected && "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-transparent"
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3" />}
                  </span>
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export { MultiSelect }
export type { MultiSelectOption, MultiSelectProps }
