import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return date.toISOString();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 30;
  const maxLimit = Math.min(limit, 100);

  const [programRuns, journalEntries, rewardRedemptions] = await Promise.all([
    prisma.programRun.findMany({
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
      include: { journal: true },
      orderBy: { createdAt: "desc" },
      take: maxLimit
    }),
    prisma.rewardRedemption.findMany({
      include: { reward: true },
      orderBy: { requestedAt: "desc" },
      take: maxLimit
    })
  ]);

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
    }))
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, maxLimit);

  return NextResponse.json({ entries });
}
