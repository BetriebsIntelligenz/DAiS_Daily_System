import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { ensureRolesSchema } from "@/lib/roles-schema";

export const dynamic = "force-dynamic";

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
    const user = await resolveUser(
      searchParams.get("userEmail"),
      searchParams.get("userName")
    );

    const db = prisma as any;
    const entries = await db.roleStateEntry.findMany({
      where: user ? { role: { userId: user.id } } : {},
      include: {
        role: { select: { id: true, name: true } },
        state: { select: { id: true, name: true } },
        program: { select: { id: true, code: true, name: true } }
      },
      orderBy: [{ createdAt: "desc" }],
      take: 800
    });

    const groupedByRole = new Map<
      string,
      {
        roleId: string;
        roleName: string;
        days: Map<string, Array<Record<string, unknown>>>;
      }
    >();

    for (const entry of entries) {
      const roleId = String(entry.roleId);
      const roleName = String(entry.role?.name ?? "Rolle");
      const dateKey = new Date(entry.createdAt).toISOString().slice(0, 10);
      if (!groupedByRole.has(roleId)) {
        groupedByRole.set(roleId, {
          roleId,
          roleName,
          days: new Map()
        });
      }
      const roleGroup = groupedByRole.get(roleId)!;
      if (!roleGroup.days.has(dateKey)) {
        roleGroup.days.set(dateKey, []);
      }

      roleGroup.days.get(dateKey)!.push({
        id: entry.id,
        roleId: entry.roleId,
        stateId: entry.stateId,
        score: entry.score,
        note: entry.note,
        createdAt: entry.createdAt,
        stateName: entry.state?.name ?? null,
        programId: entry.programId,
        programCode: entry.program?.code ?? null,
        programName: entry.program?.name ?? null
      });
    }

    const payload = Array.from(groupedByRole.values())
      .map((roleGroup) => ({
        roleId: roleGroup.roleId,
        roleName: roleGroup.roleName,
        days: Array.from(roleGroup.days.entries())
          .sort(([left], [right]) => right.localeCompare(left))
          .map(([date, dayEntries]) => ({
            date,
            entries: dayEntries
              .slice()
              .sort(
                (left, right) =>
                  new Date(String(left.createdAt)).getTime() -
                  new Date(String(right.createdAt)).getTime()
              )
          }))
      }))
      .sort((left, right) => left.roleName.localeCompare(right.roleName, "de-DE"));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Role state journal GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Rollen-State-Journal konnte nicht geladen werden.") },
      { status: 500 }
    );
  }
}
