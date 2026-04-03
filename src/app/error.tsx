"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className="w-full max-w-md rounded-[var(--radius)] bg-card p-10 text-center"
        style={{ boxShadow: "var(--shadow-2xl)" }}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-destructive/10">
          <TriangleAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground">
          Ocurrió un error
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo salió mal. Podés intentar recargar la página.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Ref: {error.digest}
          </p>
        )}
        <Button
          onClick={reset}
          className="mt-6"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          Reintentar
        </Button>
      </div>
    </div>
  );
}
