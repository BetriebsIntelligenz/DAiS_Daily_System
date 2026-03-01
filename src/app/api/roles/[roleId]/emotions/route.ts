import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { ensureRolesSchema } from "@/lib/roles-schema";

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
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

    const entries = await db.roleEmotionEntry.findMany({
      where: { roleId },
      orderBy: { createdAt: "asc" },
      take: 365
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Role emotions GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Emotionseinträge konnten nicht geladen werden.") },
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

    const score = Math.round(Number(body.score ?? 0));
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      return NextResponse.json(
        { error: "Score muss zwischen 1 und 10 liegen." },
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

    const entry = await db.roleEmotionEntry.create({
      data: {
        roleId,
        score,
        note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Role emotions POST failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Emotionseintrag konnte nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}
