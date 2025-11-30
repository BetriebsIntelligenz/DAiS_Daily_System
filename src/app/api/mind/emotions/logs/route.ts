import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function POST(request: Request) {
  const body = await request.json();
  const emotionLabel = String(body.emotionLabel ?? "").trim();
  const intensity = Number(body.intensity ?? 0);
  const note = body.note ? String(body.note) : null;
  const practiceId = body.practiceId ? String(body.practiceId) : null;

  if (!emotionLabel) {
    return NextResponse.json(
      { error: "EmotionLabel ist erforderlich." },
      { status: 400 }
    );
  }

  const user = await getOrCreateDemoUser({
    email: body.userEmail ?? undefined,
    name: body.userName ?? undefined
  });

  const log = await prisma.emotionLog.create({
    data: {
      emotionLabel,
      intensity,
      note,
      practiceId,
      userId: user.id
    }
  });

  return NextResponse.json(log, { status: 201 });
}
