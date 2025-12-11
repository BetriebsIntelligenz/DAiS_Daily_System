import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  buildFallbackMeditationFlows,
  MEDITATION_MIGRATION_HINT,
  prismaSupportsMeditations,
  withMigrationHintHeaders
} from "./utils";

export async function GET() {
  if (!prismaSupportsMeditations()) {
    console.warn("Prisma Client wurde noch nicht für MindMeditation* generiert.");
    return withMigrationHintHeaders(NextResponse.json(buildFallbackMeditationFlows()));
  }

  try {
    const flows = await prisma.mindMeditationFlow.findMany({
      orderBy: { order: "asc" },
      include: {
        steps: {
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json(flows);
  } catch (error) {
    console.error("Meditation GET failed — fallback seed data", error);
    return withMigrationHintHeaders(NextResponse.json(buildFallbackMeditationFlows()));
  }
}

export async function POST(request: Request) {
  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      {
        error: "Meditationsschema nicht initialisiert.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const subtitle = body.subtitle ? String(body.subtitle).trim() : null;
  const summary = body.summary ? String(body.summary).trim() : null;

  if (!title) {
    return NextResponse.json(
      { error: "Titel wird benötigt." },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.mindMeditationFlow.count();

    const flow = await prisma.mindMeditationFlow.create({
      data: {
        title,
        subtitle,
        summary,
        order
      }
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error("Meditation POST failed", error);
    return NextResponse.json(
      {
        error: "Meditation konnte nicht gespeichert werden.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      {
        error: "Meditationsschema nicht initialisiert.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const title = body.title ? String(body.title).trim() : null;
  const subtitle = body.subtitle ? String(body.subtitle).trim() : null;
  const summary = body.summary ? String(body.summary).trim() : null;

  if (!id || (!title && !subtitle && !summary)) {
    return NextResponse.json(
      { error: "ID und mindestens ein Feld zum Aktualisieren angeben." },
      { status: 400 }
    );
  }

  const payload: Record<string, string | null> = {};
  if (title !== null) payload.title = title;
  if (subtitle !== null) payload.subtitle = subtitle;
  if (summary !== null) payload.summary = summary;

  try {
    const flow = await prisma.mindMeditationFlow.update({
      where: { id },
      data: payload
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error("Meditation PUT failed", error);
    return NextResponse.json(
      {
        error: "Meditation konnte nicht aktualisiert werden.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      {
        error: "Meditationsschema nicht initialisiert.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { error: "ID zum Löschen wird benötigt." },
      { status: 400 }
    );
  }

  try {
    await prisma.mindMeditationFlow.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meditation DELETE failed", error);
    return NextResponse.json(
      {
        error: "Meditation konnte nicht gelöscht werden.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      {
        error: "Meditationsschema nicht initialisiert.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const orderArray = Array.isArray(body.order)
    ? body.order.map((id: unknown) => String(id))
    : [];

  if (orderArray.length === 0) {
    return NextResponse.json(
      { error: "Reihenfolge fehlt." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      orderArray.map((id: string, index: number) =>
        prisma.mindMeditationFlow.update({
          where: { id },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meditation reorder failed", error);
    return NextResponse.json(
      {
        error: "Reihenfolge konnte nicht gespeichert werden.",
        action: MEDITATION_MIGRATION_HINT
      },
      { status: 500 }
    );
  }
}
