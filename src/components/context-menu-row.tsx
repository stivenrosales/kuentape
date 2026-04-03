"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

interface ContextMenuRowProps {
  children: React.ReactNode;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
  confirmMessage?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Wrapper for table rows that adds right-click context menu with "Eliminar".
 * Shows confirmation before deleting.
 * Can wrap <tr> or <div> rows.
 */
export function ContextMenuRow({
  children,
  onDelete,
  deleteLabel = "Eliminar",
  confirmMessage = "¿Seguro que querés eliminar este registro?",
  className = "",
  onClick,
}: ContextMenuRowProps) {
  const [menuPos, setMenuPos] = React.useState<{ x: number; y: number } | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu on click outside or escape
  React.useEffect(() => {
    if (!menuPos) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
        setConfirming(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuPos(null);
        setConfirming(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [menuPos]);

  function handleContextMenu(e: React.MouseEvent) {
    if (!onDelete) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setConfirming(false);
  }

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete!();
      toast.success("Registro eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
    setDeleting(false);
    setMenuPos(null);
    setConfirming(false);
  }

  return (
    <>
      <tr
        className={className}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {children}
      </tr>

      {/* Context menu — portaled to body to avoid HTML nesting issues */}
      {menuPos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-lg border border-border bg-popover shadow-lg py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          {!confirming ? (
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              {deleteLabel}
            </button>
          ) : (
            <div className="px-3 py-2 space-y-2">
              <p className="text-xs text-muted-foreground">{confirmMessage}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                >
                  {deleting ? "..." : `Sí, ${deleteLabel.toLowerCase()}`}
                </button>
                <button
                  onClick={() => { setMenuPos(null); setConfirming(false); }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
