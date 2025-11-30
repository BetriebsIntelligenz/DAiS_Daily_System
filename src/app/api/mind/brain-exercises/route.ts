import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userEmail = searchParams.get("userEmail") ?? undefined;
  const userName = searchParams.get("userName") ?? undefined;

  const user = userEmail
    ? await getOrCreateDemoUser({ email: userEmail, name: userName ?? undefined })
    : null;

  const include: Prisma.BrainExerciseInclude | undefined = user
    ? {
        sessions: {
          where: { userId: user.id },
          orderBy: { completedAt: "desc" as Prisma.SortOrder },
          take: 1
        }
      }
    : undefined;

  const exercises = await prisma.brainExercise.findMany({
    orderBy: { createdAt: "asc" },
    include
  });

  const today = new Date();

  const payload = exercises.map((exercise) => {
    const candidateSessions = (exercise as unknown as { sessions?: unknown }).sessions;
    const sessions = Array.isArray(candidateSessions)
      ? (candidateSessions as { completedAt: string | Date }[])
      : [];
    const lastSession = sessions[0];
    const doneToday =
      lastSession &&
      new Date(lastSession.completedAt).toDateString() === today.toDateString();
    const { sessions: _unused, ...rest } = exercise as typeof exercise & {
      sessions?: unknown;
    };
    return {
      ...rest,
      doneToday: Boolean(doneToday),
      lastCompletedAt: lastSession?.completedAt ?? null
    };
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = String(body.title ?? "").trim();
  const focusArea = String(body.focusArea ?? "").trim();
  const description = String(body.description ?? "").trim();
  const difficulty = Number(body.difficulty ?? 1);
  const durationMinutes = Number(body.durationMinutes ?? 5);
  const rating = body.rating ?? null;

  if (!title || !focusArea || !description) {
    return NextResponse.json(
      { error: "Titel, Fokus und Beschreibung sind Pflichtfelder." },
      { status: 400 }
    );
  }

  const exercise = await prisma.brainExercise.create({
    data: {
      title,
      focusArea,
      description,
      difficulty,
      durationMinutes,
      rating
    }
  });

  return NextResponse.json(exercise, { status: 201 });
}
