import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { rewardId, redemptionId } = body;

  const reward = await prisma.reward.update({
    where: { id: rewardId },
    data: { active: true }
  });

  if (redemptionId) {
    await prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status: "approved",
        resolvedAt: new Date()
      }
    });
  }

  return NextResponse.json(reward);
}
