@AGENTS.md

# Sheila Estudio Contable — Project Rules

## Stack
- Next.js 15 App Router + TypeScript + pnpm
- PostgreSQL local (Prisma 7 with PrismaPg adapter)
- shadcn/ui (base-ui, NOT radix) + Tailwind CSS v4
- Cloudflare R2 for file storage
- Auth.js v5 (JWT with role)

## Design System (Claymorphism)
All UI changes MUST follow these rules:

### Colors
- **Primary (purple)**: UI elements, active states, actions, progress bars, workflow indicators
- **Green**: ONLY for money amounts that are positive (cobrado, pagado)
- **Destructive (red)**: ONLY for money amounts negative/pending (restante, deuda)
- **Muted**: backgrounds, borders, secondary text
- Use CSS variables (`--foreground`, `--primary`, `--destructive`, etc.), NOT raw Tailwind colors (no `bg-blue-50`, `bg-amber-100`)

### Typography
- `font-mono` (Roboto Mono) on ALL money values
- `text-xs` for labels, `text-sm` for body, `text-lg` for KPI values
- All text in SPANISH (es-PE)

### Components
- Radius: `rounded-lg` (0.75rem) — NOT `rounded-xl` or `rounded-[1.25rem]`
- Shadows: `shadow-sm` on cards, NO heavy shadows
- Cards: `bg-card border border-border shadow-sm rounded-lg`
- Buttons: use `<button>` or `<Link>` with classes, NOT `<Button render={<Link>}>` (causes base-ui errors)
- Selects: use shadcn Select with manual label in trigger (base-ui doesn't auto-display labels)
- No `asChild` prop — use `render` prop for composition

### Spacing
- Cards: `px-4 py-3` compact
- Table cells: `px-3 py-2.5`
- Sections: `space-y-6` between major sections

### Tables
- `table-layout: fixed` with `<colgroup>` percentages (NO whitespace between col tags)
- Headers: sortable with arrow icons, `bg-muted/50`
- Zebra: `bg-muted/10` for even rows
- Money columns: `text-right font-mono`

### Dialogs/Popups
- Center of screen with backdrop blur
- `max-w-2xl` for detail dialogs
- Escape to close
- `router.refresh()` after mutations when closing

## Code Rules
- Never add "Co-Authored-By" to commits
- Never run build commands after changes
- Use `bat`/`rg`/`fd` instead of `cat`/`grep`/`find`
- Money in INTEGER CENTAVOS (never floats)
- Prisma 7: use PrismaPg adapter, datasource in prisma.config.ts
- Auth callbacks must be in BOTH auth.config.ts AND auth.ts
