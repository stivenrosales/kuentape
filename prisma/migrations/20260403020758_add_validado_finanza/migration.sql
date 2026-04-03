-- AlterTable
ALTER TABLE "finanzas" ADD COLUMN     "validado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validado_at" TIMESTAMP(3),
ADD COLUMN     "validado_por_id" TEXT;
