-- CreateTable
CREATE TABLE "MindMeditationFlow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MindMeditationFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindMeditationStep" (
    "id" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MindMeditationStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MindMeditationStep_flowId_order_idx" ON "MindMeditationStep"("flowId", "order");

-- AddForeignKey
ALTER TABLE "MindMeditationStep" ADD CONSTRAINT "MindMeditationStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "MindMeditationFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
