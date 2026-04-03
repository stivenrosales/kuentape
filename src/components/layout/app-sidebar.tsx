"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  FileCheck,
  DollarSign,
  Receipt,
  AlertTriangle,
  BookOpen,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["GERENCIA", "ADMINISTRADOR", "CONTADOR", "VENTAS"],
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Building2,
    roles: ["GERENCIA", "ADMINISTRADOR", "CONTADOR"],
  },
  {
    label: "Prospectos",
    href: "/prospectos",
    icon: UserPlus,
    roles: ["GERENCIA", "ADMINISTRADOR", "VENTAS"],
  },
  {
    label: "Servicios",
    href: "/servicios",
    icon: FileCheck,
    roles: ["GERENCIA", "ADMINISTRADOR", "CONTADOR"],
  },
  {
    label: "Finanzas",
    href: "/finanzas",
    icon: DollarSign,
    roles: ["GERENCIA", "ADMINISTRADOR"],
  },
  {
    label: "Cobranzas",
    href: "/cobranzas",
    icon: Receipt,
    roles: ["GERENCIA", "ADMINISTRADOR"],
  },
  {
    label: "Incidencias",
    href: "/incidencias",
    icon: AlertTriangle,
    roles: ["GERENCIA", "ADMINISTRADOR", "CONTADOR"],
  },
  {
    label: "Libros",
    href: "/libros",
    icon: BookOpen,
    roles: ["GERENCIA", "ADMINISTRADOR", "CONTADOR"],
  },
  {
    label: "Equipo",
    href: "/equipo",
    icon: Users,
    roles: ["GERENCIA"],
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: FileText,
    roles: ["GERENCIA", "ADMINISTRADOR"],
  },
  {
    label: "Configuración",
    href: "/configuracion",
    icon: Settings,
    roles: ["GERENCIA"],
  },
];

const ROLE_LABELS: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

interface AppSidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

export function AppSidebar({ userName, userEmail, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className={cn("flex items-center py-2", isCollapsed ? "justify-center px-0" : "gap-2.5 px-2")}>
          <div
            className={cn(
              "shrink-0 flex items-center justify-center rounded-md bg-primary",
              isCollapsed ? "h-7 w-7" : "h-8 w-8"
            )}
          >
            <BookOpen className={cn(isCollapsed ? "h-3.5 w-3.5" : "h-4 w-4", "text-primary-foreground")} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold text-sidebar-foreground">
                Sheila
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                Estudio Contable
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(item.href));

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: user info + logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className={cn("px-2 py-3", isCollapsed && "flex justify-center")}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-sidebar-foreground">
                  {userName}
                </span>
                <Badge
                  variant="secondary"
                  className="mt-0.5 w-fit text-[10px] px-1.5 py-0"
                >
                  {ROLE_LABELS[userRole] ?? userRole}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
