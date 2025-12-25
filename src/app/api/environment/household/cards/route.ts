import { NextResponse } from "next/server";
import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  fallbackCreateCard,
  fallbackDeleteCard,
  fallbackListCardsWithTasks,
  fallbackListTasks,
  fallbackUpdateCard,
  type CardWithTasks
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

type DelegateName = keyof PrismaClient;

function getPrismaDelegate<TDelegate>(name: DelegateName) {
  const candidate = (prisma as unknown as Record<string | symbol, unknown>)[name];
  if (!candidate || typeof (candidate as Record<string, unknown>).findMany !== "function") {
    throw new HouseholdTablesUnavailableError(MIGRATION_HINT);
  }
  return candidate as TDelegate;
}

function serializeCard(card: Awaited<ReturnType<typeof loadCards>>[number] | CardWithTasks) {
  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    weekday: card.weekday,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    tasks: card.tasks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((assignment) => ({
        id: assignment.id,
        order: assignment.order,
        taskId: assignment.taskId,
        task: assignment.task
      }))
  };
}

async function loadCards() {
  const cardClient = getPrismaDelegate<Prisma.HouseholdCardDelegate>("householdCard");
  return cardClient.findMany({
    orderBy: [{ weekday: "asc" }, { title: "asc" }],
    include: {
      tasks: {
        include: { task: true },
        orderBy: { order: "asc" }
      }
    }
  });
}

async function syncCardTasks(cardId: string, taskIds: string[]) {
  const uniqueTaskIds = [...new Set(taskIds)];
  if (uniqueTaskIds.length === 0) {
    await getPrismaDelegate<Prisma.HouseholdCardTaskDelegate>("householdCardTask").deleteMany({
      where: { cardId }
    });
    return;
  }
  const taskClient = getPrismaDelegate<Prisma.HouseholdTaskDelegate>("householdTask");
  const existingTasks = await taskClient.findMany({
    where: { id: { in: uniqueTaskIds } },
    select: { id: true }
  });
  const validIds = uniqueTaskIds.filter((taskId) => existingTasks.some((task) => task.id === taskId));
  const cardTaskClient = getPrismaDelegate<Prisma.HouseholdCardTaskDelegate>("householdCardTask");
  await cardTaskClient.deleteMany({ where: { cardId } });
  if (validIds.length === 0) return;
  for (const [index, taskId] of validIds.entries()) {
    await cardTaskClient.create({
      data: {
        cardId,
        taskId,
        order: index
      }
    });
  }
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

export async function GET() {
  try {
    const [cards, tasks] = await Promise.all([
      loadCards(),
      getPrismaDelegate<Prisma.HouseholdTaskDelegate>("householdTask").findMany({
        orderBy: { order: "asc" }
      })
    ]);
    return NextResponse.json({
      cards: cards.map(serializeCard),
      tasks
    });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      console.error("Household Cards Tabelle fehlt – Fallback aktiv.", error);
      const [fallbackCards, fallbackTasks] = await Promise.all([
        fallbackListCardsWithTasks(),
        fallbackListTasks()
      ]);
      return NextResponse.json(
        {
          cards: fallbackCards.map(serializeCard),
          tasks: fallbackTasks
        },
        { headers: FALLBACK_HEADERS }
      );
    }
    console.error("Household Cards GET failed", error);
    return NextResponse.json({ error: "Household Karten konnten nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const summary = typeof body.summary === "string" ? body.summary.trim() : "";
  const weekdayRaw = Number(body.weekday ?? 1);
  const weekday = Number.isFinite(weekdayRaw) ? Math.min(7, Math.max(1, weekdayRaw)) : 1;
  const taskIds = Array.isArray(body.taskIds) ? body.taskIds.filter((id: any) => typeof id === "string") : [];

  if (!title) {
    return NextResponse.json({ error: "Titel erforderlich." }, { status: 400 });
  }

  try {
    const cardClient = getPrismaDelegate<Prisma.HouseholdCardDelegate>("householdCard");
    const card = await cardClient.create({
      data: {
        title,
        summary: summary || null,
        weekday
      }
    });
    await syncCardTasks(card.id, taskIds);

    const fresh = await cardClient.findUnique({
      where: { id: card.id },
      include: {
        tasks: {
          include: { task: true },
          orderBy: { order: "asc" }
        }
      }
    });
    return NextResponse.json(serializeCard(fresh!), { status: 201 });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      const card = await fallbackCreateCard({
        title,
        summary: summary || null,
        weekday,
        taskIds
      });
      return NextResponse.json(serializeCard(card), {
        status: 201,
        headers: FALLBACK_HEADERS
      });
    }
    console.error("Household Card POST failed", error);
    return NextResponse.json({ error: "Karte konnte nicht gespeichert werden." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Card ID erforderlich." }, { status: 400 });
  }
  const data: { title?: string; summary?: string | null; weekday?: number } = {};
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Titel darf nicht leer sein." }, { status: 400 });
    }
    data.title = title;
  }
  if (typeof body.summary === "string") {
    data.summary = body.summary.trim() || null;
  }
  if (body.weekday !== undefined) {
    const weekdayRaw = Number(body.weekday);
    if (!Number.isFinite(weekdayRaw)) {
      return NextResponse.json({ error: "Ungültiger Wochentag." }, { status: 400 });
    }
    data.weekday = Math.min(7, Math.max(1, Math.round(weekdayRaw)));
  }

  try {
    const cardClient = getPrismaDelegate<Prisma.HouseholdCardDelegate>("householdCard");
    await cardClient.update({
      where: { id },
      data
    });
    if (Array.isArray(body.taskIds)) {
      const taskIds = body.taskIds.filter((entry: unknown): entry is string => typeof entry === "string");
      await syncCardTasks(id, taskIds);
    }

    const fresh = await cardClient.findUnique({
      where: { id },
      include: {
        tasks: {
          include: { task: true },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!fresh) {
      return NextResponse.json({ error: "Card nicht gefunden." }, { status: 404 });
    }

    return NextResponse.json(serializeCard(fresh));
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      const fallbackCard = await fallbackUpdateCard({
        id,
        title: data.title,
        summary: Object.prototype.hasOwnProperty.call(data, "summary") ? data.summary ?? null : undefined,
        weekday: data.weekday,
        taskIds: Array.isArray(body.taskIds)
          ? body.taskIds.filter((entry: unknown): entry is string => typeof entry === "string")
          : undefined
      });
      return NextResponse.json(serializeCard(fallbackCard), { headers: FALLBACK_HEADERS });
    }
    console.error("Household Card update failed", error);
    return NextResponse.json({ error: "Karte konnte nicht aktualisiert werden." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "Card ID erforderlich." }, { status: 400 });
  }
  try {
    await getPrismaDelegate<Prisma.HouseholdCardDelegate>("householdCard").delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      await fallbackDeleteCard(id);
      return NextResponse.json({ success: true }, { headers: FALLBACK_HEADERS });
    }
    console.error("Household Card delete failed", error);
    return NextResponse.json({ error: "Karte konnte nicht gelöscht werden." }, { status: 500 });
  }
}
