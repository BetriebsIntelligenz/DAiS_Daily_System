-- CreateTable
CREATE TABLE "PerformanceChecklistItem" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceChecklistItem_pkey" PRIMARY KEY ("id")
);
