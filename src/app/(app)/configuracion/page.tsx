import { requireRole } from "@/lib/auth-guard";
import Link from "next/link";
import { FileCheck, Landmark, Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default async function ConfiguracionPage() {
  await requireRole(["GERENCIA"]);

  const sections = [
    {
      title: "Tipos de Servicio",
      description: "Gestionar los tipos de servicio disponibles (Declaración mensual, anual, etc.)",
      href: "/configuracion/tipos-servicio",
      icon: FileCheck,
    },
    {
      title: "Cuentas Bancarias",
      description: "Gestionar las cuentas bancarias del estudio para registro de pagos",
      href: "/configuracion/cuentas-bancarias",
      icon: Landmark,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Administrar las opciones del sistema" />

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-[var(--radius)] border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
