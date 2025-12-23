import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  HumanContactActivity,
  HumanContactAssignmentDefinition,
  HumanContactCadence,
  HumanContactLogEntry,
  HumanContactPersonDefinition,
  HumanContactRelation,
  HumanContactStatsEntry
} from "@/lib/types";
import { humanContactSeeds } from "@/lib/human-data";
import {
  buildActivityDistribution,
  createEmptyActivityCounts
} from "@/lib/human";
const DEFAULT_STATS_WINDOW_DAYS = 30;

const STORE_VERSION = 1;
const STORE_PATH = path.join(
  process.cwd(),
  "System",
  "assets",
  "human-contact-store.json"
);

interface StoredContact {
  id: string;
  name: string;
  relation: HumanContactRelation;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredAssignment {
  id: string;
  personId: string;
  activity: HumanContactActivity;
  cadence: HumanContactCadence;
  createdAt: string;
  updatedAt: string;
}

interface StoredLog {
  id: string;
  personId: string;
  activity: HumanContactActivity;
  note: string | null;
  createdAt: string;
}

interface HumanContactStore {
  version: number;
  persons: StoredContact[];
  assignments: StoredAssignment[];
  logs: StoredLog[];
}

let storeCache: HumanContactStore | null = null;

function createDefaultStore(): HumanContactStore {
  const timestamp = new Date(0).toISOString();
  const persons: StoredContact[] = humanContactSeeds.map((seed) => ({
    id: seed.id,
    name: seed.name,
    relation: seed.relation,
    note: seed.note ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  }));
  const assignments: StoredAssignment[] = [];
  for (const seed of humanContactSeeds) {
    if (!seed.assignments) continue;
    for (const cadence of Object.keys(seed.assignments) as HumanContactCadence[]) {
      const activities = seed.assignments[cadence] ?? [];
      for (const activity of activities) {
        assignments.push({
          id: `${seed.id}-${cadence}-${activity}`,
          personId: seed.id,
          activity,
          cadence,
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }
    }
  }
  return {
    version: STORE_VERSION,
    persons,
    assignments,
    logs: []
  };
}

async function ensureStoreDirectory() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<HumanContactStore> {
  if (storeCache) {
    return storeCache;
  }
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as HumanContactStore;
    storeCache = normalizeStore(parsed);
    return storeCache;
  } catch {
    const initial = createDefaultStore();
    await ensureStoreDirectory();
    await fs.writeFile(STORE_PATH, JSON.stringify(initial, null, 2), "utf8");
    storeCache = initial;
    return initial;
  }
}

function normalizeStore(candidate: HumanContactStore | null): HumanContactStore {
  if (!candidate || typeof candidate !== "object") {
    return createDefaultStore();
  }
  const base = createDefaultStore();
  return {
    version: typeof candidate.version === "number" ? candidate.version : STORE_VERSION,
    persons: Array.isArray(candidate.persons) && candidate.persons.length > 0
      ? candidate.persons
      : base.persons,
    assignments: Array.isArray(candidate.assignments)
      ? candidate.assignments
      : base.assignments,
    logs: Array.isArray(candidate.logs) ? candidate.logs : base.logs
  };
}

async function snapshotStore() {
  const current = await readStore();
  return JSON.parse(JSON.stringify(current)) as HumanContactStore;
}

async function writeStore(data: HumanContactStore) {
  await ensureStoreDirectory();
  const payload = { ...data, version: STORE_VERSION };
  await fs.writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
  storeCache = payload;
}

async function updateStore<T>(mutator: (draft: HumanContactStore) => T | Promise<T>) {
  const draft = await snapshotStore();
  const result = await mutator(draft);
  await writeStore(draft);
  return result;
}

function toAssignmentDefinition(record: StoredAssignment): HumanContactAssignmentDefinition {
  return {
    id: record.id,
    personId: record.personId,
    activity: record.activity,
    cadence: record.cadence,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function toPersonDefinition(
  person: StoredContact,
  assignments: StoredAssignment[]
): HumanContactPersonDefinition {
  return {
    id: person.id,
    name: person.name,
    relation: person.relation,
    note: person.note,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
    assignments: assignments
      .filter((assignment) => assignment.personId === person.id)
      .sort((left, right) =>
        left.cadence === right.cadence
          ? left.activity.localeCompare(right.activity)
          : left.cadence.localeCompare(right.cadence)
      )
      .map(toAssignmentDefinition)
  };
}

export async function fallbackListContacts(): Promise<HumanContactPersonDefinition[]> {
  const store = await readStore();
  return store.persons
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((person) => toPersonDefinition(person, store.assignments));
}

export async function fallbackCreateContact(options: {
  name: string;
  relation: HumanContactRelation;
  note?: string;
}): Promise<HumanContactPersonDefinition> {
  const now = new Date().toISOString();
  return updateStore((draft) => {
    const record: StoredContact = {
      id: randomUUID(),
      name: options.name,
      relation: options.relation,
      note: options.note ?? null,
      createdAt: now,
      updatedAt: now
    };
    draft.persons.push(record);
    return toPersonDefinition(record, draft.assignments);
  });
}

export async function fallbackUpdateContact(
  id: string,
  updates: Partial<Pick<StoredContact, "name" | "relation" | "note">>
): Promise<HumanContactPersonDefinition | null> {
  const now = new Date().toISOString();
  return updateStore((draft) => {
    const index = draft.persons.findIndex((person) => person.id === id);
    if (index === -1) {
      return null;
    }
    const person = draft.persons[index];
    draft.persons[index] = {
      ...person,
      ...updates,
      note: updates.note === undefined ? person.note : updates.note ?? null,
      updatedAt: now
    };
    return toPersonDefinition(draft.persons[index], draft.assignments);
  });
}

export async function fallbackDeleteContact(id: string): Promise<boolean> {
  return updateStore((draft) => {
    const before = draft.persons.length;
    draft.persons = draft.persons.filter((person) => person.id !== id);
    draft.assignments = draft.assignments.filter((assignment) => assignment.personId !== id);
    draft.logs = draft.logs.filter((log) => log.personId !== id);
    return draft.persons.length !== before;
  });
}

export async function fallbackSetAssignment(
  personId: string,
  activity: HumanContactActivity,
  cadence: HumanContactCadence,
  enabled: boolean
): Promise<HumanContactAssignmentDefinition[]> {
  const now = new Date().toISOString();
  return updateStore((draft) => {
    const existingIndex = draft.assignments.findIndex(
      (assignment) =>
        assignment.personId === personId &&
        assignment.activity === activity &&
        assignment.cadence === cadence
    );
    if (enabled) {
      if (existingIndex === -1) {
        draft.assignments.push({
          id: randomUUID(),
          personId,
          activity,
          cadence,
          createdAt: now,
          updatedAt: now
        });
      } else {
        draft.assignments[existingIndex].updatedAt = now;
      }
    } else if (existingIndex !== -1) {
      draft.assignments.splice(existingIndex, 1);
    }
    return draft.assignments
      .filter((assignment) => assignment.personId === personId)
      .map(toAssignmentDefinition)
      .sort((left, right) =>
        left.cadence === right.cadence
          ? left.activity.localeCompare(right.activity)
          : left.cadence.localeCompare(right.cadence)
      );
  });
}

export async function fallbackListLogs(personId: string, limit: number) {
  const store = await readStore();
  return store.logs
    .filter((log) => log.personId === personId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit)
    .map((log) => ({
      id: log.id,
      personId: log.personId,
      activity: log.activity,
      note: log.note,
      createdAt: log.createdAt
    }));
}

export async function fallbackAppendLog(options: {
  personId: string;
  activity: HumanContactActivity;
  note?: string | null;
}): Promise<HumanContactLogEntry> {
  const now = new Date().toISOString();
  return updateStore((draft) => {
    const record: StoredLog = {
      id: randomUUID(),
      personId: options.personId,
      activity: options.activity,
      note: options.note ?? null,
      createdAt: now
    };
    draft.logs.push(record);
    return {
      id: record.id,
      personId: record.personId,
      activity: record.activity,
      note: record.note,
      createdAt: record.createdAt
    };
  });
}

export async function fallbackContactExists(personId: string) {
  const store = await readStore();
  return store.persons.some((person) => person.id === personId);
}

export async function fallbackGetStats(
  personIds: string[],
  windowDays = DEFAULT_STATS_WINDOW_DAYS
): Promise<HumanContactStatsEntry[]> {
  const store = await readStore();
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() - Math.max(windowDays, 1));
  const cutoff = threshold.toISOString();

  return personIds.map((personId) => {
    const counts = createEmptyActivityCounts();
    store.logs
      .filter((log) => log.personId === personId && log.createdAt >= cutoff)
      .forEach((log) => {
        counts[log.activity] = (counts[log.activity] ?? 0) + 1;
      });
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return {
      personId,
      total,
      counts,
      distribution: buildActivityDistribution(counts)
    };
  });
}

export async function fallbackLoadContactsPayload() {
  const persons = await fallbackListContacts();
  const stats = await fallbackGetStats(
    persons.map((person) => person.id),
    DEFAULT_STATS_WINDOW_DAYS
  );
  return { persons, stats };
}
