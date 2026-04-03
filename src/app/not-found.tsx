import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className="w-full max-w-md rounded-[var(--radius)] bg-card p-10 text-center"
        style={{ boxShadow: "var(--shadow-2xl)" }}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[var(--radius)] bg-muted">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">404</h1>
        <h2 className="mt-1 text-lg font-semibold text-foreground">
          Página no encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscás no existe o fue movida.
        </p>
        <Button className="mt-6" style={{ boxShadow: "var(--shadow-sm)" }} render={<Link href="/dashboard" />}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
