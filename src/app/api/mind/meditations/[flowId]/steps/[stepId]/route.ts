import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  MEDITATION_MIGRATION_HINT,
  prismaSupportsMeditations
} from "../../../utils";

interface RouteContext {
  params: { flowId: string; stepId: string };
}

export async function PUT(request: Request, context: RouteContext) {
  const { flowId, stepId } = context.params;
  if (!flowId || !stepId) {
    return NextResponse.json({ error: "Ungültige IDs." }, { status: 400 });
  }

  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      { error: "Meditationsschema nicht initialisiert.", action: MEDITATION_MIGRATION_HINT },
      { status: 503 }
    );
  }

  const body = await request.json();
  const title = body.title ? String(body.title).trim() : null;
  const description = body.description ? String(body.description).trim() : null;

  if (!title && !description) {
    return NextResponse.json(
      { error: "Mindestens ein Feld angeben." },
      { status: 400 }
    );
  }

  const existing = await prisma.mindMeditationStep.findUnique({ where: { id: stepId } });
  if (!existing || existing.flowId !== flowId) {
    return NextResponse.json({ error: "Step nicht gefunden." }, { status: 404 });
  }

  const payload: Record<string, string | null> = {};
  if (title !== null) payload.title = title;
  if (description !== null) payload.description = description;

  try {
    const step = await prisma.mindMeditationStep.update({
      where: { id: stepId },
      data: payload
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Meditation step PUT failed", error);
    return NextResponse.json(
      { error: "Step konnte nicht aktualisiert werden.", action: MEDITATION_MIGRATION_HINT },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { flowId, stepId } = context.params;
  if (!flowId || !stepId) {
    return NextResponse.json({ error: "Ungültige IDs." }, { status: 400 });
  }

  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      { error: "Meditationsschema nicht initialisiert.", action: MEDITATION_MIGRATION_HINT },
      { status: 503 }
    );
  }

  try {
    const deletion = await prisma.mindMeditationStep.deleteMany({
      where: { id: stepId, flowId }
    });

    if (deletion.count === 0) {
      return NextResponse.json(
        { error: "Step nicht gefunden." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meditation step DELETE failed", error);
    return NextResponse.json(
      { error: "Step konnte nicht gelöscht werden.", action: MEDITATION_MIGRATION_HINT },
      { status: 500 }
    );
  }
}
