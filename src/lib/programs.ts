import type { Prisma } from "@prisma/client";

import { programDefinitions } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { createBlueprintFromSource } from "@/lib/program-blueprint";
import type {
  ProgramBlueprint,
  ProgramDefinition,
  ProgramExercise,
  ProgramQualityConfig,
  ProgramResultConfig,
  ProgramRitualStep,
  ProgramRunnerConfig,
  ProgramSchedulingConfig,
  ProgramUnit,
  ProgramXpRulesConfig
} from "@/lib/types";

export type ProgramRecordWithRelations = Prisma.ProgramGetPayload<{
  include: { units: { include: { exercises: true } } };
}>;

const normalizeExercise = (
  exercise: ProgramRecordWithRelations["units"][number]["exercises"][number]
): ProgramExercise => ({
  id: exercise.id,
  label: exercise.label,
  description: exercise.description ?? undefined,
  type: exercise.type as ProgramExercise["type"],
  config: (exercise.config ?? undefined) as ProgramExercise["config"],
  xpValue: exercise.xpValue
});

const normalizeUnit = (unit: ProgramRecordWithRelations["units"][number]): ProgramUnit => ({
  id: unit.id,
  title: unit.title,
  order: unit.order,
  exercises: unit.exercises.map(normalizeExercise)
});

export const normalizeProgramRecord = (
  program: ProgramRecordWithRelations
): ProgramDefinition => {
  const units = program.units
    .slice()
    .sort((left, right) => left.order - right.order)
    .map(normalizeUnit);

  const blueprint = buildBlueprintFromRecord(program, units);

  return {
    id: program.id,
    slug: program.slug,
    code: program.code,
    name: program.name,
    summary: program.summary,
    category: program.category,
    frequency: program.frequency,
    durationMinutes: program.durationMinutes,
    xpReward: program.xpReward,
    mode: program.mode,
    units,
    blueprint
  };
};

export function buildBlueprintFromRecord(
  program: ProgramRecordWithRelations,
  units: ProgramUnit[]
): ProgramBlueprint {
  const defaults = createBlueprintFromSource({
    summary: program.summary,
    category: program.category,
    durationMinutes: program.durationMinutes,
    xpReward: program.xpReward,
    frequency: program.frequency,
    units
  });

  const ritual = Array.isArray(program.ritual)
    ? (program.ritual as ProgramRitualStep[])
    : defaults.ritual;

  const quality = isObject(program.quality)
    ? (program.quality as ProgramQualityConfig)
    : defaults.quality;

  const result = isObject(program.result)
    ? (program.result as ProgramResultConfig)
    : defaults.result;

  const xp = isObject(program.xpRules)
    ? (program.xpRules as ProgramXpRulesConfig)
    : defaults.xp;

  const scheduling = isObject(program.scheduling)
    ? (program.scheduling as ProgramSchedulingConfig)
    : defaults.scheduling;

  const runner = isObject(program.runnerConfig)
    ? (program.runnerConfig as ProgramRunnerConfig)
    : defaults.runner;

  return {
    metadata: {
      ...defaults.metadata,
      type: (program.programType as ProgramBlueprint["metadata"]["type"]) ??
        defaults.metadata.type,
      priority: program.priority ?? defaults.metadata.priority,
      status: program.status ?? defaults.metadata.status,
      defaultTimeWindow:
        program.defaultTimeWindow ?? defaults.metadata.defaultTimeWindow,
      version: program.version ?? defaults.metadata.version
    },
    goals: {
      ...defaults.goals,
      linkedGoalIds: program.linkedGoalIds ?? defaults.goals.linkedGoalIds,
      expectedOutcome: program.expectedOutcome ?? defaults.goals.expectedOutcome
    },
    stateRole: {
      ...defaults.stateRole,
      desiredState: program.desiredState ?? defaults.stateRole.desiredState,
      roleTags: program.roleTags ?? defaults.stateRole.roleTags,
      stateCheckBefore:
        typeof program.stateCheckBefore === "boolean"
          ? program.stateCheckBefore
          : defaults.stateRole.stateCheckBefore,
      stateCheckAfter:
        typeof program.stateCheckAfter === "boolean"
          ? program.stateCheckAfter
          : defaults.stateRole.stateCheckAfter
    },
    ritual,
    quality,
    result,
    xp,
    scheduling,
    runner
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function loadPrograms(): Promise<ProgramDefinition[]> {
  try {
    const records = await prisma.program.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        units: {
          include: {
            exercises: true
          }
        }
      }
    });

    if (records.length === 0) {
      return programDefinitions;
    }

    return records.map(normalizeProgramRecord);
  } catch (error) {
    console.error("Programme konnten nicht geladen werden", error);
    return programDefinitions;
  }
}

export async function loadProgramBySlug(
  slug: string
): Promise<ProgramDefinition | null> {
  try {
    const record = await prisma.program.findUnique({
      where: { slug },
      include: {
        units: {
          include: {
            exercises: true
          }
        }
      }
    });

    if (record) {
      return normalizeProgramRecord(record);
    }
  } catch (error) {
    console.error(`Programm ${slug} konnte nicht geladen werden`, error);
  }

  return programDefinitions.find((program) => program.slug === slug) ?? null;
}
