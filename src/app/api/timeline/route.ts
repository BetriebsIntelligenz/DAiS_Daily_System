import { NextResponse } from "next/server";

import { getOrCreateDemoUser } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";
import {
  normalizeProgramRecord,
  type ProgramRecordWithRelations
} from "@/lib/programs";
import type {
  ProgramDefinition,
  ProgramResultConfig,
  ProgramRitualStep
} from "@/lib/types";

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
      const normalizedProgram = normalizeProgramRecord(
        run.program as ProgramRecordWithRelations
      );
      const blueprint = normalizedProgram.blueprint;
      const answers =
        typeof run.answers === "object" && run.answers !== null
          ? (run.answers as Record<string, unknown>)
          : {};
      const blueprintDetails = buildBlueprintDetails(
        answers,
        blueprint.ritual
      );
      const fallbackDetails = buildExerciseDetails(answers, normalizedProgram);
      const resultDetails = buildResultDetails(answers, blueprint.result);
      const qualityDetails = buildQualityDetails(answers);
      const formattedAnswers =
        blueprintDetails.length > 0 ? blueprintDetails : fallbackDetails;
      if (qualityDetails.length > 0) {
        formattedAnswers.push(...qualityDetails);
      }
      if (resultDetails.length > 0) {
        formattedAnswers.push(...resultDetails);
      }
      return {
        id: `program-${run.id}`,
        timestamp: formatDate(run.createdAt),
        title: `${normalizedProgram.code} — ${normalizedProgram.name}`,
        category: normalizedProgram.category,
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

function buildBlueprintDetails(
  answers: Record<string, unknown>,
  ritual: ProgramRitualStep[]
) {
  const stepPayload = answers.steps;
  if (!isRecord(stepPayload) || ritual.length === 0) return [];
  return Object.entries(stepPayload)
    .slice(0, 4)
    .map(([stepId, value]) => {
      const step = ritual.find((entry) => entry.id === stepId);
      return `${step?.title ?? stepId}: ${formatValue(value)}`;
    });
}

function buildExerciseDetails(
  answers: Record<string, unknown>,
  program: ProgramDefinition
) {
  const exerciseMap = new Map<string, { label: string; type: string }>();
  program.units.forEach((unit) => {
    unit.exercises.forEach((exercise) => {
      exerciseMap.set(exercise.id, {
        label: exercise.label,
        type: exercise.type
      });
    });
  });
  return Object.entries(answers)
    .filter(([key]) => !["steps", "quality", "results", "runner"].includes(key))
    .slice(0, 4)
    .map(([key, value]) => {
      const exercise = exerciseMap.get(key);
      const label = exercise?.label ?? key;
      let formatted = formatValue(value);
      if (exercise?.type === "scale" && formatted) {
        formatted = `${formatted} Punkte`;
      }
      return `${label}: ${formatted}`;
    });
}

function buildResultDetails(
  answers: Record<string, unknown>,
  resultConfig: ProgramResultConfig
) {
  const resultPayload = answers.results;
  if (!isRecord(resultPayload)) return [];
  return Object.entries(resultPayload)
    .slice(0, 2)
    .map(([questionId, value]) => {
      const question = resultConfig.questions.find((entry) => entry.id === questionId);
      const label = question?.prompt ?? questionId;
      return `${label}: ${formatValue(value)}`;
    });
}

function buildQualityDetails(answers: Record<string, unknown>) {
  const qualityPayload = answers.quality;
  if (!isRecord(qualityPayload)) return [];
  const ratings = qualityPayload.ratings;
  if (!isRecord(ratings)) return [];
  const values = Object.values(ratings).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return [];
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const details = [`Quality Ø ${average.toFixed(1)}/10`];
  if (typeof qualityPayload.stateCheckAfter === "number") {
    details.push(`State nach: ${qualityPayload.stateCheckAfter}/10`);
  }
  return details;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Ja" : "Nein";
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (isRecord(value)) {
    return JSON.stringify(value);
  }
  return String(value ?? "");
}
