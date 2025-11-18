import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const programs = await prisma.program.findMany({
    include: {
      units: {
        include: {
          exercises: true
        }
      }
    }
  });
  return NextResponse.json(programs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, category } = body;

  const program = await prisma.program.create({
    data: {
      name,
      code: name?.slice(0, 3).toUpperCase() ?? "NEW",
      category,
      slug: name
        ?.toLowerCase()
        ?.replace(/[^a-z0-9]+/g, "-")
        ?.replace(/^-|-$/g, ""),
      summary: body.summary ?? "",
      frequency: body.frequency ?? "daily",
      durationMinutes: body.durationMinutes ?? 10,
      xpReward: body.xpReward ?? 200,
      mode: body.mode ?? "single"
    }
  });

  return NextResponse.json(program, { status: 201 });
}
