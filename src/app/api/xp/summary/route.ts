import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  const [balanceAggregate, earnedAggregate, xpByCategory] = await Promise.all([
    // Current Balance (Net: Earnings - Spendings)
    prisma.xpTransaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true }
    }),
    // Total Earned (Gross: Only positive amounts)
    prisma.xpTransaction.aggregate({
      where: {
        userId: user.id,
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    }),
    // Categories based on Earnings only
    prisma.xpTransaction.groupBy({
      by: ["category"],
      where: {
        userId: user.id,
        amount: { gt: 0 }
      },
      _sum: { amount: true }
    })
  ]);

  const categories: Record<string, number> = xpByCategory.reduce(
    (acc, entry) => ({ ...acc, [entry.category]: entry._sum.amount ?? 0 }),
    {}
  );

  const balance = balanceAggregate._sum.amount ?? 0;
  const totalEarned = earnedAggregate._sum.amount ?? 0;

  // Returning 'total' as balance to maintain backward compatibility for now,
  // but adding specific fields for clarity.
  // The frontend components will be updated to use the specific fields.
  return NextResponse.json({
    total: balance,
    balance,
    totalEarned,
    categories
  });
}
