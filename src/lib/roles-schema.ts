import { prisma } from "@/lib/prisma";

let rolesSchemaReady = false;
let rolesSchemaInitPromise: Promise<void> | null = null;

export async function ensureRolesSchema() {
  if (rolesSchemaReady) {
    return;
  }

  if (!rolesSchemaInitPromise) {
    rolesSchemaInitPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoleProfile" (
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
          CONSTRAINT "RoleProfile_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RoleProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoleProgramLink" (
          "id" TEXT NOT NULL,
          "roleId" TEXT NOT NULL,
          "programId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RoleProgramLink_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RoleProgramLink_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RoleProgramLink_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RoleProgramLink_roleId_programId_key" UNIQUE ("roleId", "programId")
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoleEmotionEntry" (
          "id" TEXT NOT NULL,
          "roleId" TEXT NOT NULL,
          "score" INTEGER NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RoleEmotionEntry_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RoleEmotionEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoleState" (
          "id" TEXT NOT NULL,
          "roleId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "minValue" INTEGER NOT NULL DEFAULT 1,
          "maxValue" INTEGER NOT NULL DEFAULT 10,
          "step" INTEGER NOT NULL DEFAULT 1,
          "order" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "RoleState_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RoleState_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RoleStateEntry" (
          "id" TEXT NOT NULL,
          "roleId" TEXT NOT NULL,
          "stateId" TEXT NOT NULL,
          "programId" TEXT,
          "score" INTEGER NOT NULL,
          "note" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RoleStateEntry_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RoleStateEntry_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RoleStateEntry_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "RoleState"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RoleStateEntry_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE
        )
      `);

      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleProfile_userId_idx" ON "RoleProfile"("userId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleProgramLink_programId_idx" ON "RoleProgramLink"("programId")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleEmotionEntry_roleId_createdAt_idx" ON "RoleEmotionEntry"("roleId", "createdAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleState_roleId_order_idx" ON "RoleState"("roleId", "order")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleStateEntry_roleId_createdAt_idx" ON "RoleStateEntry"("roleId", "createdAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleStateEntry_stateId_createdAt_idx" ON "RoleStateEntry"("stateId", "createdAt")`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "RoleStateEntry_programId_idx" ON "RoleStateEntry"("programId")`
      );

      rolesSchemaReady = true;
    })().catch((error) => {
      rolesSchemaInitPromise = null;
      throw error;
    });
  }

  await rolesSchemaInitPromise;
}
