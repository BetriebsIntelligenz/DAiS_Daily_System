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

export async function GET(request: Request) {
  try {
    await ensureRolesSchema();

    const { searchParams } = new URL(request.url);
    const programId = String(searchParams.get("programId") ?? "").trim();

    if (!programId) {
      return NextResponse.json(
        { error: "programId ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      searchParams.get("userEmail"),
      searchParams.get("userName")
    );

    const db = prisma as any;
    const links = await db.roleProgramLink.findMany({
      where: {
        programId,
        ...(user ? { role: { userId: user.id } } : {})
      },
      select: { roleId: true }
    });

    return NextResponse.json({ roleIds: links.map((entry: { roleId: string }) => entry.roleId) });
  } catch (error) {
    console.error("Role links GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rollen-Verknüpfungen konnten nicht geladen werden.") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureRolesSchema();

    const body = toRecord(await request.json());
    const programId = String(body.programId ?? "").trim();
    const requestedRoleIds = Array.isArray(body.roleIds)
      ? body.roleIds.map((entry) => String(entry)).filter(Boolean)
      : [];

    if (!programId) {
      return NextResponse.json(
        { error: "programId ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const program = await db.program.findUnique({ where: { id: programId } });
    if (!program) {
      return NextResponse.json(
        { error: "Card nicht gefunden." },
        { status: 404 }
      );
    }

    const ownedRoles = await db.roleProfile.findMany({
      where: user ? { userId: user.id } : {},
      select: { id: true }
    });
    const ownedRoleIds = ownedRoles.map((entry: { id: string }) => entry.id);
    const validRoleIds = requestedRoleIds.filter((roleId) => ownedRoleIds.includes(roleId));

    await db.$transaction(async (tx: any) => {
      if (ownedRoleIds.length > 0) {
        await tx.roleProgramLink.deleteMany({
          where: {
            programId,
            roleId: { in: ownedRoleIds }
          }
        });
      }

      if (validRoleIds.length > 0) {
        await tx.roleProgramLink.createMany({
          data: validRoleIds.map((roleId) => ({ roleId, programId })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({ roleIds: validRoleIds }, { status: 200 });
  } catch (error) {
    console.error("Role links PATCH failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rollen-Verknüpfungen konnten nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}
