import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  const [xpAggregate, xpByCategory] = await Promise.all([
    prisma.xpTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true }
    }),
    prisma.xpTransaction.groupBy({
      by: ["category"],
      where: { userId: user.id },
      _sum: { amount: true }
    })
  ]);

  const categories: Record<string, number> = xpByCategory.reduce(
    (acc, entry) => ({ ...acc, [entry.category]: entry._sum.amount ?? 0 }),
    {}
  );

  const total = xpAggregate._sum.amount ?? 0;

  return NextResponse.json({ total, categories });
}
