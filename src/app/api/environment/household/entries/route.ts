import { NextResponse } from "next/server";
import { Prisma, type PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { createProgramRun } from "@/server/program-run-service";
import { appendHouseholdLog } from "@/server/household-log-service";
import {
  CardWithTasks,
  EntryWithCard,
  fallbackCreateEntry,
  fallbackGetCardWithTasks,
  fallbackListEntries
} from "@/server/household-fallback-store";

const PROGRAM_ID = "environment-household-cards";
const WEEKDAY_LABELS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const MIGRATION_HINT =
  "Household Tabellen fehlen. Bitte `prisma migrate deploy --schema src/pages/schema.prisma` (siehe .ssh/Konzept/Anleitungen/DB_Integration_VPS_Migration.md) ausführen.";
const FALLBACK_HEADERS = {
  "x-dais-migration-hint": MIGRATION_HINT,
  "x-dais-household-mode": "fallback"
};

type PrismaEntryWithCard = Prisma.HouseholdEntryGetPayload<{
  include: {
    card: {
      include: {
        tasks: {
          include: { task: true };
        };
      };
    };
  };
}>;

type EntryRecordSource = PrismaEntryWithCard | EntryWithCard;

class HouseholdTablesUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseholdTablesUnavailableError";
  }
}

function getDelegate<TDelegate>(name: keyof PrismaClient) {
  const delegate = (prisma as unknown as Record<string | symbol, unknown>)[name];
  if (!delegate || typeof (delegate as Record<string, unknown>).findMany !== "function") {
    throw new HouseholdTablesUnavailableError(MIGRATION_HINT);
  }
  return delegate as TDelegate;
}

function startOfWeek(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  const weekday = clone.getDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  clone.setDate(clone.getDate() - diff);
  return clone;
}

function endOfWeek(start: Date) {
  const clone = new Date(start);
  clone.setDate(clone.getDate() + 6);
  clone.setHours(23, 59, 59, 999);
  return clone;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildLogHtml(cardTitle: string, weekday: number, completedTasks: string[], note?: string | null) {
  const weekdayLabel = WEEKDAY_LABELS[weekday - 1] ?? "Tag";
  const taskList =
    completedTasks.length === 0
      ? "<li>Keine Aufgaben markiert</li>"
      : completedTasks.map((task) => `<li>✅ ${task}</li>`).join("");
  const noteBlock = note ? `<p>${note}</p>` : "";
  return `<p><strong>${cardTitle}</strong> (${weekdayLabel})</p><ul>${taskList}</ul>${noteBlock}`;
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fromParam = parseDate(searchParams.get("from"));
  const toParam = parseDate(searchParams.get("to"));
  const base = fromParam ?? startOfWeek(new Date());
  const from = fromParam ?? base;
  const to = toParam ?? endOfWeek(base);

  try {
    const entryClient = getDelegate<Prisma.HouseholdEntryDelegate>("householdEntry");
    const entries = await entryClient.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        }
      },
      include: {
        card: {
          include: {
            tasks: {
              include: { task: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json({
      range: {
        from: from.toISOString(),
        to: to.toISOString()
      },
      entries: mapEntriesToPayload(entries)
    });
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      console.error("Household Entries Tabelle fehlt – Fallback aktiv.", error);
      const fallbackEntries = await fallbackListEntries(from, to);
      return NextResponse.json(
        {
          range: { from: from.toISOString(), to: to.toISOString() },
          entries: mapEntriesToPayload(fallbackEntries)
        },
        { headers: FALLBACK_HEADERS }
      );
    }
    console.error("Household Entries GET failed", error);
    return NextResponse.json({ error: "Haushaltsverlauf konnte nicht geladen werden." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const cardId = typeof body.cardId === "string" ? body.cardId : null;
  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (!cardId) {
    return NextResponse.json({ error: "cardId erforderlich." }, { status: 400 });
  }
  const completedIdsInput: string[] = Array.isArray(body.completedTaskIds)
    ? body.completedTaskIds.filter((entry: unknown): entry is string => typeof entry === "string")
    : [];
  const user = await getOrCreateDemoUser({
    email: body.userEmail,
    name: body.userName
  });

  try {
    const cardClient = getDelegate<Prisma.HouseholdCardDelegate>("householdCard");
    const entryClient = getDelegate<Prisma.HouseholdEntryDelegate>("householdEntry");
    const selectedCard = (await cardClient.findUnique({
      where: { id: cardId },
      include: {
        tasks: {
          include: { task: true },
          orderBy: { order: "asc" }
        }
      }
    })) as CardWithTasks | null;
    if (!selectedCard) {
      return NextResponse.json({ error: "Karte nicht gefunden." }, { status: 404 });
    }

    const completedTaskIds = resolveCompletedTaskIds(selectedCard, completedIdsInput);
    const response = await finalizeHouseholdEntry({
      card: selectedCard,
      completedTaskIds,
      note,
      user,
      persist: async (runId) => {
        const record = await entryClient.create({
          data: {
            cardId: selectedCard.id,
            userId: user.id,
            programRunId: runId,
            completedTaskIds,
            note: note || null
          },
          select: {
            id: true,
            cardId: true,
            completedTaskIds: true,
            note: true,
            createdAt: true
          }
        });
        return {
          ...record,
          card: selectedCard
        };
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof HouseholdTablesUnavailableError || isMissingHouseholdTables(error)) {
      const fallbackCard = await fallbackGetCardWithTasks(cardId);
      if (!fallbackCard) {
        return NextResponse.json({ error: "Karte nicht gefunden." }, { status: 404 });
      }
      const completedTaskIds = resolveCompletedTaskIds(fallbackCard, completedIdsInput);
      const response = await finalizeHouseholdEntry({
        card: fallbackCard,
        completedTaskIds,
        note,
        user,
        persist: async (runId) => {
          const entryRecord = await fallbackCreateEntry({
            card: fallbackCard,
            userId: user.id,
            programRunId: runId,
            completedTaskIds,
            note: note || null
          });
          return {
            id: entryRecord.id,
            cardId: entryRecord.cardId,
            completedTaskIds: entryRecord.completedTaskIds,
            note: entryRecord.note,
            createdAt: entryRecord.createdAt,
            card: fallbackCard
          };
        }
      });
      return NextResponse.json(response, { headers: FALLBACK_HEADERS });
    }
    console.error("Household Entry POST failed", error);
    return NextResponse.json({ error: "Haushaltskarte konnte nicht gespeichert werden." }, { status: 500 });
  }
}

function mapEntriesToPayload(entries: EntryRecordSource[]) {
  return entries.map((entry) => {
    const cardTasks = entry.card.tasks ?? [];
    const completedTasks = cardTasks
      .filter((assignment) => entry.completedTaskIds.includes(assignment.taskId))
      .map((assignment) => assignment.task.label);
    return {
      id: entry.id,
      cardId: entry.cardId,
      cardTitle: entry.card.title,
      cardSummary: entry.card.summary,
      weekday: entry.card.weekday,
      createdAt: entry.createdAt,
      completedTaskIds: entry.completedTaskIds,
      completedTasks,
      note: entry.note ?? null
    };
  });
}

function resolveCompletedTaskIds(card: CardWithTasks, candidateIds: string[]) {
  const allowed = new Set(card.tasks.map((assignment) => assignment.taskId));
  return candidateIds.filter((id) => allowed.has(id));
}

interface PersistedEntrySummary {
  id: string;
  cardId: string;
  completedTaskIds: string[];
  note: string | null;
  createdAt: Date;
  card: CardWithTasks;
}

interface FinalizeHouseholdEntryOptions {
  card: CardWithTasks;
  completedTaskIds: string[];
  note: string;
  user: { id: string; email: string; name: string };
  persist: (runId: string) => Promise<PersistedEntrySummary>;
}

async function finalizeHouseholdEntry(options: FinalizeHouseholdEntryOptions) {
  const noteValue = options.note || null;
  const taskStepPayload = options.card.tasks.reduce<Record<string, boolean>>((acc, assignment) => {
    acc[`household-task-${assignment.taskId}`] = options.completedTaskIds.includes(assignment.taskId);
    return acc;
  }, {});

  const payload = {
    cardId: options.card.id,
    cardTitle: options.card.title,
    completedTaskIds: options.completedTaskIds,
    completedTaskLabels: options.card.tasks
      .filter((assignment) => options.completedTaskIds.includes(assignment.taskId))
      .map((assignment) => assignment.task.label),
    note: noteValue,
    steps: taskStepPayload,
    quality: {
      customRulePassed: true
    },
    runner: {
      completed: true,
      totalSteps: options.card.tasks.length
    }
  };

  const run = await createProgramRun({
    programId: PROGRAM_ID,
    payload,
    userEmail: options.user.email,
    userName: options.user.name
  });

  const entryRecord = await options.persist(run.runId);
  const completedTasks = options.card.tasks
    .filter((assignment) => entryRecord.completedTaskIds.includes(assignment.taskId))
    .map((assignment) => assignment.task.label);

  await appendHouseholdLog({
    contentHtml: buildLogHtml(options.card.title, options.card.weekday, completedTasks, noteValue),
    userId: options.user.id
  });

  return {
    entry: {
      id: entryRecord.id,
      cardId: entryRecord.cardId,
      cardTitle: options.card.title,
      cardSummary: options.card.summary,
      weekday: options.card.weekday,
      createdAt: entryRecord.createdAt,
      completedTaskIds: entryRecord.completedTaskIds,
      completedTasks,
      note: noteValue
    },
    xpEarned: run.xpEarned
  };
}
