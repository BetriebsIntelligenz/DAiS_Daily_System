import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import { ensureResultsSchema } from "@/lib/results-schema";

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function resolveUser(email?: string | null, name?: string | null) {
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  return getOrCreateDemoUser({
    email: normalizedEmail || undefined,
    name: typeof name === "string" && name.trim() ? name.trim() : undefined
  });
}

export async function POST(
  request: Request,
  context: { params: { resultId: string } }
) {
  try {
    await ensureResultsSchema();

    const resultId = String(context.params.resultId ?? "").trim();
    if (!resultId) {
      return NextResponse.json({ error: "Result-ID fehlt." }, { status: 400 });
    }

    const body = toRecord(await request.json());
    const message = String(body.message ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "Log-Nachricht fehlt." }, { status: 400 });
    }

    const user = await resolveUser(
      typeof body.userEmail === "string" ? body.userEmail : null,
      typeof body.userName === "string" ? body.userName : null
    );

    const db = prisma as any;
    const result = await db.resultObject.findFirst({
      where: { id: resultId, userId: user.id }
    });

    if (!result) {
      return NextResponse.json({ error: "Result nicht gefunden." }, { status: 404 });
    }

    const entry = await db.resultLogEntry.create({
      data: {
        resultId,
        userId: user.id,
        message,
        logType: "manual"
      }
    });

    return NextResponse.json(
      {
        id: entry.id,
        resultId: entry.resultId,
        userId: entry.userId,
        message: entry.message,
        logType: entry.logType === "change" ? "change" : "manual",
        createdAt: entry.createdAt
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Result log POST failed", error);
    return NextResponse.json(
      { error: "Log-Eintrag konnte nicht gespeichert werden." },
      { status: 500 }
    );
  }
}
