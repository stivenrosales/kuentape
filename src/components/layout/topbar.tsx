"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sun, Moon, ChevronRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  prospectos: "Prospectos",
  servicios: "Servicios",
  finanzas: "Finanzas",
  cobranzas: "Cobranzas",
  incidencias: "Incidencias",
  libros: "Libros",
  equipo: "Equipo",
  reportes: "Reportes",
  configuracion: "Configuración",
  nuevo: "Nuevo",
  editar: "Editar",
};

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    // If it looks like an ID (long alphanumeric), show "Detalle"
    const isId = segment.length > 10 && /^[a-z0-9]+$/i.test(segment);
    const label = ROUTE_LABELS[segment] ?? (isId ? "Detalle" : segment);
    return { label, href, isLast: index === segments.length - 1 };
  });
}

interface TopbarProps {
  userName: string;
  userRole: string;
}

const ROLE_LABELS: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

export function Topbar({ userName, userRole }: TopbarProps) {
  const breadcrumbs = useBreadcrumbs();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-4">
      {/* Sidebar trigger */}
      <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumbs */}
      <nav className="flex flex-1 items-center gap-1 overflow-hidden text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span
              className={
                crumb.isLast
                  ? "truncate font-medium text-foreground"
                  : "truncate text-muted-foreground"
              }
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Cambiar tema</span>
          </button>
        )}

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 cursor-pointer"
          >
            <span className="text-xs font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <div className="px-2 py-1.5">
                <p className="text-sm font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[userRole] ?? userRole}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
