-- CreateIndex
CREATE INDEX "brands_name_idx" ON "brands" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products" USING GIN ("name" gin_trgm_ops);
