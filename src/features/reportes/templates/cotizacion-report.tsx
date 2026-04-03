import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

function centavosToSoles(centavos: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

const DARK_BLUE = "#1e3a5f";
const MID_BLUE = "#2563eb";
const LIGHT_BLUE = "#dbeafe";
const STRIPE = "#f8fafc";
const BORDER = "#e2e8f0";
const WHITE = "#ffffff";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";
const GREEN = "#16a34a";

const REGIMEN_LABELS: Record<string, string> = {
  MYPE: "Régimen MYPE Tributario",
  RER: "Régimen Especial de Renta",
  REG: "Régimen General",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT_DARK,
    paddingHorizontal: 40,
    paddingVertical: 36,
    backgroundColor: WHITE,
  },

  // Header strip
  headerStrip: {
    backgroundColor: DARK_BLUE,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  headerStripTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    marginBottom: 4,
  },
  headerStripSub: {
    fontSize: 9,
    color: "#93c5fd",
  },
  headerStripDate: {
    fontSize: 8,
    color: "#93c5fd",
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: MID_BLUE,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_BLUE,
    paddingBottom: 4,
    marginBottom: 8,
  },

  // Client info
  infoRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  infoLabel: {
    width: "35%",
    fontSize: 8,
    color: TEXT_MUTED,
    fontFamily: "Helvetica-Bold",
  },
  infoValue: {
    flex: 1,
    fontSize: 8,
    color: TEXT_DARK,
  },

  // Service table
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: DARK_BLUE,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowStripe: {
    backgroundColor: STRIPE,
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: DARK_BLUE,
  },

  thCell: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  tdCell: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
  },
  tdCellRight: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    textAlign: "right",
  },
  tdCellTotalLabel: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
  },
  tdCellTotalValue: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "right",
  },

  colServicio: { flex: 1 },
  colPrecio: { width: "30%" },

  // Validity badge
  validityBox: {
    backgroundColor: LIGHT_BLUE,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  validityText: {
    fontSize: 8,
    color: DARK_BLUE,
    textAlign: "center",
  },

  // Terms
  termsBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  termsItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  termsBullet: {
    width: 10,
    fontSize: 8,
    color: MID_BLUE,
  },
  termsText: {
    flex: 1,
    fontSize: 8,
    color: TEXT_MUTED,
    lineHeight: 1.4,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    marginTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
    textAlign: "center",
  },

  pageNumber: {
    position: "absolute",
    bottom: 18,
    right: 40,
    fontSize: 7,
    color: TEXT_MUTED,
  },
});

export interface CotizacionReportData {
  nombre: string;
  apellido: string;
  celular: string;
  email: string | null;
  regimen: string | null;
  rubro: string | null;
  numTrabajadores: number | null;
  planillaPrecioCalculado: number;
  fechaEmision?: string;
}

const TERMINOS = [
  "Los honorarios son mensuales y pagaderos dentro de los primeros 10 días de cada mes.",
  "Esta cotización tiene una validez de 30 días calendario a partir de la fecha de emisión.",
  "Los precios no incluyen IGV. Para emisión de comprobante, se aplica el 18% adicional.",
  "Ante cualquier consulta adicional, no dude en contactarnos.",
];

const SERVICIOS_BASE: Record<string, { nombre: string; descripcion: string }[]> = {
  MYPE: [
    {
      nombre: "Contabilidad mensual — Régimen MYPE",
      descripcion: "Registro de compras, ventas y declaraciones mensuales (PDT 621)",
    },
    {
      nombre: "Libros electrónicos",
      descripcion: "Registro de Compras y Registro de Ventas PLE",
    },
  ],
  RER: [
    {
      nombre: "Contabilidad mensual — RER",
      descripcion: "Registro de compras, ventas y declaraciones mensuales (PDT 621)",
    },
    {
      nombre: "Libros electrónicos",
      descripcion: "Registro de Compras y Registro de Ventas PLE",
    },
  ],
  REG: [
    {
      nombre: "Contabilidad mensual — Régimen General",
      descripcion: "Contabilidad completa: PDT 621, PDT 617, balances, etc.",
    },
    {
      nombre: "Libros electrónicos",
      descripcion: "Todos los libros obligatorios según nivel de ingresos",
    },
    {
      nombre: "Declaración anual — Renta de 3ra categoría",
      descripcion: "Elaboración y presentación PDT 710",
    },
  ],
};

interface CotizacionReportProps {
  data: CotizacionReportData;
}

export function CotizacionReportDocument({ data }: CotizacionReportProps) {
  const hoy = data.fechaEmision ?? new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Lima" });
  const regimenKey = data.regimen ?? "MYPE";
  const regimenLabel = REGIMEN_LABELS[regimenKey] ?? regimenKey;
  const servicios = SERVICIOS_BASE[regimenKey] ?? SERVICIOS_BASE["MYPE"]!;
  const tienePlanilla = data.numTrabajadores && data.numTrabajadores > 0;

  const fullName = `${data.nombre} ${data.apellido}`;

  return (
    <Document
      title={`Cotización — ${fullName}`}
      author="Estudio Contable Contadores & Asociados"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerStrip}>
          <Text style={styles.headerStripTitle}>Cotización de Servicios</Text>
          <Text style={styles.headerStripSub}>
            Estudio Contable Contadores & Asociados
          </Text>
          <Text style={styles.headerStripDate}>Fecha de emisión: {hoy}</Text>
        </View>

        {/* Client info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Prospecto</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Teléfono / Celular:</Text>
            <Text style={styles.infoValue}>{data.celular}</Text>
          </View>
          {data.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Correo electrónico:</Text>
              <Text style={styles.infoValue}>{data.email}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Régimen tributario:</Text>
            <Text style={[styles.infoValue, { color: MID_BLUE, fontFamily: "Helvetica-Bold" }]}>
              {regimenLabel}
            </Text>
          </View>
          {data.rubro && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rubro / Actividad:</Text>
              <Text style={styles.infoValue}>{data.rubro}</Text>
            </View>
          )}
          {tienePlanilla && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>N° de trabajadores:</Text>
              <Text style={styles.infoValue}>{data.numTrabajadores}</Text>
            </View>
          )}
        </View>

        {/* Services & pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalle de Servicios y Honorarios</Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thCell, styles.colServicio]}>Servicio</Text>
              <Text style={[styles.thCell, styles.colPrecio, { textAlign: "right" }]}>
                Honorarios mensuales
              </Text>
            </View>

            {/* Rows */}
            {servicios.map((s, i) => (
              <View
                key={i}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowStripe : {}]}
              >
                <View style={[styles.colServicio, { padding: 8 }]}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                    {s.nombre}
                  </Text>
                  <Text style={{ fontSize: 7, color: TEXT_MUTED, marginTop: 2 }}>
                    {s.descripcion}
                  </Text>
                </View>
                <Text style={[styles.tdCellRight, styles.colPrecio]}>
                  A convenir
                </Text>
              </View>
            ))}

            {/* Planilla row */}
            {tienePlanilla && (
              <View style={[styles.tableRow, styles.tableRowStripe]}>
                <View style={[styles.colServicio, { padding: 8 }]}>
                  <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
                    Gestión de Planilla
                  </Text>
                  <Text style={{ fontSize: 7, color: TEXT_MUTED, marginTop: 2 }}>
                    PLAME, PDT 601, AFP y ONP — {data.numTrabajadores} trabajador
                    {data.numTrabajadores !== 1 ? "es" : ""}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tdCellRight,
                    styles.colPrecio,
                    { color: GREEN, fontFamily: "Helvetica-Bold" },
                  ]}
                >
                  {centavosToSoles(data.planillaPrecioCalculado)}
                </Text>
              </View>
            )}

            {/* Total */}
            <View style={styles.tableRowTotal}>
              <Text style={[styles.tdCellTotalLabel, styles.colServicio]}>
                {tienePlanilla ? "Honorarios planilla (mensual)" : "Total estimado mensual"}
              </Text>
              <Text style={[styles.tdCellTotalValue, styles.colPrecio]}>
                {tienePlanilla
                  ? centavosToSoles(data.planillaPrecioCalculado)
                  : "A convenir"}
              </Text>
            </View>
          </View>
        </View>

        {/* Validity */}
        <View style={styles.validityBox}>
          <Text style={styles.validityText}>
            Esta cotización es válida por 30 días calendario a partir del {hoy}.
          </Text>
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Términos y Condiciones</Text>
          <View style={styles.termsBox}>
            {TERMINOS.map((t, i) => (
              <View key={i} style={styles.termsItem}>
                <Text style={styles.termsBullet}>•</Text>
                <Text style={styles.termsText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Estudio Contable Contadores & Asociados — Documento generado
            automáticamente, no requiere firma física.
          </Text>
        </View>

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
