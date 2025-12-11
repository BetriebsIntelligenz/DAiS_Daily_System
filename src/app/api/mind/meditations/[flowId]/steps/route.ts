import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  MEDITATION_MIGRATION_HINT,
  prismaSupportsMeditations
} from "../../utils";

interface RouteContext {
  params: { flowId: string };
}

export async function POST(request: Request, context: RouteContext) {
  const flowId = context.params.flowId;
  if (!flowId) {
    return NextResponse.json({ error: "Flow ID fehlt." }, { status: 400 });
  }

  if (!prismaSupportsMeditations()) {
    return NextResponse.json(
      { error: "Meditationsschema nicht initialisiert.", action: MEDITATION_MIGRATION_HINT },
      { status: 503 }
    );
  }

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const description = body.description ? String(body.description).trim() : null;

  if (!title) {
    return NextResponse.json(
      { error: "Titel für den Step wird benötigt." },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.mindMeditationStep.count({ where: { flowId } });

    const step = await prisma.mindMeditationStep.create({
      data: {
        flowId,
        title,
        description,
        order
      }
    });

    return NextResponse.json(step, { status: 201 });
  } catch (error) {
    console.error("Meditation step POST failed", error);
    return NextResponse.json(
      { error: "Step konnte nicht gespeichert werden.", action: MEDITATION_MIGRATION_HINT },
      { status: 500 }
    );
  }
}
