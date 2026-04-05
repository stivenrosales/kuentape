/**
 * Genera el PDF de onboarding para Sheila.
 * Uso: pnpm tsx scripts/onboarding-pdf.tsx
 * Output: ~/Downloads/Onboarding-CyA-Sheila.pdf
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Circle,
  Polygon,
  Defs,
  LinearGradient,
  Stop,
  ClipPath,
  renderToBuffer,
} from "@react-pdf/renderer";
import { createElement } from "react";
import { writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

// ─── Brand palette ────────────────────────────────────────────────────────────
const NAVY = "#1b296b";
const NAVY_DARK = "#0f1a47";
const TEAL = "#16738b";
const GREEN = "#88c440";
const SKY = "#46bce5";
const LIGHT_BLUE = "#05a7df";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const MUTED_LIGHT = "#94a3b8";
const BORDER = "#e2e8f0";
const STRIPE = "#f8fafc";
const STRIPE_DARK = "#f1f5f9";
const WHITE = "#ffffff";
const SUCCESS = "#16a34a";
const DANGER = "#dc2626";

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
    paddingHorizontal: 44,
    paddingTop: 44,
    paddingBottom: 56,
    backgroundColor: WHITE,
  },

  // Cover
  cover: {
    fontFamily: "Helvetica",
    paddingHorizontal: 60,
    paddingVertical: 80,
    backgroundColor: WHITE,
  },
  coverTop: {
    alignItems: "center",
    marginBottom: 40,
  },
  coverBrand: {
    fontSize: 11,
    color: NAVY,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginTop: 20,
    fontFamily: "Helvetica-Bold",
  },
  coverTitle: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    marginTop: 80,
    textAlign: "left",
    letterSpacing: -1,
  },
  coverSubtitle: {
    fontSize: 16,
    color: MUTED,
    marginTop: 12,
    lineHeight: 1.5,
  },
  coverDivider: {
    height: 3,
    width: 60,
    backgroundColor: GREEN,
    marginTop: 28,
    marginBottom: 28,
  },
  coverMeta: {
    fontSize: 9,
    color: MUTED_LIGHT,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  coverFooter: {
    position: "absolute",
    bottom: 60,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 14,
  },
  coverFooterText: {
    fontSize: 8,
    color: MUTED_LIGHT,
  },

  // Page header
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  pageHeaderBrand: {
    marginLeft: 10,
    fontSize: 9,
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    flex: 1,
  },
  pageHeaderRight: {
    fontSize: 8,
    color: MUTED_LIGHT,
  },

  // Section
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  sectionNumber: {
    width: 30,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: GREEN,
    lineHeight: 1,
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
    lineHeight: 1.2,
  },
  sectionKicker: {
    fontSize: 8,
    color: TEAL,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 3,
    fontFamily: "Helvetica-Bold",
  },
  body: {
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.55,
    marginTop: 6,
    marginLeft: 30,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 30,
  },
  bullet: {
    fontSize: 9.5,
    color: TEXT,
    marginBottom: 4,
    lineHeight: 1.5,
  },
  bulletBold: {
    fontFamily: "Helvetica-Bold",
    color: NAVY_DARK,
  },

  // Info box (navy)
  calloutNavy: {
    backgroundColor: NAVY,
    borderRadius: 6,
    padding: 14,
    marginTop: 10,
    marginLeft: 30,
  },
  calloutNavyLabel: {
    fontSize: 7,
    color: SKY,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  calloutNavyValue: {
    fontSize: 11,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },

  // Tip box
  tipBox: {
    flexDirection: "row",
    backgroundColor: STRIPE,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    padding: 10,
    marginTop: 8,
    marginLeft: 30,
    borderRadius: 3,
  },
  tipIcon: {
    fontSize: 10,
    color: GREEN,
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },
  tipText: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
    flex: 1,
    fontStyle: "italic",
  },

  // Two-column grid
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    marginLeft: 30,
  },
  col: {
    flex: 1,
    padding: 12,
    backgroundColor: STRIPE,
    borderRadius: 5,
    borderLeftWidth: 2,
    borderLeftColor: TEAL,
  },
  colTitle: {
    fontSize: 9,
    color: NAVY_DARK,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  colBody: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
  },

  // State badges row
  statesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 10,
    marginLeft: 30,
    flexWrap: "wrap",
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  stateBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7.5,
    color: MUTED_LIGHT,
  },
});

// ─── Logo Mark SVG ────────────────────────────────────────────────────────────
function LogoMark({ size = 80 }: { size?: number }) {
  return createElement(
    Svg,
    { viewBox: "163 55 437 437", width: size, height: size },
    createElement(
      Defs,
      null,
      createElement(
        LinearGradient,
        { id: "arrowGrad", x1: "0%", y1: "100%", x2: "100%", y2: "0%" },
        createElement(Stop, { offset: "0%", stopColor: SKY }),
        createElement(Stop, { offset: "100%", stopColor: TEAL }),
      ),
      createElement(
        ClipPath,
        { id: "c-cut" },
        createElement(Polygon, { points: "0,0 415,0 415,250 800,250 800,800 0,800" }),
      ),
    ),
    createElement(Path, {
      d: "M 440,150 A 150,150 0 0,0 200,270 A 150,150 0 0,0 400,410",
      fill: "none",
      stroke: NAVY,
      strokeWidth: 34,
      strokeLinecap: "butt",
      clipPath: "url(#c-cut)",
    }),
    createElement(Circle, { cx: 400, cy: 410, r: 17, fill: NAVY }),
    createElement(Polygon, { points: "320,220 360,220 360,323.5 320,334", fill: LIGHT_BLUE }),
    createElement(Polygon, { points: "375,180 415,180 415,309 375,319.5", fill: GREEN }),
    createElement(Polygon, { points: "430,120 470,120 470,294.5 430,305", fill: TEAL }),
    createElement(Polygon, {
      points: "320,380 510,330 518,350 580,292 502,270 510,290 320,340",
      fill: "url(#arrowGrad)",
    }),
  );
}

// ─── Reusable components ──────────────────────────────────────────────────────
function PageHeader({ page, total }: { page: number; total: number }) {
  return createElement(
    View,
    { style: styles.pageHeader, fixed: true },
    createElement(LogoMark, { size: 18 }),
    createElement(Text, { style: styles.pageHeaderBrand }, "C&A — Guía de inicio"),
    createElement(Text, { style: styles.pageHeaderRight }, `Página ${page} de ${total}`),
  );
}

function PageFooter() {
  return createElement(
    View,
    { style: styles.footer, fixed: true },
    createElement(
      Text,
      { style: styles.footerText },
      "C&A — Contadores y Asociados · Documento interno",
    ),
    createElement(
      Text,
      { style: styles.footerText },
      `Generado ${new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })}`,
    ),
  );
}

type SectionProps = {
  number: string;
  kicker: string;
  title: string;
  children: React.ReactNode;
};

function Section({ number, kicker, title, children }: SectionProps) {
  return createElement(
    View,
    { style: styles.section, wrap: false },
    createElement(
      View,
      { style: styles.sectionHeader },
      createElement(Text, { style: styles.sectionNumber }, number),
      createElement(
        View,
        { style: styles.sectionTitleWrap },
        createElement(Text, { style: styles.sectionKicker }, kicker),
        createElement(Text, { style: styles.sectionTitle }, title),
      ),
    ),
    children,
  );
}

function Body(text: string) {
  return createElement(Text, { style: styles.body }, text);
}

function Bullets(items: string[]) {
  return createElement(
    View,
    { style: styles.bulletList },
    ...items.map((t, i) =>
      createElement(Text, { key: i, style: styles.bullet }, `•  ${t}`),
    ),
  );
}

function Tip(text: string) {
  return createElement(
    View,
    { style: styles.tipBox },
    createElement(Text, { style: styles.tipIcon }, "→"),
    createElement(Text, { style: styles.tipText }, text),
  );
}

function TwoCol(cols: { title: string; body: string }[]) {
  return createElement(
    View,
    { style: styles.twoCol },
    ...cols.map((c, i) =>
      createElement(
        View,
        { key: i, style: styles.col },
        createElement(Text, { style: styles.colTitle }, c.title),
        createElement(Text, { style: styles.colBody }, c.body),
      ),
    ),
  );
}

function StateBadges(badges: { label: string; color: string; bg: string }[]) {
  return createElement(
    View,
    { style: styles.statesRow },
    ...badges.map((b, i) =>
      createElement(
        View,
        {
          key: i,
          style: {
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: b.bg,
          },
        },
        createElement(
          Text,
          {
            style: {
              fontSize: 7.5,
              fontFamily: "Helvetica-Bold",
              color: b.color,
            },
          },
          b.label.toUpperCase(),
        ),
      ),
    ),
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────
function OnboardingDocument() {
  const TOTAL_PAGES = 6;

  return createElement(
    Document,
    {
      title: "C&A — Onboarding Sheila",
      author: "C&A Estudio Contable",
      subject: "Guía de inicio al sistema",
    },

    // ═══════════════════════════════════════════════════════════════════════
    // COVER
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.cover },
      createElement(
        View,
        { style: styles.coverTop },
        createElement(LogoMark, { size: 130 }),
        createElement(Text, { style: styles.coverBrand }, "Contadores y Asociados"),
      ),
      createElement(Text, { style: styles.coverTitle }, "Bienvenida, Sheila"),
      createElement(
        Text,
        { style: styles.coverSubtitle },
        "Guía rápida para empezar a usar tu sistema\nde gestión contable en cinco minutos.",
      ),
      createElement(View, { style: styles.coverDivider }),
      createElement(
        Text,
        { style: styles.coverMeta },
        "Documento de onboarding",
      ),
      createElement(
        View,
        { style: styles.coverFooter },
        createElement(
          Text,
          { style: styles.coverFooterText },
          "C&A — Contadores y Asociados",
        ),
        createElement(
          Text,
          { style: styles.coverFooterText },
          `v1.0 · ${new Date().toLocaleDateString("es-PE")}`,
        ),
      ),
    ),

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 2 — Tu acceso + Dashboard
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(PageHeader, { page: 2, total: TOTAL_PAGES }),

      createElement(
        Section,
        {
          number: "01",
          kicker: "Primer paso",
          title: "Tu acceso al sistema",
        },
        Body(
          "Ingresás desde cualquier navegador con tu correo corporativo. Nadie más comparte tu usuario: lo que registres queda a tu nombre. Si alguna vez olvidás la contraseña, pedile al equipo técnico que te la restablezca — no se puede recuperar sola por seguridad.",
        ),
        createElement(
          View,
          { style: styles.calloutNavy },
          createElement(Text, { style: styles.calloutNavyLabel }, "Dirección web"),
          createElement(
            Text,
            { style: styles.calloutNavyValue },
            "ca-estudio-contable.vercel.app",
          ),
          createElement(Text, { style: styles.calloutNavyLabel }, "Tu usuario"),
          createElement(
            Text,
            { style: styles.calloutNavyValue },
            "sheila@estudiocontablecya.com",
          ),
          createElement(Text, { style: styles.calloutNavyLabel }, "Contraseña inicial"),
          createElement(Text, { style: styles.calloutNavyValue }, "admin123"),
        ),
        Tip(
          "Guardá el enlace en tus Favoritos del navegador para entrar en un clic.",
        ),
      ),

      createElement(
        Section,
        {
          number: "02",
          kicker: "Tu vista principal",
          title: "Dashboard — Todo de un vistazo",
        },
        Body(
          "Es lo primero que ves al entrar. Reúne los números más importantes del mes en tarjetas grandes: clientes activos, facturación, cobranzas pendientes y servicios por declarar. Si algo está en rojo, es porque requiere tu atención.",
        ),
        Bullets([
          "Clientes activos: cuántos están en cartera este mes",
          "Ingresos del mes: lo que ya entró a caja o banco",
          "Por cobrar: servicios entregados pero aún no pagados",
          "Pendientes: servicios que esperan declararse",
        ]),
        Tip(
          "No necesitás hacer nada en esta pantalla — es solo para leer. Los cambios los hacés desde los módulos específicos.",
        ),
      ),

      createElement(PageFooter, null),
    ),

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 3 — Clientes + Prospectos
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(PageHeader, { page: 3, total: TOTAL_PAGES }),

      createElement(
        Section,
        {
          number: "03",
          kicker: "Tu cartera",
          title: "Clientes — Las empresas y personas que atendés",
        },
        Body(
          "Acá vive toda tu cartera. Cada fila es una persona natural o jurídica con su RUC, régimen tributario, contador asignado y estado. Hacés clic sobre cualquier cliente para ver el detalle completo: servicios contratados, incidencias abiertas, libros del período, historial de pagos.",
        ),
        Bullets([
          "Buscador arriba — por nombre, RUC o celular",
          "Filtros — por régimen, estado o contador asignado",
          "Edición directa en la tabla: clic sobre un campo para modificarlo",
          "Botón + arriba a la derecha para agregar un cliente nuevo",
        ]),
      ),

      createElement(
        Section,
        {
          number: "04",
          kicker: "Tu pipeline comercial",
          title: "Prospectos — Futuros clientes",
        },
        Body(
          "Los prospectos son leads que aún no firmaron. Tenés dos vistas: la lista (más detallada, con filtros) y el tablero Kanban (más visual, arrastrás tarjetas de una columna a otra según avanza la venta).",
        ),
        createElement(
          View,
          {
            style: {
              marginTop: 10,
              marginLeft: 30,
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
            },
          },
          ...[
            { label: "Nuevo", bg: "#e0f2fe", color: "#0369a1" },
            { label: "Contactado", bg: "#fef3c7", color: "#92400e" },
            { label: "Cotizado", bg: "#ede9fe", color: "#5b21b6" },
            { label: "Convertido", bg: "#dcfce7", color: "#166534" },
            { label: "Perdido", bg: "#fee2e2", color: "#991b1b" },
          ].map((b, i) =>
            createElement(
              View,
              {
                key: i,
                style: {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: b.bg,
                },
              },
              createElement(
                Text,
                {
                  style: {
                    fontSize: 7.5,
                    fontFamily: "Helvetica-Bold",
                    color: b.color,
                  },
                },
                b.label.toUpperCase(),
              ),
            ),
          ),
        ),
        Tip(
          "Cuando un prospecto acepta la cotización, desde su detalle hay un botón 'Convertir a cliente' que lo mueve automáticamente al módulo de Clientes con todos sus datos.",
        ),
      ),

      createElement(PageFooter, null),
    ),

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 4 — Servicios + Libros
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(PageHeader, { page: 4, total: TOTAL_PAGES }),

      createElement(
        Section,
        {
          number: "05",
          kicker: "El corazón operativo",
          title: "Servicios — Tu trabajo mes a mes",
        },
        Body(
          "Cada cliente tiene servicios mensuales (declaraciones), anuales o puntuales (trámites, asesorías). El flujo de cada servicio pasa por cuatro estados. La tabla te muestra todos los servicios del período con sus honorarios, lo cobrado y lo pendiente.",
        ),
        createElement(
          View,
          {
            style: {
              marginTop: 10,
              marginLeft: 30,
              flexDirection: "row",
              gap: 6,
              flexWrap: "wrap",
            },
          },
          ...[
            { label: "Por declarar", bg: "#fef3c7", color: "#92400e" },
            { label: "Declarado", bg: "#dbeafe", color: "#1e40af" },
            { label: "Por cobrar", bg: "#ede9fe", color: "#5b21b6" },
            { label: "Cobrado", bg: "#dcfce7", color: "#166534" },
          ].map((b, i) =>
            createElement(
              View,
              {
                key: i,
                style: {
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: b.bg,
                },
              },
              createElement(
                Text,
                {
                  style: {
                    fontSize: 7.5,
                    fontFamily: "Helvetica-Bold",
                    color: b.color,
                  },
                },
                b.label.toUpperCase(),
              ),
            ),
          ),
        ),
        Tip(
          "Al final de mes, podés exportar un PDF con todos los servicios del período — útil para reuniones de gerencia o para enviar a contabilidad.",
        ),
      ),

      createElement(
        Section,
        {
          number: "06",
          kicker: "Registro mensual obligatorio",
          title: "Libros contables",
        },
        Body(
          "Por cada cliente y cada mes, el sistema crea un libro contable. Es donde cargás los comprobantes (facturas, boletas), movimientos y notas del período. Los libros se generan automáticamente el día 1 de cada mes para todos los clientes activos.",
        ),
        Bullets([
          "Un libro por cliente y por mes — imposible duplicar",
          "Podés adjuntar PDFs y documentos al libro",
          "Búsqueda por cliente, mes, año o estado",
          "Cada libro tiene un detalle con su historial completo",
        ]),
      ),

      createElement(PageFooter, null),
    ),

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 5 — Incidencias + Finanzas + Caja Chica
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(PageHeader, { page: 5, total: TOTAL_PAGES }),

      createElement(
        Section,
        {
          number: "07",
          kicker: "Cuando algo requiere atención",
          title: "Incidencias — Problemas de clientes",
        },
        Body(
          "Si un cliente reporta algo (multa de SUNAT, error en una declaración, duda urgente), registrás una incidencia. Le asignás un contador responsable y vas actualizando su estado hasta resolverla. Queda el historial completo con comentarios.",
        ),
        Tip(
          "Las incidencias abiertas aparecen destacadas en el Dashboard para que no se pierdan de vista.",
        ),
      ),

      createElement(
        Section,
        {
          number: "08",
          kicker: "Tu dinero",
          title: "Finanzas — Ingresos y egresos de la empresa",
        },
        Body(
          "Acá registrás todo lo que entra (pagos de clientes) y sale (sueldos, servicios, impuestos) del estudio. Cada transacción tiene cuenta, monto, fecha y comprobante. Podés exportar reportes PDF por rango de fechas.",
        ),
        TwoCol([
          {
            title: "Ingresos",
            body: "Los pagos de servicios se vinculan automáticamente al cliente y al servicio correspondiente.",
          },
          {
            title: "Validación",
            body: "Como Gerencia, vos validás los pagos antes de que se consideren definitivos en los reportes.",
          },
        ]),
      ),

      createElement(
        Section,
        {
          number: "09",
          kicker: "Gastos menores del día a día",
          title: "Caja Chica",
        },
        Body(
          "Para gastos chicos sin comprobante formal: taxi, café de reunión, útiles de oficina. Se registran en caja chica con una categoría y, cuando generás el egreso, el monto se descuenta automáticamente de Finanzas.",
        ),
      ),

      createElement(PageFooter, null),
    ),

    // ═══════════════════════════════════════════════════════════════════════
    // PAGE 6 — Equipo + Configuración + Soporte
    // ═══════════════════════════════════════════════════════════════════════
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(PageHeader, { page: 6, total: TOTAL_PAGES }),

      createElement(
        Section,
        {
          number: "10",
          kicker: "Tu gente",
          title: "Equipo — Contadores y colaboradores",
        },
        Body(
          "El listado de todo tu staff con su rol (Gerencia, Administrador, Contador, Ventas), email y estado. Como Gerencia, podés dar de alta a nuevos miembros, asignarles clientes y desactivar cuentas cuando alguien deja el estudio.",
        ),
      ),

      createElement(
        Section,
        {
          number: "11",
          kicker: "Personalización del sistema",
          title: "Configuración",
        },
        Body(
          "Dos submenús clave bajo Configuración:",
        ),
        Bullets([
          "Cuentas bancarias: las cuentas donde cobrás y pagás (BCP, Interbank, efectivo, etc.)",
          "Tipos de servicio: personalizar los nombres de los servicios que ofrece el estudio",
        ]),
      ),

      createElement(
        Section,
        {
          number: "12",
          kicker: "Último consejo",
          title: "Tips finales antes de empezar",
        },
        Bullets([
          "Cambiá tu contraseña inicial apenas ingreses por primera vez",
          "Usá los filtros — todas las tablas los tienen y te ahorran minutos",
          "La tecla Escape siempre cierra cualquier pop-up o formulario abierto",
          "Los montos siempre se muestran en soles peruanos (S/) con 2 decimales",
          "Cualquier cambio que hagas queda registrado: hay historial de auditoría",
        ]),
        createElement(
          View,
          {
            style: {
              marginTop: 18,
              marginLeft: 30,
              padding: 14,
              backgroundColor: NAVY,
              borderRadius: 6,
            },
          },
          createElement(
            Text,
            {
              style: {
                fontSize: 11,
                fontFamily: "Helvetica-Bold",
                color: WHITE,
                marginBottom: 4,
              },
            },
            "¿Necesitás ayuda?",
          ),
          createElement(
            Text,
            {
              style: {
                fontSize: 9,
                color: SKY,
                lineHeight: 1.5,
              },
            },
            "Escribile al equipo técnico con una descripción del problema y una captura de pantalla. Ellos pueden revisar el sistema en vivo desde su lado.",
          ),
        ),
      ),

      createElement(PageFooter, null),
    ),
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Generando PDF de onboarding...");
  const buffer = await renderToBuffer(createElement(OnboardingDocument));
  const outPath = join(homedir(), "Downloads", "Onboarding-CyA-Sheila.pdf");
  await writeFile(outPath, buffer);
  console.log(`✓ PDF generado: ${outPath}`);
  console.log(`  Tamaño: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch((err) => {
  console.error("Error generando PDF:", err);
  process.exit(1);
});
