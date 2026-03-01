import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { ensureRolesSchema } from "@/lib/roles-schema";

const DEFAULT_ROLE_STATES = [
  "LOVE",
  "LIGHT",
  "HERO",
  "LEADER",
  "INNOVATOR",
  "POWER HUMAN",
  "IQ SOURCE"
];

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

function mapRolePayload(role: any) {
  const programs = Array.isArray(role.programs) ? role.programs : [];
  const states = Array.isArray(role.states) ? role.states : [];

  return {
    id: role.id,
    name: role.name,
    goal: role.goal,
    description: role.description,
    notes: role.notes,
    attributes: role.attributes,
    avatarSeed: role.avatarSeed,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    linkedProgramIds: programs.map((entry: any) => entry.programId),
    linkedPrograms: programs.map((entry: any) => ({
      id: entry.program.id,
      slug: entry.program.slug,
      code: entry.program.code,
      name: entry.program.name,
      summary: entry.program.summary,
      category: entry.program.category
    })),
    states: states.map((entry: any) => ({
      id: entry.id,
      roleId: entry.roleId,
      name: entry.name,
      minValue: entry.minValue,
      maxValue: entry.maxValue,
      step: entry.step,
      order: entry.order,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    }))
  };
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

async function loadRoleById(roleId: string) {
  const db = prisma as any;
  const role = await db.roleProfile.findUnique({
    where: { id: roleId },
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
      },
      states: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!role) {
    return null;
  }

  return mapRolePayload(role);
}

export async function GET(request: Request) {
  try {
    await ensureRolesSchema();

    const { searchParams } = new URL(request.url);
    const user = await resolveUser(
      searchParams.get("userEmail"),
      searchParams.get("userName")
    );

    const db = prisma as any;
    const roles = await db.roleProfile.findMany({
      where: user ? { userId: user.id } : {},
      orderBy: { updatedAt: "desc" },
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
        },
        states: {
          orderBy: [{ order: "asc" }, { createdAt: "asc" }]
        }
      }
    });

    return NextResponse.json(roles.map(mapRolePayload));
  } catch (error) {
    console.error("Roles GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rollen konnten nicht geladen werden.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureRolesSchema();

    const body = toRecord(await request.json());
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Rollenname ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const created = await db.roleProfile.create({
      data: {
        userId: user?.id ?? null,
        name,
        goal: typeof body.goal === "string" ? body.goal : null,
        description: typeof body.description === "string" ? body.description : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        attributes: typeof body.attributes === "string" ? body.attributes : null,
        avatarSeed:
          typeof body.avatarSeed === "string" && body.avatarSeed.trim()
            ? body.avatarSeed.trim()
            : name,
        states: {
          create: DEFAULT_ROLE_STATES.map((stateName, index) => ({
            name: stateName,
            minValue: 1,
            maxValue: 10,
            step: 1,
            order: index + 1
          }))
        }
      }
    });

    const payload = await loadRoleById(created.id);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Roles POST failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rolle konnte nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureRolesSchema();

    const body = toRecord(await request.json());
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Rollen-ID ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const existing = await db.roleProfile.findFirst({
      where: user ? { id, userId: user.id } : { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Rolle nicht gefunden." },
        { status: 404 }
      );
    }

    const name = String(body.name ?? existing.name ?? "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "Rollenname ist erforderlich." },
        { status: 400 }
      );
    }

    await db.roleProfile.update({
      where: { id },
      data: {
        name,
        goal: typeof body.goal === "string" ? body.goal : null,
        description: typeof body.description === "string" ? body.description : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        attributes: typeof body.attributes === "string" ? body.attributes : null,
        avatarSeed:
          typeof body.avatarSeed === "string" && body.avatarSeed.trim()
            ? body.avatarSeed.trim()
            : existing.avatarSeed ?? name
      }
    });

    const payload = await loadRoleById(id);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Roles PUT failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rolle konnte nicht aktualisiert werden.") },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureRolesSchema();

    const body = toRecord(await request.json().catch(() => ({})));
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json(
        { error: "Rollen-ID ist erforderlich." },
        { status: 400 }
      );
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const existing = await db.roleProfile.findFirst({
      where: user ? { id, userId: user.id } : { id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Rolle nicht gefunden." },
        { status: 404 }
      );
    }

    await db.roleProfile.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Roles DELETE failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rolle konnte nicht gelöscht werden.") },
      { status: 500 }
    );
  }
}
