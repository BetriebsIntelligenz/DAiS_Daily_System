import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { householdCardSeeds, householdTaskSeeds } from "@/lib/household-data";

const STORE_VERSION = 1;
const STORE_PATH = path.join(process.cwd(), "System", "assets", "household-store.json");

interface StoredTask {
  id: string;
  label: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredCard {
  id: string;
  title: string;
  summary: string | null;
  weekday: number;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoredCardSnapshot extends StoredCard {
  tasks: Array<{
    id: string;
    order: number;
    taskId: string;
    task: StoredTask;
  }>;
}

interface StoredEntry {
  id: string;
  cardId: string;
  userId: string;
  programRunId: string | null;
  completedTaskIds: string[];
  note: string | null;
  createdAt: string;
  cardSnapshot: StoredCardSnapshot;
}

interface HouseholdStoreState {
  version: number;
  tasks: StoredTask[];
  cards: StoredCard[];
  entries: StoredEntry[];
}

interface TaskLike {
  id: string;
  label: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardTaskAssignment {
  id: string;
  order: number;
  taskId: string;
  task: TaskLike;
}

export interface CardWithTasks {
  id: string;
  title: string;
  summary: string | null;
  weekday: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: CardTaskAssignment[];
}

export interface EntryWithCard {
  id: string;
  cardId: string;
  userId: string;
  programRunId: string | null;
  completedTaskIds: string[];
  note: string | null;
  createdAt: Date;
  card: CardWithTasks;
}

let storeCache: HouseholdStoreState | null = null;

function fallbackTaskId(cardId: string, taskId: string, order: number) {
  return `${cardId}-${taskId}-${order}`;
}

function createDefaultStore(): HouseholdStoreState {
  const timestamp = new Date(0).toISOString();
  return {
    version: STORE_VERSION,
    tasks: householdTaskSeeds.map((task) => ({
      id: task.id,
      label: task.label,
      order: task.order,
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp
    })),
    cards: householdCardSeeds.map((card) => ({
      id: card.id,
      title: card.title,
      summary: card.summary ?? null,
      weekday: card.weekday,
      taskIds: card.taskIds.slice(),
      createdAt: timestamp,
      updatedAt: timestamp
    })),
    entries: []
  };
}

async function ensureStoreDirectory() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
}

async function readStore(): Promise<HouseholdStoreState> {
  if (storeCache) {
    return storeCache;
  }
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as HouseholdStoreState;
    storeCache = normalizeStore(parsed);
    return storeCache;
  } catch (error: unknown) {
    const defaultStore = createDefaultStore();
    await ensureStoreDirectory();
    await fs.writeFile(STORE_PATH, JSON.stringify(defaultStore, null, 2), "utf8");
    storeCache = defaultStore;
    return defaultStore;
  }
}

function normalizeStore(candidate: HouseholdStoreState | null): HouseholdStoreState {
  if (!candidate || typeof candidate !== "object") {
    return createDefaultStore();
  }
  const base = createDefaultStore();
  const normalized: HouseholdStoreState = {
    version: typeof candidate.version === "number" ? candidate.version : STORE_VERSION,
    tasks: Array.isArray(candidate.tasks) && candidate.tasks.length > 0 ? candidate.tasks : base.tasks,
    cards: Array.isArray(candidate.cards) && candidate.cards.length > 0 ? candidate.cards : base.cards,
    entries: Array.isArray(candidate.entries) ? candidate.entries : base.entries
  };
  return normalized;
}

async function snapshotStore(): Promise<HouseholdStoreState> {
  const current = await readStore();
  return JSON.parse(JSON.stringify(current));
}

async function writeStore(state: HouseholdStoreState) {
  await ensureStoreDirectory();
  const payload = { ...state, version: STORE_VERSION };
  await fs.writeFile(STORE_PATH, JSON.stringify(payload, null, 2), "utf8");
  storeCache = payload;
}

async function updateStore<T>(mutator: (state: HouseholdStoreState) => T | Promise<T>): Promise<T> {
  const draft = await snapshotStore();
  const result = await mutator(draft);
  await writeStore(draft);
  return result;
}

function toTask(record: StoredTask): TaskLike {
  return {
    id: record.id,
    label: record.label,
    order: record.order,
    active: record.active,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt)
  };
}

function serializeTask(record: TaskLike): StoredTask {
  return {
    id: record.id,
    label: record.label,
    order: record.order,
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function buildCardWithTasks(card: StoredCard, tasks: StoredTask[]): CardWithTasks {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  return {
    id: card.id,
    title: card.title,
    summary: card.summary ?? null,
    weekday: card.weekday,
    createdAt: new Date(card.createdAt),
    updatedAt: new Date(card.updatedAt),
    tasks: card.taskIds.map((taskId, index) => {
      const task = taskMap.get(taskId);
      const fallbackTask: StoredTask =
        task ??
        ({
          id: taskId,
          label: "Aufgabe",
          order: index,
          active: true,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt
        } satisfies StoredTask);
      return {
        id: fallbackTaskId(card.id, taskId, index),
        order: index,
        taskId,
        task: toTask(fallbackTask)
      };
    })
  };
}

function sanitizeTaskIds(taskIds: string[], tasks: StoredTask[]) {
  const validIds = new Set(tasks.map((task) => task.id));
  const seen = new Set<string>();
  const filtered: string[] = [];
  for (const id of taskIds) {
    if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) continue;
    seen.add(id);
    filtered.push(id);
  }
  return filtered;
}

function snapshotCard(card: CardWithTasks): StoredCardSnapshot {
  return {
    id: card.id,
    title: card.title,
    summary: card.summary,
    weekday: card.weekday,
    taskIds: card.tasks.map((assignment) => assignment.taskId),
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
    tasks: card.tasks.map((assignment) => ({
      id: assignment.id,
      order: assignment.order,
      taskId: assignment.taskId,
      task: serializeTask(assignment.task)
    }))
  };
}

function cardFromSnapshot(snapshot: StoredCardSnapshot): CardWithTasks {
  return {
    id: snapshot.id,
    title: snapshot.title,
    summary: snapshot.summary,
    weekday: snapshot.weekday,
    createdAt: new Date(snapshot.createdAt),
    updatedAt: new Date(snapshot.updatedAt),
    tasks: snapshot.tasks.map((assignment) => ({
      id: assignment.id,
      order: assignment.order,
      taskId: assignment.taskId,
      task: toTask(assignment.task)
    }))
  };
}

export async function fallbackListTasks(): Promise<TaskLike[]> {
  const store = await snapshotStore();
  return store.tasks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((task) => toTask(task));
}

export async function fallbackCreateTask(label: string): Promise<TaskLike> {
  const now = new Date();
  return updateStore((state) => {
    const nextOrder = state.tasks.reduce((max, task) => Math.max(max, task.order), -1) + 1;
    const task: StoredTask = {
      id: `hh-task-${randomUUID()}`,
      label,
      order: nextOrder,
      active: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    state.tasks.push(task);
    return toTask(task);
  });
}

export async function fallbackUpdateTask(id: string, data: { label?: string; active?: boolean }): Promise<TaskLike> {
  const now = new Date().toISOString();
  return updateStore((state) => {
    const task = state.tasks.find((entry) => entry.id === id);
    if (!task) {
      throw new Error("Task nicht gefunden.");
    }
    if (typeof data.label === "string") {
      task.label = data.label;
    }
    if (typeof data.active === "boolean") {
      task.active = data.active;
    }
    task.updatedAt = now;
    return toTask(task);
  });
}

export async function fallbackReorderTasks(order: string[]) {
  await updateStore((state) => {
    const orderMap = new Map(order.map((taskId, index) => [taskId, index]));
    let nextIndex = 0;
    for (const task of state.tasks) {
      if (orderMap.has(task.id)) {
        task.order = orderMap.get(task.id)!;
      } else {
        task.order = orderMap.size + nextIndex;
        nextIndex += 1;
      }
    }
  });
}

export async function fallbackDeleteTask(id: string) {
  await updateStore((state) => {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    state.cards = state.cards.map((card) => ({
      ...card,
      taskIds: card.taskIds.filter((taskId) => taskId !== id)
    }));
  });
}

export async function fallbackListCardsWithTasks(): Promise<CardWithTasks[]> {
  const store = await snapshotStore();
  return store.cards
    .slice()
    .sort((a, b) => {
      if (a.weekday !== b.weekday) {
        return a.weekday - b.weekday;
      }
      return a.title.localeCompare(b.title);
    })
    .map((card) => buildCardWithTasks(card, store.tasks));
}

export async function fallbackGetCardWithTasks(cardId: string): Promise<CardWithTasks | null> {
  const store = await snapshotStore();
  const card = store.cards.find((entry) => entry.id === cardId);
  if (!card) {
    return null;
  }
  return buildCardWithTasks(card, store.tasks);
}

export async function fallbackCreateCard(options: {
  title: string;
  summary: string | null;
  weekday: number;
  taskIds: string[];
}): Promise<CardWithTasks> {
  const now = new Date().toISOString();
  return updateStore((state) => {
    const card: StoredCard = {
      id: `hh-card-${randomUUID()}`,
      title: options.title,
      summary: options.summary,
      weekday: options.weekday,
      taskIds: sanitizeTaskIds(options.taskIds ?? [], state.tasks),
      createdAt: now,
      updatedAt: now
    };
    state.cards.push(card);
    return buildCardWithTasks(card, state.tasks);
  });
}

export async function fallbackUpdateCard(options: {
  id: string;
  title?: string;
  summary?: string | null;
  weekday?: number;
  taskIds?: string[];
}): Promise<CardWithTasks> {
  const now = new Date().toISOString();
  return updateStore((state) => {
    const card = state.cards.find((entry) => entry.id === options.id);
    if (!card) {
      throw new Error("Karte nicht gefunden.");
    }
    if (typeof options.title === "string") {
      card.title = options.title;
    }
    if (options.summary !== undefined) {
      card.summary = options.summary;
    }
    if (typeof options.weekday === "number") {
      card.weekday = options.weekday;
    }
    if (Array.isArray(options.taskIds)) {
      card.taskIds = sanitizeTaskIds(options.taskIds, state.tasks);
    }
    card.updatedAt = now;
    return buildCardWithTasks(card, state.tasks);
  });
}

export async function fallbackDeleteCard(id: string) {
  await updateStore((state) => {
    state.cards = state.cards.filter((card) => card.id !== id);
    state.entries = state.entries.filter((entry) => entry.cardId !== id);
  });
}

export async function fallbackListEntries(from: Date, to: Date): Promise<EntryWithCard[]> {
  const store = await snapshotStore();
  return store.entries
    .filter((entry) => {
      const createdAt = new Date(entry.createdAt);
      return createdAt.getTime() >= from.getTime() && createdAt.getTime() <= to.getTime();
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((entry) => {
      const liveCard = store.cards.find((card) => card.id === entry.cardId);
      const card = liveCard ? buildCardWithTasks(liveCard, store.tasks) : cardFromSnapshot(entry.cardSnapshot);
      return {
        id: entry.id,
        cardId: entry.cardId,
        userId: entry.userId,
        programRunId: entry.programRunId,
        completedTaskIds: entry.completedTaskIds.slice(),
        note: entry.note,
        createdAt: new Date(entry.createdAt),
        card
      };
    });
}

export async function fallbackCreateEntry(options: {
  card: CardWithTasks;
  userId: string;
  programRunId: string | null;
  completedTaskIds: string[];
  note: string | null;
}): Promise<EntryWithCard> {
  const createdAt = new Date();
  const entry: StoredEntry = {
    id: `hh-entry-${randomUUID()}`,
    cardId: options.card.id,
    userId: options.userId,
    programRunId: options.programRunId,
    completedTaskIds: options.completedTaskIds.slice(),
    note: options.note,
    createdAt: createdAt.toISOString(),
    cardSnapshot: snapshotCard(options.card)
  };

  await updateStore((state) => {
    state.entries.push(entry);
  });

  return {
    id: entry.id,
    cardId: entry.cardId,
    userId: entry.userId,
    programRunId: entry.programRunId,
    completedTaskIds: entry.completedTaskIds.slice(),
    note: entry.note,
    createdAt,
    card: options.card
  };
}
