import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

interface RouteContext {
  params: { id: string };
}

interface RequirementLogRow {
  id: string;
  requirementId: string;
  userId: string | null;
  content: string;
  createdAt: Date;
}

let requirementLogTableReady: Promise<void> | null = null;

async function ensureRequirementLogTable() {
  if (!requirementLogTableReady) {
    requirementLogTableReady = (async () => {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RequirementLog" (
          "id" TEXT NOT NULL,
          "requirementId" TEXT NOT NULL,
          "userId" TEXT,
          "content" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RequirementLog_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "RequirementLog_requirementId_fkey"
            FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id")
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RequirementLog_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE
        )
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "RequirementLog_requirementId_idx"
        ON "RequirementLog"("requirementId")
      `;
    })().catch((error) => {
      requirementLogTableReady = null;
      throw error;
    });
  }
  return requirementLogTableReady;
}

async function fetchLogs(requirementId: string) {
  await ensureRequirementLogTable();
  return prisma.$queryRaw<RequirementLogRow[]>`
    SELECT "id", "requirementId", "userId", "content", "createdAt"
    FROM "RequirementLog"
    WHERE "requirementId" = ${requirementId}
    ORDER BY "createdAt" DESC
  `;
}

async function insertLog(entry: {
  requirementId: string;
  userId: string;
  content: string;
}) {
  await ensureRequirementLogTable();
  const id = randomUUID();
  const [log] = await prisma.$queryRaw<RequirementLogRow[]>`
    INSERT INTO "RequirementLog" ("id", "requirementId", "userId", "content")
    VALUES (${id}, ${entry.requirementId}, ${entry.userId}, ${entry.content})
    RETURNING "id", "requirementId", "userId", "content", "createdAt"
  `;
  if (!log) {
    throw new Error("Log insert failed");
  }
  return log;
}

async function resolveRequirementForUser(id: string, email?: string) {
  const user = await getOrCreateDemoUser({ email });
  const requirement = await prisma.requirement.findFirst({
    where: { id, userId: user.id }
  });
  return { user, requirement };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;

  try {
    const { requirement } = await resolveRequirementForUser(params.id, email);
    if (!requirement) {
      return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });
    }

    const logs = await fetchLogs(requirement.id);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Logs konnten nicht geladen werden", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { error: "Inhalt für Log-Eintrag fehlt." },
        { status: 400 }
      );
    }

    const email = body.email ?? undefined;
    const { user, requirement } = await resolveRequirementForUser(params.id, email);

    if (!requirement) {
      return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });
    }

    const log = await insertLog({
      requirementId: requirement.id,
      userId: user.id,
      content
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Log konnte nicht gespeichert werden", error);
    return NextResponse.json({ error: "Log konnte nicht angelegt werden." }, { status: 500 });
  }
}
