-- CreateTable
CREATE TABLE "RoleProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "attributes" TEXT,
    "avatarSeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleProgramLink" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleProgramLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleEmotionEntry" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleEmotionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleProfile_userId_idx" ON "RoleProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleProgramLink_roleId_programId_key" ON "RoleProgramLink"("roleId", "programId");

-- CreateIndex
CREATE INDEX "RoleProgramLink_programId_idx" ON "RoleProgramLink"("programId");

-- CreateIndex
CREATE INDEX "RoleEmotionEntry_roleId_createdAt_idx" ON "RoleEmotionEntry"("roleId", "createdAt");

-- AddForeignKey
ALTER TABLE "RoleProfile" ADD CONSTRAINT "RoleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleProgramLink" ADD CONSTRAINT "RoleProgramLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleProgramLink" ADD CONSTRAINT "RoleProgramLink_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleEmotionEntry" ADD CONSTRAINT "RoleEmotionEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
