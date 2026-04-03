"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { Loader2, Lock, Mail, BookOpen } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      {/* Clay card */}
      <div
        className="rounded-[var(--radius)] bg-card p-8 sm:p-10"
        style={{
          boxShadow: "var(--shadow-2xl)",
        }}
      >
        {/* Logo / Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-primary"
            style={{ boxShadow: "var(--shadow-md)" }}
          >
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Kuenta
            </h1>
            <p className="text-sm text-muted-foreground">Estudio Contable</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-6 border-t border-border" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Correo electrónico
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nombre@ejemplo.com"
                className="pl-10"
                required
                disabled={isPending}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="pl-10"
                required
                disabled={isPending}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="rounded-[var(--radius-md)] border border-destructive/30 bg-destructive/10 px-4 py-3"
            >
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending}
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar"
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sistema interno &mdash; acceso restringido
        </p>
      </div>
    </div>
  );
}
