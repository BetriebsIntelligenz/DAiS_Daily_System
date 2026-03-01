import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { ensureRolesSchema } from "@/lib/roles-schema";

const ROLE_STATE_JOURNAL_ID = "journal-role-state-tracking";

interface RoleStateRecord {
  id: string;
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
  order: number;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

async function resolveUser(email?: string | null, name?: string | null) {
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  if (!normalizedEmail) {
    return null;
  }
  return getOrCreateDemoUser({
    email: normalizedEmail,
    name: typeof name === "string" && name.trim() ? name.trim() : undefined
  });
}

function toApiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("roleProfile") ||
    message.includes("roleProgramLink") ||
    message.includes("roleEmotionEntry") ||
    message.includes("roleState") ||
    message.includes("roleStateEntry")
  ) {
    return "Roles-Backend nicht initialisiert. Bitte Server neu starten.";
  }
  return fallback;
}

export async function GET(
  request: Request,
  context: { params: { roleId: string } }
) {
  try {
    await ensureRolesSchema();

    const roleId = String(context.params.roleId ?? "").trim();
    const { searchParams } = new URL(request.url);
    const user = await resolveUser(
      searchParams.get("userEmail"),
      searchParams.get("userName")
    );

    const db = prisma as any;
    const role = await db.roleProfile.findFirst({
      where: user ? { id: roleId, userId: user.id } : { id: roleId }
    });

    if (!role) {
      return NextResponse.json({ error: "Rolle nicht gefunden." }, { status: 404 });
    }

    const entries = await db.roleStateEntry.findMany({
      where: { roleId },
      include: {
        state: true,
        program: {
          select: { id: true, code: true, name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 300
    });

    return NextResponse.json(
      entries.map((entry: any) => ({
        id: entry.id,
        roleId: entry.roleId,
        stateId: entry.stateId,
        programId: entry.programId,
        score: entry.score,
        note: entry.note,
        createdAt: entry.createdAt,
        roleName: role.name,
        stateName: entry.state?.name,
        programCode: entry.program?.code,
        programName: entry.program?.name
      }))
    );
  } catch (error) {
    console.error("Role state entries GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "State-Einträge konnten nicht geladen werden.") },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: { roleId: string } }
) {
  try {
    await ensureRolesSchema();

    const roleId = String(context.params.roleId ?? "").trim();
    const body = toRecord(await request.json());
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const programId =
      typeof body.programId === "string" && body.programId.trim()
        ? body.programId.trim()
        : null;

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Mindestens ein State-Entry ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const role = await db.roleProfile.findFirst({
      where: user ? { id: roleId, userId: user.id } : { id: roleId }
    });

    if (!role) {
      return NextResponse.json({ error: "Rolle nicht gefunden." }, { status: 404 });
    }

    const roleStates = (await db.roleState.findMany({
      where: { roleId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    })) as RoleStateRecord[];
    const roleStateMap = new Map<string, RoleStateRecord>(
      roleStates.map((state) => [state.id, state])
    );

    const normalizedEntries = entries
      .map((entry) => {
        const record = toRecord(entry);
        const stateId = String(record.stateId ?? "").trim();
        const state = roleStateMap.get(stateId);
        const score = Math.round(Number(record.score ?? NaN));
        if (!state || !Number.isFinite(score)) {
          return null;
        }
        if (score < state.minValue || score > state.maxValue) {
          return null;
        }
        return {
          stateId,
          score
        };
      })
      .filter((entry): entry is { stateId: string; score: number } => Boolean(entry));

    if (normalizedEntries.length === 0) {
      return NextResponse.json(
        { error: "Keine gültigen State-Werte übergeben." },
        { status: 400 }
      );
    }

    const program =
      programId != null
        ? await db.program.findUnique({
            where: { id: programId },
            select: { id: true, code: true, name: true }
          })
        : null;
    const safeProgramId = program?.id ?? null;
    const now = new Date();

    const inserted = await db.$transaction(async (tx: any) => {
      const createdEntries = [];
      for (const entry of normalizedEntries) {
        const created = await tx.roleStateEntry.create({
          data: {
            roleId,
            stateId: entry.stateId,
            score: entry.score,
            note: note || null,
            programId: safeProgramId,
            createdAt: now
          },
          include: {
            state: true
          }
        });
        createdEntries.push(created);
      }

      if (user) {
        const journal = await tx.journal.upsert({
          where: { id: ROLE_STATE_JOURNAL_ID },
          update: {},
          create: {
            id: ROLE_STATE_JOURNAL_ID,
            name: "Role State Tracking",
            type: "learn",
            userId: user.id
          }
        });

        const stateLines = createdEntries
          .map(
            (entry: any) =>
              `<li><strong>${escapeHtml(String(entry.state?.name ?? "State"))}</strong>: ${entry.score}</li>`
          )
          .join("");
        const cardLine =
          program != null
            ? `<p><strong>Card:</strong> ${escapeHtml(program.code)} - ${escapeHtml(program.name)}</p>`
            : "";
        const noteLine = note ? `<p><strong>Notiz:</strong> ${escapeHtml(note)}</p>` : "";
        const contentHtml =
          `<h3>Role State Tracking - ${escapeHtml(role.name)}</h3>` +
          cardLine +
          `<ul>${stateLines}</ul>` +
          noteLine;

        await tx.journalEntry.create({
          data: {
            journalId: journal.id,
            userId: user.id,
            contentHtml,
            createdAt: now
          }
        });
      }

      return createdEntries;
    });

    return NextResponse.json(
      inserted.map((entry: any) => ({
        id: entry.id,
        roleId: entry.roleId,
        stateId: entry.stateId,
        programId: entry.programId,
        score: entry.score,
        note: entry.note,
        createdAt: entry.createdAt,
        roleName: role.name,
        stateName: entry.state?.name ?? null,
        programCode: program?.code ?? null,
        programName: program?.name ?? null
      })),
      { status: 201 }
    );
  } catch (error) {
    console.error("Role state entries POST failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "State-Eintrag konnte nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}
