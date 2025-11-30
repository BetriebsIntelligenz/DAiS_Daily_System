import { NextResponse } from "next/server";
import type {
  ProgramCategory,
  RequirementArea,
  RequirementStatus
} from "@prisma/client";

import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const statusValues: RequirementStatus[] = [
  "open",
  "in_progress",
  "problem",
  "done"
];

const areaValues: RequirementArea[] = ["privat", "finanzen", "arbeit", "staat"];

function parseStatus(raw: unknown): RequirementStatus | undefined {
  return statusValues.includes(raw as RequirementStatus)
    ? (raw as RequirementStatus)
    : undefined;
}

function parseArea(raw: unknown): RequirementArea | undefined {
  return areaValues.includes(raw as RequirementArea)
    ? (raw as RequirementArea)
    : undefined;
}

function resolveCategory(area: RequirementArea): ProgramCategory {
  switch (area) {
    case "finanzen":
    case "arbeit":
      return "business";
    case "staat":
      return "environment";
    case "privat":
    default:
      return "human";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  try {
    const requirements = await prisma.requirement.findMany({
      where: { userId: user.id },
      orderBy: [{ createdAt: "desc" }]
    });
    return NextResponse.json(requirements);
  } catch (error) {
    console.error("Anforderungen konnten nicht geladen werden", error);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const area = parseArea(body.area);
    if (!body.title || !body.requester || !area) {
      return NextResponse.json(
        { error: "Titel, Anfrager und Bereich sind erforderlich." },
        { status: 400 }
      );
    }

    const user = await getOrCreateDemoUser({ email: body.email ?? undefined });

    const status = parseStatus(body.status) ?? "open";
    const requirement = await prisma.requirement.create({
      data: {
        title: body.title,
        description: body.description ?? null,
        requester: body.requester,
        cost: Number(body.cost) || 0,
        priority: Number(body.priority) || 3,
        xp: Number(body.xp) || 0,
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
        area,
        status,
        userId: user.id
      }
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error("Anforderung konnte nicht erstellt werden", error);
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "ID fehlt." }, { status: 400 });
    }

    const existing = await prisma.requirement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Anforderung nicht gefunden." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description ?? null;
    if (body.requester !== undefined) data.requester = body.requester;
    if (body.cost !== undefined) data.cost = Number(body.cost) || 0;
    if (body.priority !== undefined) data.priority = Number(body.priority) || 3;
    if (body.xp !== undefined) data.xp = Number(body.xp) || 0;
    if (body.targetDate !== undefined) {
      data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
    }
    if (body.area !== undefined) {
      const area = parseArea(body.area);
      if (!area) {
        return NextResponse.json({ error: "Ungültiger Bereich." }, { status: 400 });
      }
      data.area = area;
    }
    if (body.status !== undefined) {
      const status = parseStatus(body.status);
      if (!status) {
        return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben." }, { status: 400 });
    }

    const requirement = await prisma.requirement.update({
      where: { id },
      data
    });

    const transitionedToDone =
      existing.status !== "done" && requirement.status === "done";
    if (transitionedToDone && requirement.xp > 0) {
      const userId =
        requirement.userId ?? (await getOrCreateDemoUser({ email: body.email })).id;
      await prisma.xpTransaction.create({
        data: {
          userId,
          category: resolveCategory(requirement.area),
          amount: requirement.xp,
          type: "earn",
          source: `requirement:${requirement.id}`
        }
      });
    }

    return NextResponse.json(requirement);
  } catch (error) {
    console.error("Anforderung konnte nicht aktualisiert werden", error);
    return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 });
  }
}
