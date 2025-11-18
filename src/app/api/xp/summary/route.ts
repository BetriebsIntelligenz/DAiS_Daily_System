import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  const [programRuns, spendAggregate, spendByCategory] = await Promise.all([
    prisma.programRun.findMany({
      where: { userId: user.id },
      include: { program: true }
    }),
    prisma.xpTransaction.aggregate({
      where: { userId: user.id, type: "spend" },
      _sum: { amount: true }
    }),
    prisma.xpTransaction.groupBy({
      by: ["category"],
      where: { userId: user.id, type: "spend" },
      _sum: { amount: true }
    })
  ]);

  const earningsByCategory = programRuns.reduce<Record<string, number>>(
    (acc, run) => {
      const category = run.program.category;
      acc[category] = (acc[category] ?? 0) + run.xpEarned;
      return acc;
    },
    {}
  );

  const spendByCategoryMap = spendByCategory.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.category] = entry._sum.amount ?? 0;
      return acc;
    },
    {}
  );

  const categories: Record<string, number> = {};
  const categoryKeys = new Set([
    ...Object.keys(earningsByCategory),
    ...Object.keys(spendByCategoryMap)
  ]);

  categoryKeys.forEach((key) => {
    categories[key] =
      (earningsByCategory[key] ?? 0) + (spendByCategoryMap[key] ?? 0);
  });

  const totalEarned = Object.values(earningsByCategory).reduce(
    (sum, value) => sum + value,
    0
  );
  const totalSpend = spendAggregate._sum.amount ?? 0;
  const total = totalEarned + totalSpend;

  return NextResponse.json({ total, categories });
}
