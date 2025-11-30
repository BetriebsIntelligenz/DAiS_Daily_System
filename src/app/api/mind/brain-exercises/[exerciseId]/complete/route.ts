import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

interface Params {
  exerciseId: string;
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { exerciseId } = params;
  if (!exerciseId) {
    return NextResponse.json({ error: "exerciseId fehlt." }, { status: 400 });
  }

  const body = await request.json();
  const rating =
    typeof body.rating === "number" ? body.rating : Number(body.rating ?? 0);
  const notes = body.notes ? String(body.notes) : null;

  const user = await getOrCreateDemoUser({
    email: body.userEmail ?? undefined,
    name: body.userName ?? undefined
  });

  const session = await prisma.brainExerciseSession.create({
    data: {
      exerciseId,
      userId: user.id,
      rating: Number.isNaN(rating) ? null : rating,
      notes
    }
  });

  return NextResponse.json(session, { status: 201 });
}
