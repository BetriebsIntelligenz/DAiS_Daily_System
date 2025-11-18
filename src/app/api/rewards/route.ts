import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  const [rewards, redemptions, balanceRaw] = await Promise.all([
    prisma.reward.findMany({
      orderBy: { name: "asc" }
    }),
    prisma.rewardRedemption.findMany({
      include: { reward: true },
      orderBy: { requestedAt: "desc" },
      take: 20
    }),
    prisma.xpTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true }
    })
  ]);

  const balance = balanceRaw._sum.amount ?? 0;

  return NextResponse.json({ rewards, redemptions, balance });
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
