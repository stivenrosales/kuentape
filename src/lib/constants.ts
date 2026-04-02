// Roles del sistema
export const ROLE_LABELS: Record<string, string> = {
  GERENCIA: "Gerencia",
  ADMINISTRADOR: "Administrador",
  CONTADOR: "Contador",
  VENTAS: "Ventas",
};

// Tipos de persona
export const TIPO_PERSONA_LABELS: Record<string, string> = {
  JURIDICA: "Persona Jurídica",
  NATURAL: "Persona Natural",
  IMMUNOTEC: "Immunotec",
  FOUR_LIFE: "Four Life",
  RXH: "RXH",
};

// Categorías de servicio
export const CATEGORIA_SERVICIO_LABELS: Record<string, string> = {
  MENSUAL: "Mensual",
  ANUAL: "Anual",
  TRAMITE: "Trámite",
  ASESORIA: "Asesoría",
  CONSTITUCION: "Constitución",
  REGULARIZACION: "Regularización",
  MODIF_ESTATUTO: "Modificación de Estatuto",
  OTROS: "Otros",
};

// Categorías de gastos
export const CATEGORIAS_GASTO = [
  "Alquiler",
  "Planilla",
  "Servicios",
  "SUNARP",
  "Caja Chica",
  "Otros",
] as const;

export type CategoriaGasto = (typeof CATEGORIAS_GASTO)[number];

// Tipos de libro contable
export const TIPOS_LIBRO = [
  "Libro Diario Formato Simplificado",
  "Libro Mayor",
  "Registro de Compras",
  "Registro de Ventas",
  "Libro de Caja y Bancos",
  "Libro de Activos Fijos",
  "Libro de Inventarios y Balances",
] as const;

export type TipoLibro = (typeof TIPOS_LIBRO)[number];

// Meses del año en español
export const MESES_ESPANOL = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
] as const;

export type MesEspanol = (typeof MESES_ESPANOL)[number];

// Tipos de cuenta bancaria
export const TIPO_CUENTA_LABELS: Record<string, string> = {
  CORRIENTE: "Cuenta Corriente",
  AHORROS: "Cuenta de Ahorros",
  EFECTIVO: "Efectivo",
  DIGITAL: "Cuenta Digital",
};

// Régimen tributario
export const REGIMEN_LABELS: Record<string, string> = {
  MYPE: "Régimen MYPE Tributario",
  RER: "Régimen Especial de Renta",
  REG: "Régimen General",
};

// Estado de persona
export const ESTADO_PERSONA_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  ARCHIVADO: "Archivado",
};

// Estado de lead
export const ESTADO_LEAD_LABELS: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  COTIZADO: "Cotizado",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
};

// Estado de servicio
export const ESTADO_SERVICIO_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  COMPLETADO: "Completado",
  ARCHIVADO: "Archivado",
};

// Estado de cobranza
export const ESTADO_COBRANZA_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  COBRADO: "Cobrado",
  INCOBRABLE: "Incobrable",
};

// Prioridad
export const PRIORIDAD_LABELS: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

// Estado de incidencia
export const ESTADO_INCIDENCIA_LABELS: Record<string, string> = {
  ABIERTA: "Abierta",
  EN_PROGRESO: "En Progreso",
  RESUELTA: "Resuelta",
  CERRADA: "Cerrada",
};

// Tipo de finanza
export const TIPO_FINANZA_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  EGRESO: "Egreso",
};

// Tipo de caja chica
export const TIPO_CAJA_CHICA_LABELS: Record<string, string> = {
  INGRESO: "Ingreso",
  GASTO: "Gasto",
};

// IGV rate (18%)
export const IGV_RATE = 0.18;

// Timezone
export const APP_TIMEZONE = "America/Lima";

// Locale
export const APP_LOCALE = "es-PE";
