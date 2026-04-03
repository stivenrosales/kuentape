"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { ContextMenuRow } from "@/components/context-menu-row";
import { toggleStaffActiveAction } from "@/features/staff/actions";
import type { getStaffList } from "@/features/staff/queries";
import { cn } from "@/lib/utils";

type StaffMember = Awaited<ReturnType<typeof getStaffList>>[number];

const roleBadgeClass: Record<string, string> = {
  GERENCIA:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ADMINISTRADOR:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CONTADOR:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  VENTAS:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const roleLabel: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

interface EquipoTableProps {
  data: StaffMember[];
  onRowClick: (member: StaffMember) => void;
}

type SortKey = "nombre" | "rol" | "estado" | "servicios" | "clientes";
type SortDir = "asc" | "desc";

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-medium cursor-pointer select-none transition-colors hover:text-foreground align-middle",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export function EquipoTable({ data, onRowClick }: EquipoTableProps) {
  const router = useRouter();

  const [sortKey, setSortKey] = React.useState<SortKey>("nombre");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function sortItems(items: StaffMember[]): StaffMember[] {
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "nombre":
          cmp = `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`);
          break;
        case "rol": cmp = a.role.localeCompare(b.role); break;
        case "estado": cmp = Number(b.activo) - Number(a.activo); break;
        case "servicios": cmp = a._count.servicios - b._count.servicios; break;
        case "clientes": cmp = a._count.personasAsignadas - b._count.personasAsignadas; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const sorted = sortItems(data);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <table
        className="w-full text-sm border-collapse"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "35%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "9%" }} />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <SortableHeader label="Miembro" sortKey="nombre" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Email
            </th>
            <SortableHeader label="Rol" sortKey="rol" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Estado" sortKey="estado" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Servicios" sortKey="servicios" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
            <SortableHeader label="Clientes" sortKey="clientes" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No hay miembros del equipo.
              </td>
            </tr>
          ) : (
            sorted.map((member, i) => (
              <ContextMenuRow
                key={member.id}
                onClick={() => onRowClick(member)}
                className={`cursor-pointer transition-colors hover:bg-primary/5 ${
                  i % 2 === 0 ? "bg-muted/10" : "bg-background"
                }`}
                deleteLabel="Desactivar"
                confirmMessage={`¿Seguro que querés desactivar a "${member.nombre} ${member.apellido}"?`}
                onDelete={async () => {
                  await toggleStaffActiveAction(member.id);
                  router.refresh();
                }}
              >
                <td className="px-3 py-2.5 font-medium truncate">
                  {member.nombre} {member.apellido}
                </td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground truncate">
                  {member.email}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      roleBadgeClass[member.role] ?? ""
                    }`}
                  >
                    {roleLabel[member.role] ?? member.role}
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`size-2 rounded-full ${
                        member.activo ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                    <span className="text-xs">
                      {member.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">
                  {member._count.servicios}
                </td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">
                  {member._count.personasAsignadas}
                </td>
              </ContextMenuRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
