import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { MonthlyReportData } from "../queries";

// --- helpers (no imports from @/lib — this runs in edge/node context) ---
function centavosToSoles(centavos: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

// --- palette ---
const DARK_BLUE = "#1e3a5f";
const MID_BLUE = "#2563eb";
const LIGHT_BLUE = "#dbeafe";
const STRIPE = "#f1f5f9";
const BORDER = "#cbd5e1";
const WHITE = "#ffffff";
const TEXT_DARK = "#0f172a";
const TEXT_MUTED = "#64748b";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: TEXT_DARK,
    paddingHorizontal: 28,
    paddingVertical: 24,
    backgroundColor: WHITE,
  },

  // --- header ---
  headerBlock: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK_BLUE,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 9,
    color: TEXT_MUTED,
  },
  headerContador: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: MID_BLUE,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: DARK_BLUE,
    marginBottom: 12,
  },

  // --- group section ---
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginTop: 10,
  },
  groupBorder: {
    width: 3,
    height: 14,
    backgroundColor: MID_BLUE,
    marginRight: 6,
    borderRadius: 1,
  },
  groupTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_BLUE,
  },

  // --- table ---
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowStripe: {
    backgroundColor: STRIPE,
  },
  tableRowSubtotal: {
    backgroundColor: LIGHT_BLUE,
  },
  tableRowTotal: {
    backgroundColor: DARK_BLUE,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: DARK_BLUE,
  },

  // header cells
  thCell: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
  },
  // data cells
  tdCell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    textAlign: "center",
  },
  tdCellLeft: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    textAlign: "left",
  },
  tdCellTotal: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    textAlign: "center",
    color: WHITE,
    fontFamily: "Helvetica-Bold",
  },
  tdCellSubtotal: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 7.5,
    textAlign: "center",
    color: DARK_BLUE,
    fontFamily: "Helvetica-Bold",
  },

  // column widths
  colNum: { width: "4%" },
  colEmpresa: { width: "26%" },
  colBase: { width: "11%" },
  colIgv: { width: "9%" },
  colNoGrav: { width: "10%" },
  colTrab: { width: "10%" },
  colTotal: { width: "12%" },
  colHonorarios: { width: "14%" },

  // --- totals section label ---
  totalSectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK_BLUE,
    marginBottom: 4,
    marginTop: 12,
  },

  // --- page numbers ---
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 28,
    fontSize: 7,
    color: TEXT_MUTED,
  },
});

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TableHeader() {
  return (
    <View style={styles.tableHeaderRow}>
      <View style={[styles.thCell, styles.colNum]}>
        <Text>#</Text>
      </View>
      <View style={[styles.thCell, styles.colEmpresa, { textAlign: "left" }]}>
        <Text>Nombre de la empresa</Text>
      </View>
      <View style={[styles.thCell, styles.colBase]}>
        <Text>Base Imp.</Text>
      </View>
      <View style={[styles.thCell, styles.colIgv]}>
        <Text>IGV</Text>
      </View>
      <View style={[styles.thCell, styles.colNoGrav]}>
        <Text>No gravado</Text>
      </View>
      <View style={[styles.thCell, styles.colTrab]}>
        <Text>N° Trabaj.</Text>
      </View>
      <View style={[styles.thCell, styles.colTotal]}>
        <Text>Total Imp.</Text>
      </View>
      <View style={[styles.thCell, styles.colHonorarios]}>
        <Text>Honorarios</Text>
      </View>
    </View>
  );
}

interface DataRowProps {
  numero: number;
  empresa: string;
  baseImponible: number;
  igv: number;
  noGravado: number;
  numTrabajadores: number | null;
  totalImponible: number;
  honorarios: number;
  stripe?: boolean;
}

function DataRow({
  numero,
  empresa,
  baseImponible,
  igv,
  noGravado,
  numTrabajadores,
  totalImponible,
  honorarios,
  stripe,
}: DataRowProps) {
  return (
    <View style={[styles.tableRow, stripe ? styles.tableRowStripe : {}]}>
      <Text style={[styles.tdCell, styles.colNum]}>{numero}</Text>
      <Text style={[styles.tdCellLeft, styles.colEmpresa]}>{empresa}</Text>
      <Text style={[styles.tdCell, styles.colBase]}>
        {centavosToSoles(baseImponible)}
      </Text>
      <Text style={[styles.tdCell, styles.colIgv]}>
        {centavosToSoles(igv)}
      </Text>
      <Text style={[styles.tdCell, styles.colNoGrav]}>
        {centavosToSoles(noGravado)}
      </Text>
      <Text style={[styles.tdCell, styles.colTrab]}>
        {numTrabajadores ?? "—"}
      </Text>
      <Text style={[styles.tdCell, styles.colTotal]}>
        {centavosToSoles(totalImponible)}
      </Text>
      <Text style={[styles.tdCell, styles.colHonorarios]}>
        {centavosToSoles(honorarios)}
      </Text>
    </View>
  );
}

interface TotalesRowProps {
  label: string;
  totales: {
    baseImponible: number;
    igv: number;
    noGravado: number;
    numTrabajadores: number;
    totalImponible: number;
    honorarios: number;
  };
  variant: "subtotal" | "total";
}

function TotalesRow({ label, totales, variant }: TotalesRowProps) {
  const isTotal = variant === "total";
  const rowStyle = isTotal ? styles.tableRowTotal : styles.tableRowSubtotal;
  const cellStyle = isTotal ? styles.tdCellTotal : styles.tdCellSubtotal;

  return (
    <View style={[styles.tableRow, rowStyle]}>
      <Text
        style={[
          cellStyle,
          styles.colNum,
          styles.colEmpresa,
          { width: "30%", textAlign: "left" },
        ]}
      >
        {label}
      </Text>
      <Text style={[cellStyle, styles.colBase]}>
        {centavosToSoles(totales.baseImponible)}
      </Text>
      <Text style={[cellStyle, styles.colIgv]}>
        {centavosToSoles(totales.igv)}
      </Text>
      <Text style={[cellStyle, styles.colNoGrav]}>
        {centavosToSoles(totales.noGravado)}
      </Text>
      <Text style={[cellStyle, styles.colTrab]}>
        {totales.numTrabajadores}
      </Text>
      <Text style={[cellStyle, styles.colTotal]}>
        {centavosToSoles(totales.totalImponible)}
      </Text>
      <Text style={[cellStyle, styles.colHonorarios]}>
        {centavosToSoles(totales.honorarios)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Document
// ---------------------------------------------------------------------------

interface MonthlyReportProps {
  data: MonthlyReportData;
}

export function MonthlyReportDocument({ data }: MonthlyReportProps) {
  return (
    <Document
      title={`Reporte ${data.mes} ${data.anio} - ${data.contador}`}
      author={data.estudio}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>
            {data.mes} - {data.anio} - {data.estudio}
          </Text>
          <Text style={styles.headerSub}>Reporte Mensual de Servicios</Text>
          <Text style={styles.headerContador}>Contador: {data.contador}</Text>
        </View>

        <View style={styles.divider} />

        {/* Groups */}
        {data.grupos.map((grupo, gi) => (
          <View key={gi} wrap={false}>
            <View style={styles.groupHeader}>
              <View style={styles.groupBorder} />
              <Text style={styles.groupTitle}>
                Tipo de Persona: {grupo.tipoPersona}
              </Text>
            </View>

            <View style={styles.table}>
              <TableHeader />
              {grupo.servicios.map((s, i) => (
                <DataRow
                  key={i}
                  {...s}
                  stripe={i % 2 === 1}
                />
              ))}
              <TotalesRow
                label="Subtotal"
                totales={grupo.totales}
                variant="subtotal"
              />
            </View>
          </View>
        ))}

        {/* Grand total */}
        <Text style={styles.totalSectionTitle}>Total General</Text>
        <View style={styles.table}>
          <TableHeader />
          <TotalesRow
            label="TOTAL GENERAL"
            totales={data.totalGeneral}
            variant="total"
          />
        </View>

        {/* Page number */}
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
