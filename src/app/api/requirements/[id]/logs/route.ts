import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import type { RequirementLog } from "@prisma/client";

interface RouteContext {
  params: { id: string };
}

async function fetchLogs(requirementId: string) {
  return prisma.requirementLog.findMany({
    where: { requirementId },
    orderBy: { createdAt: "desc" }
  });
}

async function insertLog(entry: {
  requirementId: string;
  userId: string;
  content: string;
}): Promise<RequirementLog> {
  return prisma.requirementLog.create({
    data: {
      requirementId: entry.requirementId,
      userId: entry.userId,
      content: entry.content
    }
  });
}

async function resolveRequirementForUser(id: string, email?: string) {
  const user = await getOrCreateDemoUser({ email });
  const requirement = await prisma.requirement.findFirst({
    where: { id, userId: user.id }
  });
  return { user, requirement };
}

export async function GET(request: Request, { params }: RouteContext) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;

  try {
    const { requirement } = await resolveRequirementForUser(params.id, email);
    if (!requirement) {
      return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });
    }

    const logs = await fetchLogs(requirement.id);
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Logs konnten nicht geladen werden", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Logs." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        { error: "Inhalt für Log-Eintrag fehlt." },
        { status: 400 }
      );
    }

    const email = body.email ?? undefined;
    const { user, requirement } = await resolveRequirementForUser(params.id, email);

    if (!requirement) {
      return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });
    }

    const log = await insertLog({
      requirementId: requirement.id,
      userId: user.id,
      content
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Log konnte nicht gespeichert werden", error);
    return NextResponse.json({ error: "Log konnte nicht angelegt werden." }, { status: 500 });
  }
}
