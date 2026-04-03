"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  /** Elemento que abre el diálogo */
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  /** Control externo del estado abierto/cerrado */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  open,
  onOpenChange,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onOpenChange?.(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}

      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={loading} />}
          >
            {cancelLabel}
          </DialogClose>

          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
