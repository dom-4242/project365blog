-- CreateTable
CREATE TABLE "MonthSummary" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "contentDe" TEXT NOT NULL,
    "contentEn" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthSummary_year_month_idx" ON "MonthSummary"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "MonthSummary_year_month_key" ON "MonthSummary"("year", "month");
