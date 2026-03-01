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
      where: user ? { id: roleId, userId: user.id } : { id: roleId },
      include: {
        programs: {
          include: {
            program: {
              select: {
                id: true,
                slug: true,
                code: true,
                name: true,
                summary: true,
                category: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!role) {
      return NextResponse.json({ error: "Rolle nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json({
      programIds: role.programs.map((entry: any) => entry.programId),
      linkedPrograms: role.programs.map((entry: any) => ({
        id: entry.program.id,
        slug: entry.program.slug,
        code: entry.program.code,
        name: entry.program.name,
        summary: entry.program.summary,
        category: entry.program.category
      }))
    });
  } catch (error) {
    console.error("Role cards GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Card-Verknüpfungen konnten nicht geladen werden.") },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { roleId: string } }
) {
  try {
    await ensureRolesSchema();

    const roleId = String(context.params.roleId ?? "").trim();
    const body = toRecord(await request.json());
    const requestedProgramIds = Array.isArray(body.programIds)
      ? body.programIds.map((entry) => String(entry)).filter(Boolean)
      : [];

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

    const programs =
      requestedProgramIds.length > 0
        ? await db.program.findMany({
            where: { id: { in: requestedProgramIds } },
            select: { id: true }
          })
        : [];
    const validProgramIds = programs.map((entry: { id: string }) => entry.id);

    await db.$transaction(async (tx: any) => {
      await tx.roleProgramLink.deleteMany({ where: { roleId } });
      if (validProgramIds.length > 0) {
        await tx.roleProgramLink.createMany({
          data: validProgramIds.map((programId: string) => ({ roleId, programId })),
          skipDuplicates: true
        });
      }
    });

    return NextResponse.json({ programIds: validProgramIds }, { status: 200 });
  } catch (error) {
    console.error("Role cards PUT failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Card-Verknüpfungen konnten nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}
