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

function toSafeInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
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

    const states = await db.roleState.findMany({
      where: { roleId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }]
    });

    return NextResponse.json(states);
  } catch (error) {
    console.error("Role states GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Role-States konnten nicht geladen werden.") },
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
    const name = String(body.name ?? "").trim();
    const minValue = toSafeInt(body.minValue, 1);
    const maxValue = toSafeInt(body.maxValue, 10);
    const step = Math.max(1, toSafeInt(body.step, 1));
    const order = Math.max(0, toSafeInt(body.order, 0));

    if (!name) {
      return NextResponse.json({ error: "State-Name ist erforderlich." }, { status: 400 });
    }
    if (minValue >= maxValue) {
      return NextResponse.json(
        { error: "Min-Wert muss kleiner als Max-Wert sein." },
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

    const state = await db.roleState.create({
      data: {
        roleId,
        name,
        minValue,
        maxValue,
        step,
        order
      }
    });

    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error("Role states POST failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "State konnte nicht erstellt werden.") },
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
    const stateId = String(body.stateId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const minValue = toSafeInt(body.minValue, 1);
    const maxValue = toSafeInt(body.maxValue, 10);
    const step = Math.max(1, toSafeInt(body.step, 1));
    const order = Math.max(0, toSafeInt(body.order, 0));

    if (!stateId) {
      return NextResponse.json({ error: "stateId ist erforderlich." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "State-Name ist erforderlich." }, { status: 400 });
    }
    if (minValue >= maxValue) {
      return NextResponse.json(
        { error: "Min-Wert muss kleiner als Max-Wert sein." },
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

    const existing = await db.roleState.findFirst({
      where: { id: stateId, roleId }
    });
    if (!existing) {
      return NextResponse.json({ error: "State nicht gefunden." }, { status: 404 });
    }

    const updated = await db.roleState.update({
      where: { id: stateId },
      data: {
        name,
        minValue,
        maxValue,
        step,
        order
      }
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Role states PUT failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "State konnte nicht aktualisiert werden.") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { roleId: string } }
) {
  try {
    await ensureRolesSchema();

    const roleId = String(context.params.roleId ?? "").trim();
    const body = toRecord(await request.json().catch(() => ({})));
    const stateId = String(body.stateId ?? "").trim();

    if (!stateId) {
      return NextResponse.json({ error: "stateId ist erforderlich." }, { status: 400 });
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

    const existing = await db.roleState.findFirst({
      where: { id: stateId, roleId }
    });
    if (!existing) {
      return NextResponse.json({ error: "State nicht gefunden." }, { status: 404 });
    }

    await db.roleState.delete({ where: { id: stateId } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Role states DELETE failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "State konnte nicht gelöscht werden.") },
      { status: 500 }
    );
  }
}
