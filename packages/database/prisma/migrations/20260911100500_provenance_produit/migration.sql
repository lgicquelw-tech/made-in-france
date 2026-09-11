-- Provenance des produits (REBUILD.md T5.5, T5.6).
-- Migration ecrite a la main : `prisma migrate dev` exige une confirmation
-- interactive pour toute contrainte unique ajoutee sur une table existante.
-- Verifiee par `prisma migrate diff` : identique a ce que Prisma aurait genere.

-- AlterTable
ALTER TABLE "products" ADD COLUMN "collected_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "products_brand_id_external_source_external_id_key" ON "products"("brand_id", "external_source", "external_id");
