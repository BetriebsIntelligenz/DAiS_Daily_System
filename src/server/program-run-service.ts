import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { programDefinitions } from "@/lib/data";
import { blueprintToPersistenceColumns } from "@/lib/program-blueprint";
import {
  normalizeProgramRecord,
  type ProgramRecordWithRelations
} from "@/lib/programs";
import type { ProgramBlueprint, ProgramXpDistribution } from "@/lib/types";

interface CreateProgramRunParams {
  programId: string;
  payload: Record<string, unknown>;
  userEmail?: string;
  userName?: string;
}

export async function createProgramRun({
  programId,
  payload,
  userEmail,
  userName
}: CreateProgramRunParams) {
  let program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      units: {
        include: { exercises: true }
      }
    }
  });

  if (!program) {
    const definition =
      programDefinitions.find(
        (candidate) => candidate.id === programId || candidate.slug === programId
      ) ?? null;

    if (!definition) {
      throw new Error("Programm nicht gefunden");
    }

    const blueprintColumns = blueprintToPersistenceColumns(definition.blueprint);

    const createdProgram = await prisma.program.create({
      data: {
        id: definition.id,
        slug: definition.slug,
        code: definition.code,
        name: definition.name,
        summary: definition.summary,
        category: definition.category,
        frequency: definition.frequency,
        durationMinutes: definition.durationMinutes,
        xpReward: definition.xpReward,
        mode: definition.mode,
        ...blueprintColumns,
        units: {
          create: definition.units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            order: unit.order,
            exercises: {
              create: unit.exercises.map((exercise) => ({
                id: exercise.id,
                label: exercise.label,
                description: exercise.description,
                type: exercise.type,
                config: JSON.parse(JSON.stringify(exercise.config ?? {})),
                xpValue: exercise.xpValue
              }))
            }
          }))
        }
      },
      include: {
        units: {
          include: { exercises: true }
        }
      }
    });

    program = createdProgram;
  }

  const user = await getOrCreateDemoUser({
    email: userEmail,
    name: userName
  });

  const normalizedProgram = normalizeProgramRecord(program as ProgramRecordWithRelations);
  const blueprint = normalizedProgram.blueprint;
  const xpEarned = evaluateXpEarned(blueprint, normalizedProgram.xpReward, payload);

  const run = await prisma.programRun.create({
    data: {
      programId,
      userId: user.id,
      mode: program.mode,
      xpEarned,
      answers: JSON.parse(JSON.stringify(payload ?? {}))
    }
  });

  if (xpEarned > 0) {
    const distribution = buildXpDistribution(blueprint.xp.distribution, normalizedProgram.category);
    let distributed = 0;
    const entries = distribution.map((entry) => {
      const amount = Math.round((xpEarned * entry.percentage) / 100);
      distributed += amount;
      return { ...entry, amount };
    });
    if (entries.length > 0 && distributed !== xpEarned) {
      entries[0].amount += xpEarned - distributed;
    }
    for (const entry of entries) {
      if (entry.amount <= 0) continue;
      await prisma.xpTransaction.create({
        data: {
          userId: user.id,
          category: entry.area,
          amount: entry.amount,
          type: "earn",
          source: "program",
          programRunId: run.id
        }
      });
    }
  }

  return { runId: run.id, xpEarned };
}

function evaluateXpEarned(
  blueprint: ProgramBlueprint,
  fallbackXp: number,
  payload: Record<string, unknown> | undefined
) {
  const xpRules = blueprint?.xp;
  const base = xpRules?.baseValue ?? fallbackXp;
  if (!xpRules) return base;

  const runnerInfo =
    typeof payload === "object" && payload !== null
      ? ((payload as { runner?: { completed?: boolean } }).runner ?? {})
      : {};
  if (xpRules.requireCompletion && runnerInfo.completed === false) {
    return 0;
  }

  const qualityPayload =
    typeof payload === "object" && payload !== null
      ? ((payload as {
          quality?: { ratings?: Record<string, number>; customRulePassed?: boolean };
        }).quality ?? {})
      : {};

  if (xpRules.minQualityScore) {
    const ratings = qualityPayload.ratings;
    const values = ratings ? Object.values(ratings) : [];
    if (values.length > 0) {
      const average = values.reduce((sum, value) => sum + value, 0) / values.length;
      if (average < xpRules.minQualityScore) {
        return 0;
      }
    }
  }

  if (xpRules.customRuleLabel) {
    const hasCustomFlag = Object.prototype.hasOwnProperty.call(qualityPayload, "customRulePassed");
    const customPassed = hasCustomFlag ? Boolean(qualityPayload.customRulePassed) : true;
    if (!customPassed) {
      return 0;
    }
  }

  return base;
}

function buildXpDistribution(
  entries: ProgramXpDistribution[] | undefined,
  fallbackArea: string
): ProgramXpDistribution[] {
  if (!entries || entries.length === 0) {
    return [{ area: fallbackArea, percentage: 100 }];
  }
  return entries;
}
