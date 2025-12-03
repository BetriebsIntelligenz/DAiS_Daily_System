import type {
  ProgramBlueprint,
  ProgramCategoryName,
  ProgramFrequencyName,
  ProgramGoalsConfig,
  ProgramMetadata,
  ProgramExercise,
  ProgramQualityConfig,
  ProgramResultConfig,
  ProgramRitualStep,
  ProgramSchedulingConfig,
  ProgramStateRoleConfig,
  ProgramTimeWindow,
  ProgramUnit,
  ProgramXpDistribution,
  ProgramXpRulesConfig
} from "./types";

interface BlueprintSource {
  summary?: string;
  category: ProgramCategoryName;
  durationMinutes: number;
  xpReward: number;
  frequency: ProgramFrequencyName;
  units: ProgramUnit[];
}

const CATEGORY_WINDOWS: Record<ProgramCategoryName, ProgramTimeWindow> = {
  mind: "morning_block",
  body: "midday_block",
  human: "evening_block",
  environment: "midday_block",
  business: "business_block"
};

const CATEGORY_STATE: Record<ProgramCategoryName, ProgramStateRoleConfig["desiredState"]> = {
  mind: "focus",
  body: "energy",
  human: "love",
  environment: "gratitude",
  business: "power"
};

const CATEGORY_TYPE: Record<ProgramCategoryName, ProgramMetadata["type"]> = {
  mind: "brain",
  body: "training",
  human: "social",
  environment: "healing",
  business: "business"
};

const DEFAULT_RESULT: ProgramResultConfig = {
  questions: [
    { id: "result", prompt: "Was habe ich konkret erreicht?", type: "text" },
    {
      id: "state-change",
      prompt: "Was hat sich an meinem State oder Verhalten verändert?",
      type: "text"
    },
    { id: "takeaway", prompt: "Was nehme ich mit?", type: "text" }
  ],
  enableLearningTags: true
};

const DEFAULT_QUALITY: ProgramQualityConfig = {
  criteria: [
    "Programm vollständig durchgezogen",
    "Mind mindestens 70% Fokus"
  ],
  metrics: [
    { id: "focus", label: "Fokus", min: 1, max: 10 },
    { id: "depth", label: "Tiefe", min: 1, max: 10 },
    { id: "satisfaction", label: "Zufriedenheit", min: 1, max: 10 }
  ],
  requireFeasibilityCheck: true
};

const DEFAULT_SCHEDULING: ProgramSchedulingConfig = {
  blocks: [],
  ninetyDayTags: []
};

const DEFAULT_RUNNER = {
  quickModeAvailable: true,
  resumeEnabled: true,
  showTimers: true
} satisfies ProgramBlueprint["runner"];

function convertUnitsToRitual(
  units: ProgramUnit[],
  durationMinutes: number,
  summary?: string
): ProgramRitualStep[] {
  const exercises = units.flatMap((unit) => unit.exercises);
  if (exercises.length === 0) {
    return [
      {
        id: "default-ritual-step",
        title: "Ritual durchführen",
        description: summary ?? "Geführter Ablauf im Program Runner",
        durationMinutes: Math.max(5, durationMinutes),
        stepType: "plan",
        input: { type: "textarea", placeholder: "Notizen / Learnings" }
      }
    ];
  }

  const perStepDuration = Math.max(2, Math.round(durationMinutes / exercises.length));
  return exercises.map((exercise) => {
    const base: ProgramRitualStep = {
      id: `${exercise.id}-step`,
      title: exercise.label,
      description: exercise.description,
      durationMinutes: perStepDuration,
      stepType: mapExerciseType(exercise.type)
    };

    const input = mapExerciseInput(exercise.type, exercise.config);
    return input ? { ...base, input } : base;
  });
}

function mapExerciseType(type: ProgramExercise["type"]): ProgramRitualStep["stepType"] {
  switch (type) {
    case "checkbox":
      return "check";
    case "scale":
      return "rating";
    case "multiselect":
      return "question";
    case "number":
      return "plan";
    case "html":
    case "text":
    default:
      return "write";
  }
}

function mapExerciseInput(
  type: ProgramExercise["type"],
  config?: ProgramExercise["config"]
) {
  switch (type) {
    case "checkbox":
      return { type: "checkbox" } satisfies ProgramRitualStep["input"];
    case "scale": {
      const min = typeof config?.scaleMin === "number" ? config.scaleMin : 1;
      const max = typeof config?.scaleMax === "number" ? config.scaleMax : 10;
      return {
        type: "slider",
        min,
        max,
        step: 1
      } satisfies ProgramRitualStep["input"];
    }
    case "multiselect": {
      const options = Array.isArray(config?.options) ? config?.options : [];
      return {
        type: "options",
        options
      } satisfies ProgramRitualStep["input"];
    }
    case "number":
      return {
        type: "text",
        placeholder: "Zahl notieren"
      } satisfies ProgramRitualStep["input"];
    case "html":
    case "text":
    default:
      return {
        type: "textarea",
        placeholder: "Antwort eingeben"
      } satisfies ProgramRitualStep["input"];
  }
}

function deriveXpDistribution(category: ProgramCategoryName): ProgramXpDistribution[] {
  return [{ area: category, percentage: 100 }];
}

function buildMetadata(
  source: BlueprintSource,
  overrides?: Partial<ProgramMetadata>
): ProgramMetadata {
  const defaultWindow = CATEGORY_WINDOWS[source.category];
  return {
    type: overrides?.type ?? CATEGORY_TYPE[source.category],
    priority: overrides?.priority ?? "core",
    status: overrides?.status ?? "active",
    defaultTimeWindow: overrides?.defaultTimeWindow ?? defaultWindow,
    version: overrides?.version ?? 1
  };
}

function buildGoals(source: BlueprintSource, overrides?: Partial<ProgramGoalsConfig>) {
  return {
    linkedGoalIds: overrides?.linkedGoalIds ?? [],
    expectedOutcome:
      overrides?.expectedOutcome ??
      source.summary ??
      "Programm Outcome im Admin beschreiben"
  } satisfies ProgramGoalsConfig;
}

function buildStateRole(
  source: BlueprintSource,
  overrides?: Partial<ProgramStateRoleConfig>
): ProgramStateRoleConfig {
  return {
    desiredState: overrides?.desiredState ?? CATEGORY_STATE[source.category],
    roleTags: overrides?.roleTags ?? [],
    stateCheckBefore: overrides?.stateCheckBefore ?? false,
    stateCheckAfter: overrides?.stateCheckAfter ?? true
  };
}

function buildScheduling(
  source: BlueprintSource,
  overrides?: Partial<ProgramSchedulingConfig>
): ProgramSchedulingConfig {
  if (overrides) {
    return {
      blocks: overrides.blocks ?? DEFAULT_SCHEDULING.blocks,
      ninetyDayTags: overrides.ninetyDayTags ?? []
    };
  }
  return {
    blocks: [
      {
        block: CATEGORY_WINDOWS[source.category],
        recurrence: source.frequency
      }
    ],
    ninetyDayTags: []
  };
}

function buildXpRules(
  source: BlueprintSource,
  overrides?: Partial<ProgramXpRulesConfig>
): ProgramXpRulesConfig {
  return {
    baseValue: overrides?.baseValue ?? source.xpReward,
    requireCompletion: overrides?.requireCompletion ?? true,
    minQualityScore: overrides?.minQualityScore ?? 7,
    customRuleLabel: overrides?.customRuleLabel ?? "Regel-Check erfüllt",
    distribution: overrides?.distribution ?? deriveXpDistribution(source.category)
  };
}

export function createBlueprintFromSource(
  source: BlueprintSource,
  overrides?: Partial<ProgramBlueprint>
): ProgramBlueprint {
  const ritual = overrides?.ritual ?? convertUnitsToRitual(source.units, source.durationMinutes, source.summary);
  return {
    metadata: buildMetadata(source, overrides?.metadata),
    goals: buildGoals(source, overrides?.goals),
    stateRole: buildStateRole(source, overrides?.stateRole),
    ritual,
    quality: overrides?.quality ?? DEFAULT_QUALITY,
    result: overrides?.result ?? DEFAULT_RESULT,
    xp: buildXpRules(source, overrides?.xp),
    scheduling: buildScheduling(source, overrides?.scheduling),
    runner: overrides?.runner ?? DEFAULT_RUNNER
  };
}

export function blueprintToPersistenceColumns(blueprint: ProgramBlueprint) {
  return {
    programType: blueprint.metadata.type,
    priority: blueprint.metadata.priority,
    status: blueprint.metadata.status,
    defaultTimeWindow: blueprint.metadata.defaultTimeWindow ?? null,
    version: blueprint.metadata.version,
    linkedGoalIds: blueprint.goals.linkedGoalIds,
    expectedOutcome: blueprint.goals.expectedOutcome ?? null,
    desiredState: blueprint.stateRole.desiredState ?? null,
    roleTags: blueprint.stateRole.roleTags,
    stateCheckBefore: blueprint.stateRole.stateCheckBefore,
    stateCheckAfter: blueprint.stateRole.stateCheckAfter,
    ritual: blueprint.ritual,
    quality: blueprint.quality,
    result: blueprint.result,
    xpRules: blueprint.xp,
    runnerConfig: blueprint.runner,
    scheduling: blueprint.scheduling,
    menuLogic: {
      blocks: blueprint.scheduling.blocks.map((entry) => entry.block)
    }
  };
}

export type { BlueprintSource };
