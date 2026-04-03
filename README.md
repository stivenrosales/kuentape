<div align="center">

# 📊 Kuenta — Estudio Contable

**Sistema de gestión integral para estudios contables**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Sistema integral para estudios contables peruanos — clientes, servicios, cobranzas, reportes PDF, y más.*

---

</div>

## 🧠 ¿Qué es Kuenta?

Kuenta es una aplicación web completa para gestionar las operaciones diarias de un estudio contable. Ofrece:

- 🏢 **Gestión de clientes** con edición inline y credenciales encriptadas
- 📋 **Servicios contables** con pricing automático y tracking de cobranza
- 💰 **Finanzas** con control de ingresos, egresos y caja chica
- 🎯 **Pipeline de prospectos** con Kanban drag-and-drop
- 📊 **Dashboards** diferenciados por rol (Gerencia / Contador / Ventas)
- 📄 **Generación de PDFs** nativos (reportes mensuales, caja chica, cotizaciones)
- 📚 **Control de libros contables** con generación automática mensual
- 🔐 **Autenticación y RBAC** con 4 roles

## ✨ Features

### 👨‍💼 Para Contadores
- 📝 Lista de servicios del mes con checkbox de declaración
- 💳 Registro de cobros con comprobante (subido a Cloudflare R2)
- 📊 Vista de cobranzas personales
- 🔔 Incidencias por cliente

### 👩‍💻 Para Gerencia / Admin
- 📈 Dashboard ejecutivo con rendimiento por contador
- 💰 Control financiero completo (ingresos, egresos, utilidad)
- 👥 Gestión de equipo
- 📄 Generación de reportes PDF
- ⚙️ Configuración de tipos de servicio y cuentas bancarias

### 🤝 Para Ventas
- 🎯 Pipeline Kanban de prospectos con drag-and-drop
- 📋 Cotizaciones automáticas
- 🔄 Conversión de prospecto a cliente

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **UI** | shadcn/ui (base-ui), Tailwind CSS v4, Claymorphism theme |
| **Base de datos** | PostgreSQL 16 + Prisma 7 |
| **Autenticación** | Auth.js v5 (JWT, Credentials) |
| **Storage** | Cloudflare R2 (comprobantes, adjuntos) |
| **Charts** | Recharts |
| **PDF** | @react-pdf/renderer |
| **Drag & Drop** | @atlaskit/pragmatic-drag-and-drop |
| **Package Manager** | pnpm |

## 🚀 Quick Start

### Requisitos
- Node.js 20+
- PostgreSQL 16
- pnpm

### Instalación

```bash
# Clonar el repo
git clone git@github.com:stivenrosales/Estudio-Contable-Haiku.git
cd Estudio-Contable-Haiku

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu DATABASE_URL, AUTH_SECRET, etc.

# Crear la base de datos y migrar
pnpm prisma migrate dev --name init
pnpm prisma generate

# Seed con datos de demostración
pnpm prisma db seed

# Iniciar en desarrollo
pnpm dev
```

### 🔑 Usuarios de prueba

| Email | Password | Rol |
|-------|----------|-----|
| `admin@kuenta.pe` | `admin123` | 👑 Gerencia |
| `gabriela@kuenta.pe` | `contador123` | 📋 Contador |
| `leo@kuenta.pe` | `contador123` | 📋 Contador |
| `ventas@kuenta.pe` | `ventas123` | 🤝 Ventas |

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Rutas protegidas
│   ├── (auth)/            # Login
│   └── api/               # API routes
├── components/            # Componentes compartidos
├── features/              # Módulos de negocio
│   ├── servicios/         # Servicios contables
│   ├── personas/          # Clientes
│   ├── leads/             # Prospectos / pipeline
│   ├── finanzas/          # Finanzas y transacciones
│   ├── caja-chica/        # Caja chica
│   ├── incidencias/       # Tickets
│   ├── libros/            # Libros contables
│   ├── staff/             # Equipo
│   ├── reportes/          # PDFs
│   ├── cobranzas/         # Cobranzas
│   └── dashboard/         # Dashboard por rol
├── lib/                   # Utilidades
└── types/                 # TypeScript types
```

## 🔒 Seguridad

- 🔐 **Credenciales encriptadas** — AES-256-GCM con rotación de keys
- 🛡️ **RBAC en 3 capas** — Middleware → Server Component → Server Action
- 👁️ **Scoping por rol** — Contadores solo ven sus propios clientes
- 📝 **Audit log** — Acciones sensibles registradas automáticamente

## 💲 Pricing Automático

El sistema calcula honorarios basado en reglas de negocio:

| Servicio | Cálculo |
|----------|---------|
| **Declaración mensual** | Tipo persona + régimen + facturación |
| **Constitución** | Monto de capital social |
| **Planilla** | Cantidad de trabajadores |

Los precios se congelan al crear — cambios futuros no afectan servicios existentes.

## 📅 Automatización

| Job | Schedule | Descripción |
|-----|----------|-------------|
| 📚 Generar Libros | 1ro de cada mes | Crea libros contables para todas las empresas activas |

## 🤝 Contribuir

1. Fork el repo
2. Creá tu branch (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'feat: nueva feature'`)
4. Push (`git push origin feature/nueva-feature`)
5. Abrí un Pull Request

## 📜 Licencia

Este proyecto está bajo la licencia **MIT**. Ver [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**Desarrollado con ❤️ para estudios contables peruanos**

[![GitHub](https://img.shields.io/badge/GitHub-stivenrosales-181717?style=for-the-badge&logo=github)](https://github.com/stivenrosales)

</div>
