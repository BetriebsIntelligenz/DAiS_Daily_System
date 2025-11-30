import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function POST(request: Request) {
  const body = await request.json();
  const goalId = String(body.goalId ?? "");
  const progressPercent = Number(body.progressPercent ?? 0);
  const selfAssessment = body.selfAssessment ? String(body.selfAssessment) : null;
  const readThrough = Boolean(body.readThrough);

  if (!goalId) {
    return NextResponse.json({ error: "goalId fehlt." }, { status: 400 });
  }

  const user = await getOrCreateDemoUser({
    email: body.userEmail ?? undefined,
    name: body.userName ?? undefined
  });

  const checkin = await prisma.mindGoalCheckin.create({
    data: {
      goalId,
      userId: user.id,
      progressPercent,
      selfAssessment,
      readThrough
    }
  });

  return NextResponse.json(checkin, { status: 201 });
}
