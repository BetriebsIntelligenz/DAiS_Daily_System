import { NextResponse } from "next/server";

import { HUMAN_ACTIVITY_VALUES } from "@/lib/human";
import type { HumanContactActivity } from "@/lib/types";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import {
  HUMAN_CONTACT_FALLBACK_HEADERS,
  HUMAN_CONTACT_MIGRATION_HINT,
  getHumanContactLogClient,
  getHumanContactPersonClient,
  isMissingHumanContactTables,
  loadHumanContactStats,
  mapHumanContactLog
} from "@/server/human-contact-service";
import {
  fallbackAppendLog,
  fallbackContactExists,
  fallbackGetStats,
  fallbackListLogs
} from "@/server/human-contact-fallback-store";

function parseActivity(value: unknown): HumanContactActivity | null {
  const data = String(value ?? "");
  return HUMAN_ACTIVITY_VALUES.includes(data as HumanContactActivity)
    ? (data as HumanContactActivity)
    : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");
  if (!personId) {
    return NextResponse.json(
      { error: "personId erforderlich." },
      { status: 400 }
    );
  }
  const limitParam = Number(searchParams.get("limit") ?? 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.floor(limitParam), 1), 50)
    : 10;

  try {
    const logClient = getHumanContactLogClient();
    const records = await logClient.findMany({
      where: { personId },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return NextResponse.json(records.map(mapHumanContactLog));
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const entries = await fallbackListLogs(personId, limit);
      return NextResponse.json(entries, { headers: HUMAN_CONTACT_FALLBACK_HEADERS });
    }
    console.error("Human contact logs GET failed", error);
    return NextResponse.json(
      { error: "Verlauf konnte nicht geladen werden." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const personId = typeof body.personId === "string" ? body.personId : "";
  const activity = parseActivity(body.activity);
  const noteValue =
    typeof body.note === "string" ? body.note.trim() : "";

  if (!personId || !activity) {
    return NextResponse.json(
      { error: "Kontakt und Aktivität erforderlich." },
      { status: 400 }
    );
  }

  try {
    const personClient = getHumanContactPersonClient();
    const person = await personClient.findUnique({
      where: { id: personId },
      select: { id: true }
    });
    if (!person) {
      return NextResponse.json(
        { error: "Kontakt nicht gefunden." },
        { status: 404 }
      );
    }

    const user = await getOrCreateDemoUser({
      email: body.userEmail,
      name: body.userName
    });

    const logClient = getHumanContactLogClient();
    const record = await logClient.create({
      data: {
        personId,
        userId: user.id,
        activity,
        note: noteValue ? noteValue : null
      }
    });

    const log = mapHumanContactLog(record);
    const stats = (await loadHumanContactStats([personId]))[0] ?? null;

    return NextResponse.json(
      {
        log,
        stats
      },
      { status: 201 }
    );
  } catch (error) {
    if (isMissingHumanContactTables(error)) {
      const exists = await fallbackContactExists(personId);
      if (!exists) {
        return NextResponse.json(
          { error: "Kontakt nicht gefunden." },
          { status: 404, headers: HUMAN_CONTACT_FALLBACK_HEADERS }
        );
      }
      const log = await fallbackAppendLog({
        personId,
        activity,
        note: noteValue ?? null
      });
      const stats = (await fallbackGetStats([personId]))[0] ?? null;
      return NextResponse.json(
        { log, stats },
        { status: 201, headers: HUMAN_CONTACT_FALLBACK_HEADERS }
      );
    }
    console.error("Human contact log POST failed", error);
    return NextResponse.json(
      { error: "Aktivität konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
