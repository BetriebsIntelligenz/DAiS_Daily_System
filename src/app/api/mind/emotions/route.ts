import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail") ?? undefined;
  const userName = searchParams.get("userName") ?? undefined;

  const user = userEmail
    ? await getOrCreateDemoUser({ email: userEmail, name: userName ?? undefined })
    : null;

  const practices = await prisma.emotionPractice.findMany({
    orderBy: { createdAt: "asc" },
    include: user
      ? {
          logs: {
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 3
          }
        }
      : false
  });

  const payload = practices.map((practice) => {
    const steps = Array.isArray(practice.regulationSteps)
      ? practice.regulationSteps.map((step) => String(step))
      : [];
    const logs = Array.isArray(practice.logs) ? practice.logs : [];
    const { logs: _unused, ...rest } = practice;
    return {
      ...rest,
      regulationSteps: steps,
      recentLogs: logs
    };
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const body = await request.json();
  const emotion = String(body.emotion ?? "").trim();
  const summary = String(body.summary ?? "").trim();
  const regulationSteps = Array.isArray(body.regulationSteps)
    ? body.regulationSteps
    : String(body.regulationSteps ?? "")
        .split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean);
  const groundingPrompt = body.groundingPrompt ? String(body.groundingPrompt) : null;

  if (!emotion || !summary || regulationSteps.length === 0) {
    return NextResponse.json(
      { error: "Emotion, Summary und Steps sind erforderlich." },
      { status: 400 }
    );
  }

  const practice = await prisma.emotionPractice.create({
    data: {
      emotion,
      summary,
      regulationSteps,
      groundingPrompt
    }
  });

  return NextResponse.json(practice, { status: 201 });
}
