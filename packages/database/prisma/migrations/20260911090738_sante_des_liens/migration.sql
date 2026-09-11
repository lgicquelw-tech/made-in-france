-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "website_dead_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "buy_url_dead_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "link_checks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "last_status" INTEGER,
    "last_verdict" TEXT NOT NULL,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "first_failed_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "link_checks_url_key" ON "link_checks"("url");

-- CreateIndex
CREATE INDEX "link_checks_usage_idx" ON "link_checks"("usage");

-- CreateIndex
CREATE INDEX "link_checks_last_verdict_idx" ON "link_checks"("last_verdict");
