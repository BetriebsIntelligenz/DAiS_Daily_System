-- CreateTable MindReadingBook
CREATE TABLE "MindReadingBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MindReadingBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable MindReadingLog
CREATE TABLE "MindReadingLog" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "userId" TEXT,
    "pages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MindReadingLog_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "MindReadingLog_createdAt_idx" ON "MindReadingLog"("createdAt");
CREATE INDEX "MindReadingLog_bookId_idx" ON "MindReadingLog"("bookId");

-- Foreign keys
ALTER TABLE "MindReadingLog"
  ADD CONSTRAINT "MindReadingLog_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "MindReadingBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MindReadingLog"
  ADD CONSTRAINT "MindReadingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
