-- CreateEnum
CREATE TYPE "EstadoTrabajo" AS ENUM ('POR_DECLARAR', 'DECLARADO', 'POR_COBRAR', 'COBRADO', 'ARCHIVADO');

-- AlterTable
ALTER TABLE "servicios" ADD COLUMN     "estado_trabajo" "EstadoTrabajo" NOT NULL DEFAULT 'POR_DECLARAR';
