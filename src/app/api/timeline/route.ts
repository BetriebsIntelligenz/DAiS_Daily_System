import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 30;
  const maxLimit = Math.min(limit, 100);
  const email = searchParams.get("email") ?? undefined;
  const user = await getOrCreateDemoUser({ email });

  const [programRuns, journalEntries, rewardRedemptions, requirementXp] =
    await Promise.all([
      prisma.programRun.findMany({
        where: { userId: user.id },
        include: {
          program: {
            include: {
              units: {
                include: {
                  exercises: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: maxLimit
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.id },
        include: { journal: true },
        orderBy: { createdAt: "desc" },
        take: maxLimit
      }),
      prisma.rewardRedemption.findMany({
        where: { userId: user.id },
        include: { reward: true },
        orderBy: { requestedAt: "desc" },
        take: maxLimit
      }),
      prisma.xpTransaction.findMany({
        where: { userId: user.id, source: { startsWith: "requirement:" } },
        orderBy: { createdAt: "desc" },
        take: maxLimit
      })
    ]);

  const requirementIds = requirementXp
    .map((tx) => tx.source?.split(":")[1])
    .filter(Boolean) as string[];

  const requirements = await prisma.requirement.findMany({
    where: { id: { in: requirementIds } }
  });

  const requirementMap = new Map(requirements.map((req) => [req.id, req]));

  const entries = [
    ...programRuns.map((run) => {
      const answers =
        typeof run.answers === "object" && run.answers !== null
          ? (run.answers as Record<string, unknown>)
          : {};

      const exerciseMap = new Map<string, { label: string; type: string }>();
      run.program.units.forEach((unit) => {
        unit.exercises.forEach((exercise) => {
          exerciseMap.set(exercise.id, {
            label: exercise.label,
            type: exercise.type
          });
        });
      });

      const formattedAnswers = Object.entries(answers)
        .slice(0, 4)
        .map(([key, value]) => {
          const exercise = exerciseMap.get(key);
          const label = exercise?.label ?? key;
          let displayValue: string;

          if (Array.isArray(value)) {
            displayValue = value.join(", ");
          } else if (typeof value === "boolean") {
            displayValue = value ? "Ja" : "Nein";
          } else if (typeof value === "number") {
            displayValue = value.toString();
          } else if (typeof value === "object" && value !== null) {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = String(value ?? "");
          }

          if (exercise?.type === "scale" && displayValue) {
            displayValue = `${displayValue} Punkte`;
          }

          return `${label}: ${displayValue}`;
        });

      return {
        id: `program-${run.id}`,
        timestamp: formatDate(run.createdAt),
        title: `${run.program.code} — ${run.program.name}`,
        category: run.program.category,
        type: "program",
        xp: `+${run.xpEarned} XP`,
        details:
          formattedAnswers.length > 0
            ? formattedAnswers
            : [
                `Modus: ${run.mode}`,
                `Dauer: ${run.program.durationMinutes} min`,
                "Keine Antworten angegeben"
              ]
      };
    }),
    ...journalEntries.map((entry) => {
      const plain = (entry.contentHtml ?? "")
        .replace(/<[^>]*>?/gm, "")
        .trim();
      return {
        id: `journal-${entry.id}`,
        timestamp: formatDate(entry.createdAt),
        title: `${entry.journal?.name ?? "Journal"} – neuer Eintrag`,
        category: entry.journal?.type ?? "learn",
        type: "journal",
        xp: "+50 XP",
        details: [plain.slice(0, 160) || "Eintrag gespeichert"]
      };
    }),
    ...rewardRedemptions.map((redemption) => ({
      id: `reward-${redemption.id}`,
      timestamp: formatDate(redemption.requestedAt),
      title: redemption.reward?.name ?? "Belohnung",
      category: "reward",
      type: "reward",
      xp: `-${redemption.reward?.cost ?? 0} XP`,
      details: [
        `Status: ${redemption.status.toUpperCase()}`,
        redemption.notes ?? "Einlösung gestartet"
      ]
    })),
    ...requirementXp
      .map((tx) => {
        const requirementId = tx.source?.split(":")[1];
        const requirement = requirementId
          ? requirementMap.get(requirementId)
          : undefined;
        if (!requirement) return null;
        return {
          id: `requirement-${tx.id}`,
          timestamp: formatDate(tx.createdAt),
          title: requirement.title,
          category: requirement.area,
          type: "requirement",
          xp: `+${tx.amount} XP`,
          details: [
            `Bereich: ${requirement.area.toUpperCase()}`,
            `Status: ${requirement.status.toUpperCase()}`
          ]
        };
      })
      .filter(Boolean) as Array<{
        id: string;
        timestamp: string;
        title: string;
        category: string;
        type: string;
        xp: string;
        details: string[];
      }>
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, maxLimit);

  return NextResponse.json({ entries });
}
