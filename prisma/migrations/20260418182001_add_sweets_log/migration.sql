-- CreateTable
CREATE TABLE "SweetsLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "consumed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SweetsLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SweetsLog_date_key" ON "SweetsLog"("date");

-- CreateIndex
CREATE INDEX "SweetsLog_date_idx" ON "SweetsLog"("date");
