import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function POST(request: Request) {
  const body = await request.json();
  const reward = await prisma.reward.findUnique({
    where: { id: body.rewardId }
  });

  if (!reward) {
    return NextResponse.json(
      { error: "Reward nicht gefunden" },
      { status: 404 }
    );
  }

  const user = await getOrCreateDemoUser({
    email: body.userEmail,
    name: body.userName
  });

  const redemption = await prisma.rewardRedemption.create({
    data: {
      rewardId: reward.id,
      userId: user.id,
      status: "pending"
    }
  });

  await prisma.reward.update({
    where: { id: reward.id },
    data: { active: false }
  });

  await prisma.xpTransaction.create({
    data: {
      userId: user.id,
      category: "mind",
      amount: -reward.cost,
      type: "spend",
      source: "reward",
      rewardRedemptionId: redemption.id
    }
  });

  return NextResponse.json(redemption);
}
