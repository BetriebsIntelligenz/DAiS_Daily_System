-- CreateTable
CREATE TABLE "RoleState" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minValue" INTEGER NOT NULL DEFAULT 1,
    "maxValue" INTEGER NOT NULL DEFAULT 10,
    "step" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleStateEntry" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "programId" TEXT,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleStateEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleState_roleId_order_idx" ON "RoleState"("roleId", "order");

-- CreateIndex
CREATE INDEX "RoleStateEntry_roleId_createdAt_idx" ON "RoleStateEntry"("roleId", "createdAt");

-- CreateIndex
CREATE INDEX "RoleStateEntry_stateId_createdAt_idx" ON "RoleStateEntry"("stateId", "createdAt");

-- CreateIndex
CREATE INDEX "RoleStateEntry_programId_idx" ON "RoleStateEntry"("programId");

-- AddForeignKey
ALTER TABLE "RoleState" ADD CONSTRAINT "RoleState_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleStateEntry" ADD CONSTRAINT "RoleStateEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleStateEntry" ADD CONSTRAINT "RoleStateEntry_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "RoleState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleStateEntry" ADD CONSTRAINT "RoleStateEntry_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
