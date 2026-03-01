import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { ensureResultsSchema } from "@/lib/results-schema";
import type { ResultChecklistItem, ResultStatus } from "@/lib/types";

const RESULT_STATUS_VALUES: ResultStatus[] = [
  "open",
  "in_progress",
  "delayed",
  "problem",
  "completed",
  "stopped",
  "archived"
];

const RESULT_STATUS_LABELS: Record<ResultStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  delayed: "Verzug",
  problem: "Problem",
  completed: "Abgeschlossen",
  stopped: "Gestoppt",
  archived: "Archiv"
};

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function hasOwn(obj: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function parseDate(raw: unknown): Date | null {
  if (raw == null || raw === "") {
    return null;
  }
  const value = new Date(String(raw));
  if (Number.isNaN(value.getTime())) {
    throw new Error("Ungültiges Datumsformat.");
  }
  return value;
}

function parseResultStatus(raw: unknown): ResultStatus {
  return RESULT_STATUS_VALUES.includes(raw as ResultStatus)
    ? (raw as ResultStatus)
    : "open";
}

function normalizeChecklist(value: unknown): ResultChecklistItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      const row = toRecord(entry);
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      const id = String(row.id ?? "").trim() || `item-${index + 1}`;
      return {
        id,
        label,
        done: Boolean(row.done)
      };
    })
    .filter((entry): entry is ResultChecklistItem => entry != null);
}

function normalizeArtifacts(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => String(entry ?? "").trim())
    .filter(Boolean);
}

function formatDateLabel(value?: Date | null) {
  if (!value) return "kein Datum";
  return value.toLocaleDateString("de-DE");
}

function formatCurrency(value: number) {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}€`;
}

async function resolveUser(email?: string | null, name?: string | null) {
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  return getOrCreateDemoUser({
    email: normalizedEmail || undefined,
    name: typeof name === "string" && name.trim() ? name.trim() : undefined
  });
}

function mapResultPayload(result: any) {
  return {
    id: result.id,
    name: result.name,
    icon: result.icon,
    status: parseResultStatus(result.status),
    startDate: result.startDate,
    deadline: result.deadline,
    cost: result.cost,
    stakeholder: result.stakeholder,
    outputFileType: result.outputFileType,
    checklist: normalizeChecklist(result.checklist),
    artifacts: normalizeArtifacts(result.artifacts),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    logs: (Array.isArray(result.logs) ? result.logs : []).map((entry: any) => ({
      id: entry.id,
      resultId: entry.resultId,
      userId: entry.userId,
      message: entry.message,
      logType: entry.logType === "change" ? "change" : "manual",
      createdAt: entry.createdAt
    }))
  };
}

function toApiErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (
    message.includes("resultObject") ||
    message.includes("resultLogEntry") ||
    message.includes("ResultObject") ||
    message.includes("ResultLogEntry")
  ) {
    return "Results-Backend nicht initialisiert. Bitte Server neu starten.";
  }
  return fallback;
}

async function loadResultById(resultId: string) {
  const db = prisma as any;
  const record = await db.resultObject.findUnique({
    where: { id: resultId },
    include: {
      logs: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
  return record ? mapResultPayload(record) : null;
}

function buildChecklistChangeMessages(
  beforeChecklist: ResultChecklistItem[],
  afterChecklist: ResultChecklistItem[]
) {
  const messages: string[] = [];
  const beforeMap = new Map(beforeChecklist.map((item) => [item.label, item.done]));
  const afterMap = new Map(afterChecklist.map((item) => [item.label, item.done]));

  for (const [label] of afterMap) {
    if (!beforeMap.has(label)) {
      messages.push(`Checklistenpunkt hinzugefügt: "${label}".`);
    }
  }
  for (const [label] of beforeMap) {
    if (!afterMap.has(label)) {
      messages.push(`Checklistenpunkt entfernt: "${label}".`);
    }
  }
  for (const [label, beforeDone] of beforeMap) {
    if (!afterMap.has(label)) continue;
    const afterDone = afterMap.get(label);
    if (afterDone !== beforeDone) {
      messages.push(
        afterDone
          ? `Checklistenpunkt "${label}" als erledigt markiert.`
          : `Checklistenpunkt "${label}" wieder geöffnet.`
      );
    }
  }
  return messages;
}

function buildArtifactChangeMessages(beforeArtifacts: string[], afterArtifacts: string[]) {
  const messages: string[] = [];
  const beforeSet = new Set(beforeArtifacts);
  const afterSet = new Set(afterArtifacts);

  for (const artifact of afterSet) {
    if (!beforeSet.has(artifact)) {
      messages.push(`Artefakt hinzugefügt: "${artifact}".`);
    }
  }
  for (const artifact of beforeSet) {
    if (!afterSet.has(artifact)) {
      messages.push(`Artefakt entfernt: "${artifact}".`);
    }
  }
  return messages;
}

export async function GET(request: Request) {
  try {
    await ensureResultsSchema();

    const { searchParams } = new URL(request.url);
    const user = await resolveUser(
      searchParams.get("userEmail"),
      searchParams.get("userName")
    );

    const db = prisma as any;
    const records = await db.resultObject.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        logs: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    return NextResponse.json(records.map(mapResultPayload));
  } catch (error) {
    console.error("Results GET failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Results konnten nicht geladen werden.") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureResultsSchema();

    const body = toRecord(await request.json());
    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );
    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
    }

    const icon = String(body.icon ?? "🎯").trim() || "🎯";
    const status = parseResultStatus(body.status);
    const checklist = normalizeChecklist(body.checklist);
    const artifacts = normalizeArtifacts(body.artifacts);

    const db = prisma as any;
    const created = await db.resultObject.create({
      data: {
        userId: user.id,
        name,
        icon,
        status,
        startDate: parseDate(body.startDate),
        deadline: parseDate(body.deadline),
        cost: Number(body.cost) || 0,
        stakeholder:
          typeof body.stakeholder === "string" ? body.stakeholder.trim() : null,
        outputFileType:
          typeof body.outputFileType === "string"
            ? body.outputFileType.trim()
            : null,
        checklist,
        artifacts,
        logs: {
          create: {
            userId: user.id,
            logType: "change",
            message: "Result erstellt."
          }
        }
      }
    });

    const payload = await loadResultById(created.id);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Results POST failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Result konnte nicht gespeichert werden.") },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureResultsSchema();

    const body = toRecord(await request.json());
    const id = String(body.id ?? "").trim();
    if (!id) {
      return NextResponse.json({ error: "Result-ID ist erforderlich." }, { status: 400 });
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const existing = await db.resultObject.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Result nicht gefunden." }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const changeMessages: string[] = [];

    if (hasOwn(body, "name")) {
      const nextName = String(body.name ?? "").trim();
      if (!nextName) {
        return NextResponse.json({ error: "Name ist erforderlich." }, { status: 400 });
      }
      if (nextName !== existing.name) {
        changeMessages.push(`Name geändert von "${existing.name}" auf "${nextName}".`);
        updateData.name = nextName;
      }
    }

    if (hasOwn(body, "icon")) {
      const nextIcon = String(body.icon ?? "").trim() || "🎯";
      if (nextIcon !== existing.icon) {
        changeMessages.push(`Icon geändert von "${existing.icon}" auf "${nextIcon}".`);
        updateData.icon = nextIcon;
      }
    }

    if (hasOwn(body, "status")) {
      const nextStatus = parseResultStatus(body.status);
      const oldStatus = parseResultStatus(existing.status);
      if (nextStatus !== oldStatus) {
        changeMessages.push(
          `Status geändert von "${RESULT_STATUS_LABELS[oldStatus]}" auf "${RESULT_STATUS_LABELS[nextStatus]}".`
        );
        updateData.status = nextStatus;
      }
    }

    if (hasOwn(body, "startDate")) {
      const nextStartDate = parseDate(body.startDate);
      const oldStartDate = existing.startDate as Date | null;
      if (
        (oldStartDate?.toISOString() ?? null) !==
        (nextStartDate?.toISOString() ?? null)
      ) {
        changeMessages.push(
          `Startdatum geändert von ${formatDateLabel(oldStartDate)} auf ${formatDateLabel(nextStartDate)}.`
        );
        updateData.startDate = nextStartDate;
      }
    }

    if (hasOwn(body, "deadline")) {
      const nextDeadline = parseDate(body.deadline);
      const oldDeadline = existing.deadline as Date | null;
      if (
        (oldDeadline?.toISOString() ?? null) !==
        (nextDeadline?.toISOString() ?? null)
      ) {
        changeMessages.push(
          `Deadline geändert von ${formatDateLabel(oldDeadline)} auf ${formatDateLabel(nextDeadline)}.`
        );
        updateData.deadline = nextDeadline;
      }
    }

    if (hasOwn(body, "cost")) {
      const nextCost = Number(body.cost) || 0;
      const oldCost = Number(existing.cost ?? 0);
      if (nextCost !== oldCost) {
        changeMessages.push(
          `Kosten angepasst von ${formatCurrency(oldCost)} auf ${formatCurrency(nextCost)}.`
        );
        updateData.cost = nextCost;
      }
    }

    if (hasOwn(body, "stakeholder")) {
      const nextStakeholder =
        typeof body.stakeholder === "string" ? body.stakeholder.trim() : "";
      const oldStakeholder = String(existing.stakeholder ?? "");
      if (nextStakeholder !== oldStakeholder) {
        changeMessages.push(
          `Stakeholder geändert von "${oldStakeholder || "leer"}" auf "${nextStakeholder || "leer"}".`
        );
        updateData.stakeholder = nextStakeholder || null;
      }
    }

    if (hasOwn(body, "outputFileType")) {
      const nextOutputType =
        typeof body.outputFileType === "string" ? body.outputFileType.trim() : "";
      const oldOutputType = String(existing.outputFileType ?? "");
      if (nextOutputType !== oldOutputType) {
        changeMessages.push(
          `Output File Type geändert von "${oldOutputType || "leer"}" auf "${nextOutputType || "leer"}".`
        );
        updateData.outputFileType = nextOutputType || null;
      }
    }

    if (hasOwn(body, "checklist")) {
      const nextChecklist = normalizeChecklist(body.checklist);
      const oldChecklist = normalizeChecklist(existing.checklist);
      if (JSON.stringify(nextChecklist) !== JSON.stringify(oldChecklist)) {
        const checklistMessages = buildChecklistChangeMessages(
          oldChecklist,
          nextChecklist
        );
        if (checklistMessages.length === 0) {
          checklistMessages.push("Checkliste aktualisiert.");
        }
        changeMessages.push(...checklistMessages);
        updateData.checklist = nextChecklist;
      }
    }

    if (hasOwn(body, "artifacts")) {
      const nextArtifacts = normalizeArtifacts(body.artifacts);
      const oldArtifacts = normalizeArtifacts(existing.artifacts);
      if (JSON.stringify(nextArtifacts) !== JSON.stringify(oldArtifacts)) {
        const artifactMessages = buildArtifactChangeMessages(
          oldArtifacts,
          nextArtifacts
        );
        if (artifactMessages.length === 0) {
          artifactMessages.push("Artefaktliste aktualisiert.");
        }
        changeMessages.push(...artifactMessages);
        updateData.artifacts = nextArtifacts;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await db.resultObject.update({
        where: { id },
        data: updateData
      });
    }

    if (changeMessages.length > 0) {
      await db.resultLogEntry.createMany({
        data: changeMessages.map((message) => ({
          resultId: id,
          userId: user.id,
          message,
          logType: "change"
        }))
      });
    }

    const payload = await loadResultById(id);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Results PUT failed", error);
    return NextResponse.json(
      { error: toApiErrorMessage(error, "Result konnte nicht aktualisiert werden.") },
      { status: 500 }
    );
  }
}
