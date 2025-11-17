import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [rewards, redemptions] = await Promise.all([
    prisma.reward.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.rewardRedemption.findMany({
      include: { reward: true },
      orderBy: { requestedAt: "desc" },
      take: 20
    })
  ]);

  return NextResponse.json({ rewards, redemptions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const reward = await prisma.reward.create({
    data: {
      name: body.name,
      description: body.description ?? "",
      cost: body.cost ?? 1000,
      active: body.active ?? true
    }
  });
  return NextResponse.json(reward, { status: 201 });
}
