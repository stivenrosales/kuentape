-- AlterTable
ALTER TABLE "caja_chica" ADD COLUMN "categoria_gasto" TEXT;
ALTER TABLE "caja_chica" ADD COLUMN "finanza_vinculada_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "caja_chica_finanza_vinculada_id_key" ON "caja_chica"("finanza_vinculada_id");
