CREATE TYPE "PhotoCategory" AS ENUM ('FRONT', 'SIDE', 'BACK');

CREATE TABLE "BodyPhoto" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" "PhotoCategory" NOT NULL DEFAULT 'FRONT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BodyPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BodyPhoto_date_idx" ON "BodyPhoto"("date");
CREATE INDEX "BodyPhoto_category_idx" ON "BodyPhoto"("category");
