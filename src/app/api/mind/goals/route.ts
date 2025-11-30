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

  const goals = await prisma.mindGoal.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      checkins: user
        ? {
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 50
          }
        : {
            orderBy: { createdAt: "desc" },
            take: 50
          }
    }
  });

  const today = new Date();

  const payload = goals.map((goal) => {
    const checkins = Array.isArray(goal.checkins) ? goal.checkins : [];
    const lastCheckin = checkins[0];
    const checkedToday =
      lastCheckin &&
      new Date(lastCheckin.createdAt).toDateString() === today.toDateString();

    const { checkins: _unused, ...rest } = goal;

    return {
      ...rest,
      latestProgress: lastCheckin?.progressPercent ?? null,
      checkedToday: Boolean(checkedToday),
      lastAssessment: lastCheckin?.selfAssessment ?? null,
      lastCheckinAt: lastCheckin?.createdAt ?? null,
      logs: checkins.map((entry) => ({
        id: entry.id,
        goalId: entry.goalId,
        progressPercent: entry.progressPercent,
        selfAssessment: entry.selfAssessment,
        readThrough: entry.readThrough,
        createdAt: entry.createdAt
      }))
    };
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  const body = await request.json();
  const requiredFields = [
    "title",
    "specific",
    "measurable",
    "achievable",
    "relevant",
    "timeBound"
  ] as const;

  for (const field of requiredFields) {
    if (!String(body[field] ?? "").trim()) {
      return NextResponse.json(
        { error: `Feld ${field} ist erforderlich.` },
        { status: 400 }
      );
    }
  }

  const goal = await prisma.mindGoal.create({
    data: {
      title: body.title,
      specific: body.specific,
      measurable: body.measurable,
      achievable: body.achievable,
      relevant: body.relevant,
      timeBound: body.timeBound,
      metricName: body.metricName,
      targetValue: body.targetValue ?? null,
      unit: body.unit,
      targetDate: body.targetDate ? new Date(body.targetDate) : null
    }
  });

  return NextResponse.json(goal, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { error: "ID wird benötigt." },
      { status: 400 }
    );
  }

  const requiredFields = [
    "title",
    "specific",
    "measurable",
    "achievable",
    "relevant",
    "timeBound"
  ] as const;

  for (const field of requiredFields) {
    if (!String(body[field] ?? "").trim()) {
      return NextResponse.json(
        { error: `Feld ${field} ist erforderlich.` },
        { status: 400 }
      );
    }
  }

  try {
    const goal = await prisma.mindGoal.update({
      where: { id },
      data: {
        title: body.title,
        specific: body.specific,
        measurable: body.measurable,
        achievable: body.achievable,
        relevant: body.relevant,
        timeBound: body.timeBound,
        metricName: body.metricName,
        targetValue: body.targetValue ?? null,
        unit: body.unit,
        targetDate: body.targetDate ? new Date(body.targetDate) : null
      }
    });

    // Optional: Fortschritts-Checkin anlegen
    const progress =
      typeof body.latestProgress === "number"
        ? Math.min(100, Math.max(0, Math.round(body.latestProgress)))
        : null;
    if (progress !== null || body.selfAssessment) {
      await prisma.mindGoalCheckin.create({
        data: {
          goalId: goal.id,
          progressPercent: progress ?? 0,
          selfAssessment: body.selfAssessment ? String(body.selfAssessment) : null,
          userId: null
        }
      });
    }

    return NextResponse.json(goal, { status: 200 });
  } catch (error) {
    console.error("MindGoal update failed", error);
    return NextResponse.json(
      { error: "Ziel konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
