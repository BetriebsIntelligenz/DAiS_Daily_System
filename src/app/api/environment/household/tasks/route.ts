import { NextResponse } from "next/server";
import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  fallbackCreateTask,
  fallbackDeleteTask,
  fallbackReorderTasks,
  fallbackUpdateTask
} from "@/server/household-fallback-store";

const MIGRATION_HINT =
  "Household Tabellen fehlen. Bitte `prisma migrate deploy --schema src/pages/schema.prisma` (siehe .ssh/Konzept/Anleitungen/DB_Integration_VPS_Migration.md) ausführen.";
const FALLBACK_HEADERS = {
  "x-dais-migration-hint": MIGRATION_HINT,
  "x-dais-household-mode": "fallback"
};

class HouseholdTablesUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseholdTablesUnavailableError";
  }
}

function getTaskDelegate() {
  const delegate = (prisma as PrismaClient & { householdTask?: Prisma.HouseholdTaskDelegate<undefined> })
    .householdTask;
  if (!delegate || typeof delegate.findMany !== "function") {
    throw new HouseholdTablesUnavailableError(MIGRATION_HINT);
  }
  return delegate;
}

function isMissingHouseholdTables(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { code, message } = error as { code?: string; message?: string };
  if (code && ["P2010", "P2013", "P2021", "P2022"].includes(code)) {
    return true;
  }
  if (typeof message === "string") {
    const lower = message.toLowerCase();
    if (lower.includes("does not exist") && lower.includes("household")) {
      return true;
    }
    if (lower.includes("relation") && lower.includes("household")) {
      return true;
    }
  }
  return false;
}

export async function POST(request: Request) {
  const body = await request.json();
  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label) {
    return NextResponse.json({ error: "Label erforderlich." }, { status: 400 });
  }

  try {
    const taskClient = getTaskDelegate();
    const orderAggregate = await taskClient.aggregate({
      _max: { order: true }
    });
    const order = (orderAggregate._max.order ?? -1) + 1;

    const task = await taskClient.create({
      data: { label, order }
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      const task = await fallbackCreateTask(label);
      return NextResponse.json(task, { status: 201, headers: FALLBACK_HEADERS });
    }
    console.error("Household Task POST failed", error);
    return NextResponse.json({ error: "Task konnte nicht gespeichert werden." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Task ID erforderlich." }, { status: 400 });
  }

  const data: { label?: string; active?: boolean } = {};
  if (typeof body.label === "string") {
    const label = body.label.trim();
    if (label.length === 0) {
      return NextResponse.json({ error: "Label darf nicht leer sein." }, { status: 400 });
    }
    data.label = label;
  }
  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  try {
    const taskClient = getTaskDelegate();
    const task = await taskClient.update({
      where: { id },
      data
    });
    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      const task = await fallbackUpdateTask(id, data);
      return NextResponse.json(task, { headers: FALLBACK_HEADERS });
    }
    console.error("Household Task update failed", error);
    return NextResponse.json({ error: "Task konnte nicht aktualisiert werden." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const order: string[] = Array.isArray(body.order) ? body.order : [];
  try {
    const taskClient = getTaskDelegate();
    await prisma.$transaction(
      order.map((taskId, index) =>
        taskClient.update({
          where: { id: taskId },
          data: { order: index }
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      await fallbackReorderTasks(order);
      return NextResponse.json({ success: true }, { headers: FALLBACK_HEADERS });
    }
    console.error("Household Task reorder failed", error);
    return NextResponse.json({ error: "Reihenfolge konnte nicht gespeichert werden." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Task ID erforderlich." }, { status: 400 });
  }
  try {
    await getTaskDelegate().delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      await fallbackDeleteTask(id);
      return NextResponse.json({ success: true }, { headers: FALLBACK_HEADERS });
    }
    console.error("Household Task delete failed", error);
    return NextResponse.json({ error: "Task konnte nicht gelöscht werden." }, { status: 500 });
  }
}
