-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GERENCIA', 'ADMINISTRADOR', 'CONTADOR', 'VENTAS');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('JURIDICA', 'NATURAL', 'IMMUNOTEC', 'FOUR_LIFE', 'RXH');

-- CreateEnum
CREATE TYPE "Regimen" AS ENUM ('MYPE', 'RER', 'REG');

-- CreateEnum
CREATE TYPE "EstadoPersona" AS ENUM ('ACTIVO', 'INACTIVO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "TipoContabilidad" AS ENUM ('MANUAL', 'COMPUTARIZADA');

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'COTIZADO', 'CONVERTIDO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "CategoriaServicio" AS ENUM ('MENSUAL', 'ANUAL', 'TRAMITE', 'ASESORIA', 'CONSTITUCION', 'REGULARIZACION', 'MODIF_ESTATUTO', 'OTROS');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('ACTIVO', 'COMPLETADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "EstadoCobranza" AS ENUM ('PENDIENTE', 'PARCIAL', 'COBRADO', 'INCOBRABLE');

-- CreateEnum
CREATE TYPE "Prioridad" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('ABIERTA', 'EN_PROGRESO', 'RESUELTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "TipoFinanza" AS ENUM ('INGRESO', 'EGRESO');

-- CreateEnum
CREATE TYPE "TipoCuenta" AS ENUM ('CORRIENTE', 'AHORROS', 'EFECTIVO', 'DIGITAL');

-- CreateEnum
CREATE TYPE "TipoCajaChica" AS ENUM ('INGRESO', 'GASTO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONTADOR',
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "dni" VARCHAR(8),
    "celular" TEXT NOT NULL,
    "email" TEXT,
    "regimen" "Regimen",
    "rubro" TEXT,
    "num_trabajadores" INTEGER,
    "estado" "EstadoLead" NOT NULL DEFAULT 'NUEVO',
    "notas" TEXT,
    "asignado_a_id" TEXT,
    "convertido_a_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "ruc" VARCHAR(11) NOT NULL,
    "tipo_persona" "TipoPersona" NOT NULL,
    "regimen" "Regimen" NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "representante_nombre" TEXT,
    "representante_dni" VARCHAR(8),
    "representante_telefono" TEXT,
    "clave_sol_usuario" TEXT,
    "clave_sol_clave" TEXT,
    "afp_usuario" TEXT,
    "afp_clave" TEXT,
    "detracciones" BOOLEAN NOT NULL DEFAULT false,
    "tipo_contabilidad" "TipoContabilidad" NOT NULL DEFAULT 'MANUAL',
    "partida_electronica" TEXT,
    "planilla" BOOLEAN NOT NULL DEFAULT false,
    "num_trabajadores" INTEGER,
    "estado" "EstadoPersona" NOT NULL DEFAULT 'ACTIVO',
    "contador_asignado_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_servicio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaServicio" NOT NULL,
    "requiere_periodo" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tipos_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "tipo_servicio_id" TEXT NOT NULL,
    "contador_id" TEXT NOT NULL,
    "periodo" VARCHAR(7),
    "base_imponible" INTEGER NOT NULL DEFAULT 0,
    "igv" INTEGER NOT NULL DEFAULT 0,
    "no_gravado" INTEGER NOT NULL DEFAULT 0,
    "total_imponible" INTEGER NOT NULL DEFAULT 0,
    "honorarios" INTEGER NOT NULL DEFAULT 0,
    "descuento" INTEGER NOT NULL DEFAULT 0,
    "precio_final" INTEGER NOT NULL DEFAULT 0,
    "monto_cobrado" INTEGER NOT NULL DEFAULT 0,
    "monto_restante" INTEGER NOT NULL DEFAULT 0,
    "estado_cobranza" "EstadoCobranza" NOT NULL DEFAULT 'PENDIENTE',
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "declaracion_anual_detalles" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "declaracion_anual_detalles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "equipo_id" TEXT NOT NULL,
    "hora_inicio" TIMESTAMP(3) NOT NULL,
    "hora_fin" TIMESTAMP(3),
    "duracion_minutos" INTEGER,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "contador_id" TEXT NOT NULL,
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "detalle_financiero" TEXT,
    "estado" "EstadoIncidencia" NOT NULL DEFAULT 'ABIERTA',
    "fecha_limite" TIMESTAMP(3),
    "periodo" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "incidencia_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libros" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "tipo_libro" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "constancia_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "libros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuentas_bancarias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "tipo" "TipoCuenta" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cuentas_bancarias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finanzas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoFinanza" NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "numero_operacion" TEXT,
    "cuenta_id" TEXT NOT NULL,
    "servicio_id" TEXT,
    "categoria_gasto" TEXT,
    "comprobante_url" TEXT,
    "notas" TEXT,
    "creado_por_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finanzas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caja_chica" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCajaChica" NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "comprobante_url" TEXT,
    "saldo_acumulado" INTEGER NOT NULL,
    "creado_por_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caja_chica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "metadata" JSONB,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertido_a_id_key" ON "leads"("convertido_a_id");

-- CreateIndex
CREATE INDEX "leads_estado_idx" ON "leads"("estado");

-- CreateIndex
CREATE INDEX "leads_asignado_a_id_idx" ON "leads"("asignado_a_id");

-- CreateIndex
CREATE UNIQUE INDEX "personas_ruc_key" ON "personas"("ruc");

-- CreateIndex
CREATE INDEX "personas_contador_asignado_id_idx" ON "personas"("contador_asignado_id");

-- CreateIndex
CREATE INDEX "personas_estado_idx" ON "personas"("estado");

-- CreateIndex
CREATE INDEX "personas_ruc_idx" ON "personas"("ruc");

-- CreateIndex
CREATE INDEX "personas_tipo_persona_idx" ON "personas"("tipo_persona");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_servicio_nombre_key" ON "tipos_servicio"("nombre");

-- CreateIndex
CREATE INDEX "servicios_persona_id_periodo_idx" ON "servicios"("persona_id", "periodo");

-- CreateIndex
CREATE INDEX "servicios_contador_id_estado_idx" ON "servicios"("contador_id", "estado");

-- CreateIndex
CREATE INDEX "servicios_tipo_servicio_id_periodo_idx" ON "servicios"("tipo_servicio_id", "periodo");

-- CreateIndex
CREATE INDEX "servicios_estado_cobranza_idx" ON "servicios"("estado_cobranza");

-- CreateIndex
CREATE UNIQUE INDEX "declaracion_anual_detalles_servicio_id_mes_key" ON "declaracion_anual_detalles"("servicio_id", "mes");

-- CreateIndex
CREATE INDEX "actividades_servicio_id_idx" ON "actividades"("servicio_id");

-- CreateIndex
CREATE INDEX "actividades_equipo_id_idx" ON "actividades"("equipo_id");

-- CreateIndex
CREATE INDEX "incidencias_persona_id_estado_idx" ON "incidencias"("persona_id", "estado");

-- CreateIndex
CREATE INDEX "incidencias_contador_id_idx" ON "incidencias"("contador_id");

-- CreateIndex
CREATE INDEX "attachments_incidencia_id_idx" ON "attachments"("incidencia_id");

-- CreateIndex
CREATE INDEX "libros_persona_id_anio_idx" ON "libros"("persona_id", "anio");

-- CreateIndex
CREATE UNIQUE INDEX "libros_persona_id_tipo_libro_anio_mes_key" ON "libros"("persona_id", "tipo_libro", "anio", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "cuentas_bancarias_nombre_key" ON "cuentas_bancarias"("nombre");

-- CreateIndex
CREATE INDEX "finanzas_fecha_idx" ON "finanzas"("fecha");

-- CreateIndex
CREATE INDEX "finanzas_tipo_fecha_idx" ON "finanzas"("tipo", "fecha");

-- CreateIndex
CREATE INDEX "finanzas_cuenta_id_fecha_idx" ON "finanzas"("cuenta_id", "fecha");

-- CreateIndex
CREATE INDEX "finanzas_servicio_id_idx" ON "finanzas"("servicio_id");

-- CreateIndex
CREATE INDEX "caja_chica_fecha_idx" ON "caja_chica"("fecha");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_entidad_id_idx" ON "audit_logs"("entidad", "entidad_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_asignado_a_id_fkey" FOREIGN KEY ("asignado_a_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_convertido_a_id_fkey" FOREIGN KEY ("convertido_a_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_contador_asignado_id_fkey" FOREIGN KEY ("contador_asignado_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_tipo_servicio_id_fkey" FOREIGN KEY ("tipo_servicio_id") REFERENCES "tipos_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_contador_id_fkey" FOREIGN KEY ("contador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaracion_anual_detalles" ADD CONSTRAINT "declaracion_anual_detalles_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_contador_id_fkey" FOREIGN KEY ("contador_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_incidencia_id_fkey" FOREIGN KEY ("incidencia_id") REFERENCES "incidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libros" ADD CONSTRAINT "libros_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finanzas" ADD CONSTRAINT "finanzas_cuenta_id_fkey" FOREIGN KEY ("cuenta_id") REFERENCES "cuentas_bancarias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finanzas" ADD CONSTRAINT "finanzas_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finanzas" ADD CONSTRAINT "finanzas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caja_chica" ADD CONSTRAINT "caja_chica_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
