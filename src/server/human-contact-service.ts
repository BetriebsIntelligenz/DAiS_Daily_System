import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  buildActivityDistribution,
  createEmptyActivityCounts
} from "@/lib/human";
import type {
  HumanContactActivity,
  HumanContactAssignmentDefinition,
  HumanContactCadence,
  HumanContactLogEntry,
  HumanContactPersonDefinition,
  HumanContactStatsEntry
} from "@/lib/types";
import { fallbackLoadContactsPayload } from "./human-contact-fallback-store";

export const HUMAN_CONTACT_MIGRATION_HINT =
  "Human Contact Tabellen fehlen. Bitte `prisma migrate deploy --schema src/pages/schema.prisma` ausführen.";

export const HUMAN_CONTACT_FALLBACK_HEADERS = {
  "x-dais-migration-hint": HUMAN_CONTACT_MIGRATION_HINT,
  "x-dais-human-mode": "fallback"
} as const;

export const HUMAN_CONTACT_STATS_WINDOW_DAYS = 30;

class HumanContactsUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HumanContactsUnavailableError";
  }
}

type PrismaWithHumanContacts = PrismaClient & {
  humanContactPerson?: Prisma.HumanContactPersonDelegate;
  humanContactAssignment?: Prisma.HumanContactAssignmentDelegate;
  humanContactLog?: Prisma.HumanContactLogDelegate;
};

const prismaWithHumanContacts = prisma as PrismaWithHumanContacts;

function getHumanContactDelegate<TDelegate extends { findMany?: unknown }>(
  name: keyof PrismaWithHumanContacts
) {
  const candidate = prismaWithHumanContacts[name];
  if (
    !candidate ||
    typeof candidate !== "object" ||
    typeof (candidate as { findMany?: unknown }).findMany !== "function"
  ) {
    throw new HumanContactsUnavailableError(HUMAN_CONTACT_MIGRATION_HINT);
  }
  return candidate as unknown as TDelegate;
}

export function getHumanContactPersonClient() {
  return getHumanContactDelegate<Prisma.HumanContactPersonDelegate>(
    "humanContactPerson"
  );
}

export function getHumanContactAssignmentClient() {
  return getHumanContactDelegate<
    Prisma.HumanContactAssignmentDelegate
  >("humanContactAssignment");
}

export function getHumanContactLogClient() {
  return getHumanContactDelegate<Prisma.HumanContactLogDelegate>(
    "humanContactLog"
  );
}

type PrismaContactWithAssignments = Prisma.HumanContactPersonGetPayload<{
  include: { assignments: true };
}>;

type PrismaAssignment = Prisma.HumanContactAssignmentGetPayload<{
  include?: Record<string, never>;
}>;

type PrismaLog = Prisma.HumanContactLogGetPayload<{
  include?: Record<string, never>;
}>;

export function isMissingHumanContactTables(error: unknown) {
  if (error instanceof HumanContactsUnavailableError) {
    return true;
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = (error as { code?: string }).code;
  if (code && ["P2010", "P2013", "P2021", "P2022"].includes(code)) {
    return true;
  }
  const message = (error as { message?: string }).message;
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes("humancontact") || lower.includes("human_contact");
}

export function mapHumanContactAssignment(
  record: PrismaAssignment
): HumanContactAssignmentDefinition {
  return {
    id: record.id,
    personId: record.personId,
    activity: record.activity as HumanContactActivity,
    cadence: record.cadence as HumanContactCadence,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function mapHumanContactPerson(
  record: PrismaContactWithAssignments
): HumanContactPersonDefinition {
  return {
    id: record.id,
    name: record.name,
    relation: record.relation as HumanContactPersonDefinition["relation"],
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    assignments: record.assignments.map(mapHumanContactAssignment)
  };
}

export function mapHumanContactLog(record: PrismaLog): HumanContactLogEntry {
  return {
    id: record.id,
    personId: record.personId,
    activity: record.activity as HumanContactActivity,
    note: record.note,
    createdAt: record.createdAt.toISOString()
  };
}

export async function loadHumanContactPersons() {
  const personClient = getHumanContactPersonClient();
  const records = await personClient.findMany({
    orderBy: [{ name: "asc" }],
    include: {
      assignments: {
        orderBy: [{ cadence: "asc" }, { activity: "asc" }]
      }
    }
  });
  return records.map(mapHumanContactPerson);
}

export async function loadHumanContactAssignments(personId: string) {
  const assignmentClient = getHumanContactAssignmentClient();
  const records = await assignmentClient.findMany({
    where: { personId },
    orderBy: [{ cadence: "asc" }, { activity: "asc" }]
  });
  return records.map(mapHumanContactAssignment);
}

export async function loadHumanContactPerson(personId: string) {
  const personClient = getHumanContactPersonClient();
  const record = await personClient.findUnique({
    where: { id: personId },
    include: {
      assignments: {
        orderBy: [{ cadence: "asc" }, { activity: "asc" }]
      }
    }
  });
  return record ? mapHumanContactPerson(record) : null;
}

export async function loadHumanContactStats(
  personIds: string[],
  windowDays = HUMAN_CONTACT_STATS_WINDOW_DAYS
) {
  if (personIds.length === 0) {
    return [] as HumanContactStatsEntry[];
  }

  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - Math.max(windowDays, 1));

  const logClient = getHumanContactLogClient();
  const groups = await logClient.groupBy({
    by: ["personId", "activity"],
    where: {
      personId: { in: personIds },
      createdAt: { gte: threshold }
    },
    _count: { _all: true }
  });

  const counts = new Map<string, Record<HumanContactActivity, number>>();
  for (const personId of personIds) {
    counts.set(personId, createEmptyActivityCounts());
  }

  for (const group of groups) {
    const personCounts = counts.get(group.personId);
    if (!personCounts) continue;
    const activity = group.activity as HumanContactActivity;
    personCounts[activity] = (personCounts[activity] ?? 0) + group._count._all;
  }

  return personIds.map((personId) => {
    const personCounts = counts.get(personId) ?? createEmptyActivityCounts();
    const total = Object.values(personCounts).reduce(
      (sum, value) => sum + value,
      0
    );
    return {
      personId,
      total,
      counts: personCounts,
      distribution: buildActivityDistribution(personCounts)
    };
  });
}

export async function buildHumanContactFallback() {
  return fallbackLoadContactsPayload();
}
