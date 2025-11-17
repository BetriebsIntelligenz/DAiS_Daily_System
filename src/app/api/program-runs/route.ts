import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function POST(request: Request) {
  const body = await request.json();
  const { programId, payload } = body;

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      units: {
        include: { exercises: true }
      }
    }
  });

  if (!program) {
    return NextResponse.json({ error: "Programm nicht gefunden" }, { status: 404 });
  }

  const xpEarned = program.units.reduce((sum, unit) => {
    return (
      sum +
      unit.exercises.reduce((innerSum, exercise) => innerSum + exercise.xpValue, 0)
    );
  }, 0);

  const user = await getOrCreateDemoUser({
    email: body.userEmail,
    name: body.userName
  });

  const run = await prisma.programRun.create({
    data: {
      programId,
      userId: user.id,
      mode: program.mode as "single" | "flow",
      xpEarned,
      answers: payload
    }
  });

  await prisma.xpTransaction.create({
    data: {
      userId: user.id,
      category: program.category,
      amount: xpEarned,
      type: "earn",
      source: "program",
      programRunId: run.id
    }
  });

  return NextResponse.json({ runId: run.id, xpEarned });
}
