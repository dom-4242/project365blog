-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heightCm" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "targetSteps" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);
