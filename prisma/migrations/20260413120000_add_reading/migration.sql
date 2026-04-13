CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "totalPages" INTEGER,
    "startDate" DATE,
    "endDate" DATE,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadingLog" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pagesRead" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Book_completed_idx" ON "Book"("completed");
CREATE UNIQUE INDEX "ReadingLog_date_bookId_key" ON "ReadingLog"("date", "bookId");
CREATE INDEX "ReadingLog_date_idx" ON "ReadingLog"("date");
CREATE INDEX "ReadingLog_bookId_idx" ON "ReadingLog"("bookId");

ALTER TABLE "ReadingLog" ADD CONSTRAINT "ReadingLog_bookId_fkey"
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;
