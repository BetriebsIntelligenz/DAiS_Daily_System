import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  MEDITATION_MIGRATION_HINT,
  prismaSupportsMeditations
} from "../../../utils";

interface RouteContext {
  params: { flowId: string };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { flowId } = context.params;
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
  const orderArray = Array.isArray(body.order)
    ? body.order.map((id: unknown) => String(id))
    : [];

  if (orderArray.length === 0) {
    return NextResponse.json(
      { error: "Neue Reihenfolge übermitteln." },
      { status: 400 }
    );
  }

  const existingSteps = await prisma.mindMeditationStep.findMany({
    where: { flowId },
    select: { id: true }
  });
  const existingIds = new Set(existingSteps.map((step) => step.id));

  const includesInvalid = orderArray.some((id: string) => !existingIds.has(id));
  if (includesInvalid || existingSteps.length !== orderArray.length) {
    return NextResponse.json(
      { error: "Reihenfolge stimmt nicht mit den vorhandenen Steps überein." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(
      orderArray.map((id: string, index: number) =>
        prisma.mindMeditationStep.update({
          where: { id },
          data: { order: index }
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meditation step reorder failed", error);
    return NextResponse.json(
      { error: "Reihenfolge konnte nicht gespeichert werden.", action: MEDITATION_MIGRATION_HINT },
      { status: 500 }
    );
  }
}
