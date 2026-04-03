"use client";

import * as React from "react";
import { FileIcon, ImageIcon, UploadCloudIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

interface FilePreview {
  file: File;
  objectUrl?: string;
}

interface FileUploadProps {
  /** MIME types aceptados, ej: "image/*,application/pdf" */
  accept?: string;
  /** Tamaño máximo en bytes (default: 5MB) */
  maxSize?: number;
  /** Callback con el File seleccionado (validado) */
  onUpload: (file: File) => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(type: string): boolean {
  return type.startsWith("image/");
}

function mimeMatchesAccept(type: string, accept: string): boolean {
  return accept
    .split(",")
    .map((s) => s.trim())
    .some((pattern) => {
      if (pattern.endsWith("/*")) {
        return type.startsWith(pattern.slice(0, -1));
      }
      return type === pattern;
    });
}

export function FileUpload({
  accept,
  maxSize = DEFAULT_MAX_SIZE,
  onUpload,
  className,
  disabled = false,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [preview, setPreview] = React.useState<FilePreview | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Liberar object URLs al desmontar
  React.useEffect(() => {
    return () => {
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    };
  }, [preview]);

  function validate(file: File): string | null {
    if (file.size > maxSize) {
      return `El archivo es demasiado grande. Máximo permitido: ${formatBytes(maxSize)}.`;
    }
    if (accept && !mimeMatchesAccept(file.type, accept)) {
      return "Tipo de archivo no permitido.";
    }
    return null;
  }

  async function processFile(file: File) {
    setError(null);

    const validationError = validate(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = isImageMime(file.type)
      ? URL.createObjectURL(file)
      : undefined;

    setPreview({ file, objectUrl });

    // Simular progreso (la subida real la maneja el padre vía onUpload)
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 80);

    try {
      await onUpload(file);
      setProgress(100);
    } finally {
      clearInterval(interval);
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Resetear input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = "";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  }

  function clearPreview() {
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    setPreview(null);
    setError(null);
    setProgress(0);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Zona de carga de archivos. Arrastrá y soltá un archivo o hacé clic para seleccionar"
        aria-disabled={disabled}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-[1.25rem] border-2 border-dashed p-8 text-center transition-colors cursor-pointer outline-none",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30 bg-muted/10",
          disabled && "pointer-events-none opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloudIcon className="size-6" />
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Arrastrá un archivo aquí
          </p>
          <p className="text-xs text-muted-foreground">
            o{" "}
            <span className="font-medium text-primary underline underline-offset-2">
              hacé clic para seleccionar
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tamaño máximo: {formatBytes(maxSize)}
            {accept && ` · ${accept}`}
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled}
          aria-hidden="true"
        />
      </div>

      {/* Error */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {/* Preview */}
      {preview && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3">
          {/* Thumbnail */}
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
            {preview.objectUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.objectUrl}
                alt={preview.file.name}
                className="size-full object-cover"
              />
            ) : (
              <FileIcon className="size-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate text-sm font-medium text-foreground">
              {preview.file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(preview.file.size)}
            </p>

            {/* Progress bar */}
            {uploading || progress > 0 ? (
              <div className="mt-1">
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Progreso de carga"
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {progress < 100 ? `${progress}%` : "Completado"}
                </p>
              </div>
            ) : null}
          </div>

          {/* Remove */}
          {!uploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={clearPreview}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Quitar archivo"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
