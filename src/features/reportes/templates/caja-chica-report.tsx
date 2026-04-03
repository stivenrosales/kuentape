import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CajaChicaReportData } from "../queries";

function centavosToSoles(centavos: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(centavos / 100);
}

function formatDatePE(date: Date): string {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Lima",
  });
}

const DARK_BLUE = "#1e3a5f";
const MID_BLUE = "#2563eb";
const LIGHT_BLUE = "#dbeafe";
const GREEN_BG = "#dcfce7";
const RED_BG = "#fee2e2";
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

  headerTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK_BLUE,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 9,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: DARK_BLUE,
    marginBottom: 14,
  },

  // Summary cards
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK_BLUE,
  },
  summaryValueGreen: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#16a34a",
  },
  summaryValueRed: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#dc2626",
  },

  // Table
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 3,
    overflow: "hidden",
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
  tableRowIngreso: {
    backgroundColor: GREEN_BG,
  },
  tableRowGasto: {
    backgroundColor: RED_BG,
  },
  tableRowTotal: {
    backgroundColor: DARK_BLUE,
  },

  thCell: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    color: WHITE,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    textAlign: "center",
  },
  tdCell: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 7.5,
    textAlign: "center",
  },
  tdCellLeft: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 7.5,
    textAlign: "left",
  },
  tdCellTotal: {
    paddingVertical: 4,
    paddingHorizontal: 5,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: WHITE,
    textAlign: "center",
  },

  colNum: { width: "5%" },
  colFecha: { width: "12%" },
  colConcepto: { width: "38%" },
  colTipo: { width: "10%" },
  colMonto: { width: "14%" },
  colSaldo: { width: "17%" },

  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 28,
    fontSize: 7,
    color: TEXT_MUTED,
  },
});

interface CajaChicaReportProps {
  data: CajaChicaReportData;
}

export function CajaChicaReportDocument({ data }: CajaChicaReportProps) {
  return (
    <Document
      title={`Reporte Caja Chica - ${data.mes} ${data.anio}`}
      author={data.estudio}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <Text style={styles.headerTitle}>
          Reporte Caja Chica — {data.mes} {data.anio}
        </Text>
        <Text style={styles.headerSub}>{data.estudio}</Text>
        <View style={styles.divider} />

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: LIGHT_BLUE }]}>
            <Text style={styles.summaryLabel}>Saldo Inicial</Text>
            <Text style={styles.summaryValue}>
              {centavosToSoles(data.saldoInicial)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: GREEN_BG }]}>
            <Text style={styles.summaryLabel}>Total Ingresos</Text>
            <Text style={styles.summaryValueGreen}>
              {centavosToSoles(data.totalIngresos)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: RED_BG }]}>
            <Text style={styles.summaryLabel}>Total Gastos</Text>
            <Text style={styles.summaryValueRed}>
              {centavosToSoles(data.totalGastos)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#f0fdf4", borderColor: "#86efac" }]}>
            <Text style={styles.summaryLabel}>Saldo Final</Text>
            <Text style={styles.summaryValueGreen}>
              {centavosToSoles(data.saldoFinal)}
            </Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.thCell, styles.colNum]}>#</Text>
            <Text style={[styles.thCell, styles.colFecha]}>Fecha</Text>
            <Text style={[styles.thCell, styles.colConcepto, { textAlign: "left" }]}>
              Concepto
            </Text>
            <Text style={[styles.thCell, styles.colTipo]}>Tipo</Text>
            <Text style={[styles.thCell, styles.colMonto]}>Monto</Text>
            <Text style={[styles.thCell, styles.colSaldo]}>Saldo Acumulado</Text>
          </View>

          {/* Rows */}
          {data.movimientos.map((m, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                i % 2 === 1 ? styles.tableRowStripe : {},
              ]}
            >
              <Text style={[styles.tdCell, styles.colNum]}>{m.numero}</Text>
              <Text style={[styles.tdCell, styles.colFecha]}>
                {formatDatePE(m.fecha)}
              </Text>
              <Text style={[styles.tdCellLeft, styles.colConcepto]}>
                {m.concepto}
              </Text>
              <Text
                style={[
                  styles.tdCell,
                  styles.colTipo,
                  {
                    color: m.tipo === "INGRESO" ? "#16a34a" : "#dc2626",
                    fontFamily: "Helvetica-Bold",
                  },
                ]}
              >
                {m.tipo === "INGRESO" ? "Ingreso" : "Gasto"}
              </Text>
              <Text
                style={[
                  styles.tdCell,
                  styles.colMonto,
                  { color: m.tipo === "INGRESO" ? "#16a34a" : "#dc2626" },
                ]}
              >
                {centavosToSoles(m.monto)}
              </Text>
              <Text style={[styles.tdCell, styles.colSaldo]}>
                {centavosToSoles(m.saldoAcumulado)}
              </Text>
            </View>
          ))}

          {/* Total row */}
          <View style={[styles.tableRow, styles.tableRowTotal]}>
            <Text
              style={[
                styles.tdCellTotal,
                { width: "55%", textAlign: "left" },
              ]}
            >
              TOTALES DEL PERÍODO
            </Text>
            <Text style={[styles.tdCellTotal, styles.colTipo]}>—</Text>
            <Text style={[styles.tdCellTotal, styles.colMonto]}>
              {centavosToSoles(data.totalIngresos - data.totalGastos)}
            </Text>
            <Text style={[styles.tdCellTotal, styles.colSaldo]}>
              {centavosToSoles(data.saldoFinal)}
            </Text>
          </View>
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
