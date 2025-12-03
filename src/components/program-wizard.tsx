"use client";

import { useEffect, useMemo, useState } from "react";

import { createBlueprintFromSource } from "@/lib/program-blueprint";
import type {
  ProgramBlueprint,
  ProgramCategoryName,
  ProgramFrequencyName,
  ProgramGoalsConfig,
  ProgramMetadata,
  ProgramResultConfig,
  ProgramRitualStep,
  ProgramRunnerConfig,
  ProgramSchedulingConfig,
  ProgramStateRoleConfig,
  ProgramTimeWindow,
  ProgramXpRulesConfig
} from "@/lib/types";
import { Button } from "./ui/button";

interface ProgramWizardProps {
  onCreated?: () => Promise<void> | void;
}

interface ProgramWizardState {
  info: {
    name: string;
    summary: string;
    category: ProgramCategoryName;
    frequency: ProgramFrequencyName;
    durationMinutes: number;
    xpReward: number;
    mode: "single" | "flow";
  };
  metadata: ProgramMetadata;
  goals: ProgramGoalsConfig;
  stateRole: ProgramStateRoleConfig;
  ritual: ProgramRitualStep[];
  quality: ProgramBlueprint["quality"];
  result: ProgramResultConfig;
  xp: ProgramXpRulesConfig;
  scheduling: ProgramSchedulingConfig;
  runner: ProgramRunnerConfig;
}

const STEPS = [
  { id: "info", label: "Infos" },
  { id: "goals", label: "Ziele" },
  { id: "state", label: "State & Role" },
  { id: "ritual", label: "Ritual" },
  { id: "quality", label: "Quality" },
  { id: "result", label: "Result" },
  { id: "xp", label: "XP" }
] as const;

type StepId = (typeof STEPS)[number]["id"];

const STORAGE_KEY = "dais-program-wizard";

const CATEGORY_OPTIONS: { id: ProgramCategoryName; label: string }[] = [
  { id: "mind", label: "Mind" },
  { id: "body", label: "Body" },
  { id: "human", label: "Human" },
  { id: "environment", label: "Environment" },
  { id: "business", label: "Business" }
];

const FREQUENCY_OPTIONS: { id: ProgramFrequencyName; label: string }[] = [
  { id: "daily", label: "Täglich" },
  { id: "weekly", label: "Wöchentlich" },
  { id: "monthly", label: "Monatlich" },
  { id: "adhoc", label: "Ad hoc" },
  { id: "block_only", label: "Nur Block" }
];

const TIME_WINDOWS: { id: ProgramTimeWindow; label: string }[] = [
  { id: "morning_block", label: "Morning" },
  { id: "midday_block", label: "Midday" },
  { id: "evening_block", label: "Evening" },
  { id: "business_block", label: "Business" },
  { id: "family_block", label: "Family" },
  { id: "focus_block", label: "Deep Work" }
];

const STEP_TYPES: ProgramRitualStep["stepType"][] = [
  "read",
  "write",
  "meditate",
  "move",
  "speak",
  "plan",
  "timer",
  "check",
  "rating",
  "question"
];

const INPUT_TYPES = [
  "text",
  "textarea",
  "checkbox",
  "slider",
  "timer",
  "rating",
  "options"
] as const;
type InputTypeOption = typeof INPUT_TYPES[number];

function buildDefaultState(): ProgramWizardState {
  const baseBlueprint = createBlueprintFromSource({
    summary: "",
    category: "mind",
    durationMinutes: 15,
    xpReward: 200,
    frequency: "daily",
    units: []
  });

  return {
    info: {
      name: "",
      summary: "",
      category: "mind",
      frequency: "daily",
      durationMinutes: 15,
      xpReward: baseBlueprint.xp.baseValue,
      mode: "flow"
    },
    metadata: baseBlueprint.metadata,
    goals: baseBlueprint.goals,
    stateRole: baseBlueprint.stateRole,
    ritual: baseBlueprint.ritual,
    quality: baseBlueprint.quality,
    result: baseBlueprint.result,
    xp: baseBlueprint.xp,
    scheduling: baseBlueprint.scheduling,
    runner: baseBlueprint.runner
  };
}

function cloneState(state: ProgramWizardState): ProgramWizardState {
  return JSON.parse(JSON.stringify(state)) as ProgramWizardState;
}

function createStepId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `step-${Math.random().toString(36).slice(2, 9)}`;
}

export function ProgramWizard({ onCreated }: ProgramWizardProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<ProgramWizardState>(() => buildDefaultState());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as {
        state: ProgramWizardState;
        stepIndex: number;
      };
      if (cached?.state) {
        setState(cached.state);
      }
      if (typeof cached?.stepIndex === "number") {
        setStepIndex(Math.min(cached.stepIndex, STEPS.length - 1));
      }
    } catch (storageError) {
      console.warn("Wizard state konnte nicht geladen werden", storageError);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, stepIndex })
      );
    } catch (storageError) {
      console.warn("Wizard state konnte nicht gespeichert werden", storageError);
    }
  }, [open, state, stepIndex]);

  const currentStep = STEPS[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const selectedBlocks = useMemo(() => new Set(state.scheduling.blocks.map((entry) => entry.block)), [state.scheduling.blocks]);

  const resetWizard = () => {
    setState(buildDefaultState());
    setStepIndex(0);
    setError(null);
    setSuccess(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (storageError) {
      console.warn(storageError);
    }
  };

  const updateInfo = (patch: Partial<ProgramWizardState["info"]>) => {
    setState((prev) => {
      const nextInfo = { ...prev.info, ...patch };
      const nextState: ProgramWizardState = { ...prev, info: nextInfo };
      if (patch?.frequency && prev.scheduling.blocks.length > 0) {
        nextState.scheduling = {
          ...prev.scheduling,
          blocks: prev.scheduling.blocks.map((entry) => ({
            ...entry,
            recurrence: patch.frequency as ProgramFrequencyName
          }))
        };
      }
      if (patch?.xpReward !== undefined) {
        nextState.xp = { ...prev.xp, baseValue: Number(patch.xpReward) };
      }
      return nextState;
    });
  };

  const updateMetadata = (patch: Partial<ProgramMetadata>) => {
    setState((prev) => ({ ...prev, metadata: { ...prev.metadata, ...patch } }));
  };

  const updateGoals = (patch: Partial<ProgramGoalsConfig>) => {
    setState((prev) => ({ ...prev, goals: { ...prev.goals, ...patch } }));
  };

  const updateStateRole = (patch: Partial<ProgramStateRoleConfig>) => {
    setState((prev) => ({ ...prev, stateRole: { ...prev.stateRole, ...patch } }));
  };

  const updateQuality = (patch: Partial<ProgramWizardState["quality"]>) => {
    setState((prev) => ({ ...prev, quality: { ...prev.quality, ...patch } }));
  };

  const updateResult = (patch: Partial<ProgramResultConfig>) => {
    setState((prev) => ({ ...prev, result: { ...prev.result, ...patch } }));
  };

  const updateXp = (patch: Partial<ProgramXpRulesConfig>) => {
    setState((prev) => ({ ...prev, xp: { ...prev.xp, ...patch } }));
  };

  const updateRunner = (patch: Partial<ProgramRunnerConfig>) => {
    setState((prev) => ({ ...prev, runner: { ...prev.runner, ...patch } }));
  };

  const toggleBlock = (block: ProgramTimeWindow) => {
    setState((prev) => {
      const hasBlock = prev.scheduling.blocks.some((entry) => entry.block === block);
      const blocks = hasBlock
        ? prev.scheduling.blocks.filter((entry) => entry.block !== block)
        : [
            ...prev.scheduling.blocks,
            { block, recurrence: prev.info.frequency }
          ];
      return { ...prev, scheduling: { ...prev.scheduling, blocks } };
    });
  };

  const addRitualStep = () => {
    setState((prev) => ({
      ...prev,
      ritual: [
        ...prev.ritual,
        {
          id: createStepId(),
          title: `Step ${prev.ritual.length + 1}`,
          description: "",
          durationMinutes: 5,
          stepType: "plan",
          input: { type: "textarea", placeholder: "Notizen" }
        }
      ]
    }));
  };

  const updateRitualStep = (index: number, patch: Partial<ProgramRitualStep>) => {
    setState((prev) => {
      const ritual = [...prev.ritual];
      ritual[index] = { ...ritual[index], ...patch };
      return { ...prev, ritual };
    });
  };

  const updateRitualInput = (
    index: number,
    patch: NonNullable<ProgramRitualStep["input"]>
  ) => {
    setState((prev) => {
      const ritual = [...prev.ritual];
      const next = ritual[index];
      ritual[index] = {
        ...next,
        input: { ...(next.input ?? { type: "text" }), ...patch }
      };
      return { ...prev, ritual };
    });
  };

  const moveRitualStep = (index: number, direction: "up" | "down") => {
    setState((prev) => {
      const ritual = [...prev.ritual];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= ritual.length) {
        return prev;
      }
      const [entry] = ritual.splice(index, 1);
      ritual.splice(target, 0, entry);
      return { ...prev, ritual };
    });
  };

  const removeRitualStep = (index: number) => {
    setState((prev) => {
      const ritual = prev.ritual.filter((_, idx) => idx !== index);
      return { ...prev, ritual };
    });
  };

  const addQualityCriterion = () => {
    setState((prev) => ({
      ...prev,
      quality: {
        ...prev.quality,
        criteria: [...prev.quality.criteria, ""]
      }
    }));
  };

  const updateCriterion = (index: number, value: string) => {
    setState((prev) => {
      const criteria = [...prev.quality.criteria];
      criteria[index] = value;
      return { ...prev, quality: { ...prev.quality, criteria } };
    });
  };

  const removeCriterion = (index: number) => {
    setState((prev) => ({
      ...prev,
      quality: {
        ...prev.quality,
        criteria: prev.quality.criteria.filter((_, idx) => idx !== index)
      }
    }));
  };

  const addResultQuestion = () => {
    setState((prev) => ({
      ...prev,
      result: {
        ...prev.result,
        questions: [
          ...prev.result.questions,
          {
            id: `question-${prev.result.questions.length + 1}`,
            prompt: "Neue Frage",
            type: "text"
          }
        ]
      }
    }));
  };

  const updateResultQuestion = (
    index: number,
    patch: Partial<ProgramResultConfig["questions"][number]>
  ) => {
    setState((prev) => {
      const questions = [...prev.result.questions];
      questions[index] = { ...questions[index], ...patch };
      return { ...prev, result: { ...prev.result, questions } };
    });
  };

  const removeResultQuestion = (index: number) => {
    setState((prev) => ({
      ...prev,
      result: {
        ...prev.result,
        questions: prev.result.questions.filter((_, idx) => idx !== index)
      }
    }));
  };

  const addDistributionEntry = () => {
    setState((prev) => ({
      ...prev,
      xp: {
        ...prev.xp,
        distribution: [
          ...prev.xp.distribution,
          { area: prev.info.category, percentage: 100 }
        ]
      }
    }));
  };

  const updateDistribution = (
    index: number,
    patch: Partial<ProgramXpRulesConfig["distribution"][number]>
  ) => {
    setState((prev) => {
      const distribution = [...prev.xp.distribution];
      distribution[index] = { ...distribution[index], ...patch };
      return { ...prev, xp: { ...prev.xp, distribution } };
    });
  };

  const removeDistribution = (index: number) => {
    setState((prev) => ({
      ...prev,
      xp: {
        ...prev.xp,
        distribution: prev.xp.distribution.filter((_, idx) => idx !== index)
      }
    }));
  };

  const validateStep = (stepId: StepId) => {
    if (stepId === "info") {
      if (!state.info.name.trim()) {
        setError("Programmname ist erforderlich.");
        return false;
      }
      if (!state.info.durationMinutes || state.info.durationMinutes <= 0) {
        setError("Dauer muss größer als 0 sein.");
        return false;
      }
    }
    if (stepId === "ritual") {
      if (state.ritual.length === 0) {
        setError("Mindestens ein Ritualschritt erforderlich.");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep.id)) return;
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goPrev = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep("xp")) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const blueprint: ProgramBlueprint = {
        metadata: state.metadata,
        goals: state.goals,
        stateRole: state.stateRole,
        ritual: state.ritual,
        quality: state.quality,
        result: state.result,
        xp: state.xp,
        scheduling: state.scheduling,
        runner: state.runner
      };
      const payload = {
        name: state.info.name,
        category: state.info.category,
        summary: state.info.summary,
        frequency: state.info.frequency,
        durationMinutes: state.info.durationMinutes,
        xpReward: state.xp.baseValue,
        mode: state.info.mode,
        blueprint
      };
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error ?? "Fehler beim Speichern");
      }
      setSuccess("Programm gespeichert.");
      setLoading(false);
      setOpen(false);
      resetWizard();
      if (onCreated) {
        await onCreated();
      }
    } catch (requestError) {
      setLoading(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Speichern fehlgeschlagen"
      );
    }
  };

  const renderInfoStep = () => (
    <div className="space-y-4">
      <input
        value={state.info.name}
        onChange={(event) => updateInfo({ name: event.target.value })}
        placeholder="Programmname"
        className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
      />
      <textarea
        value={state.info.summary}
        onChange={(event) => updateInfo({ summary: event.target.value })}
        placeholder="Beschreibung"
        className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-gray-700">
          Area
          <select
            value={state.info.category}
            onChange={(event) =>
              updateInfo({ category: event.target.value as ProgramCategoryName })
            }
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-gray-700">
          Frequenz
          <select
            value={state.info.frequency}
            onChange={(event) =>
              updateInfo({ frequency: event.target.value as ProgramFrequencyName })
            }
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          >
            {FREQUENCY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm text-gray-700">
          Dauer (Minuten)
          <input
            type="number"
            min={1}
            value={state.info.durationMinutes}
            onChange={(event) =>
              updateInfo({ durationMinutes: Number(event.target.value) })
            }
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          />
        </label>
        <label className="text-sm text-gray-700">
          XP-Basis
          <input
            type="number"
            min={10}
            step={10}
            value={state.xp.baseValue}
            onChange={(event) => {
              const value = Number(event.target.value);
              updateInfo({ xpReward: value });
            }}
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          />
        </label>
        <label className="text-sm text-gray-700">
          Modus
          <select
            value={state.info.mode}
            onChange={(event) => updateInfo({ mode: event.target.value as "single" | "flow" })}
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          >
            <option value="single">Single</option>
            <option value="flow">Flow</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm text-gray-700">
          Program Type
          <select
            value={state.metadata.type}
            onChange={(event) => updateMetadata({ type: event.target.value as ProgramMetadata["type"] })}
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          >
            <option value="routine">Routine</option>
            <option value="training">Training</option>
            <option value="healing">Healing</option>
            <option value="social">Social</option>
            <option value="business">Business</option>
            <option value="spiritual">Spiritual</option>
            <option value="brain">Brain</option>
          </select>
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Priorität
            <select
              value={state.metadata.priority}
              onChange={(event) => updateMetadata({ priority: event.target.value as ProgramMetadata["priority"] })}
              className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
            >
              <option value="core">Core</option>
              <option value="optional">Optional</option>
            </select>
          </label>
          <label className="text-sm text-gray-700">
            Status
            <select
              value={state.metadata.status}
              onChange={(event) => updateMetadata({ status: event.target.value as ProgramMetadata["status"] })}
              className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
            >
              <option value="active">Aktiv</option>
              <option value="archived">Archiviert</option>
              <option value="experimental">Experimentell</option>
            </select>
          </label>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">Zeitfenster & Blöcke</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_WINDOWS.map((window) => (
            <label
              key={window.id}
              className={`flex items-center gap-2 rounded-full border px-4 py-1 text-sm ${selectedBlocks.has(window.id) ? "border-daisy-500 bg-daisy-50" : "border-daisy-200"}`}
            >
              <input
                type="checkbox"
                checked={selectedBlocks.has(window.id)}
                onChange={() => toggleBlock(window.id)}
              />
              {window.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="space-y-4">
      <label className="text-sm text-gray-700">
        Erwarteter Outcome
        <textarea
          value={state.goals.expectedOutcome ?? ""}
          onChange={(event) => updateGoals({ expectedOutcome: event.target.value })}
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
      </label>
      <label className="text-sm text-gray-700">
        Verbundene Ziel IDs (Kommagetrennt)
        <input
          value={state.goals.linkedGoalIds.join(", ")}
          onChange={(event) =>
            updateGoals({
              linkedGoalIds: event.target.value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            })
          }
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
      </label>
    </div>
  );

  const renderStateStep = () => (
    <div className="space-y-4">
      <label className="text-sm text-gray-700">
        Desired State
        <select
          value={state.stateRole.desiredState ?? "focus"}
          onChange={(event) => updateStateRole({ desiredState: event.target.value as ProgramStateRoleConfig["desiredState"] })}
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
        >
          <option value="love">Love</option>
          <option value="happiness">Happiness</option>
          <option value="pride">Pride</option>
          <option value="power">Power</option>
          <option value="calm">Calm</option>
          <option value="focus">Focus</option>
          <option value="gratitude">Gratitude</option>
          <option value="energy">Energy</option>
        </select>
      </label>
      <label className="text-sm text-gray-700">
        Rollen Tags
        <input
          value={state.stateRole.roleTags.join(", ")}
          onChange={(event) =>
            updateStateRole({
              roleTags: event.target.value
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            })
          }
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
      </label>
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.stateRole.stateCheckBefore}
            onChange={(event) => updateStateRole({ stateCheckBefore: event.target.checked })}
          />
          State-Check vor Programm
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.stateRole.stateCheckAfter}
            onChange={(event) => updateStateRole({ stateCheckAfter: event.target.checked })}
          />
          State-Check nach Programm
        </label>
      </div>
    </div>
  );

  const renderRitualStep = () => (
    <div className="space-y-4">
      {state.ritual.map((step, index) => (
        <div key={step.id} className="rounded-2xl border border-daisy-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <input
              value={step.title}
              onChange={(event) => updateRitualStep(index, { title: event.target.value })}
              className="flex-1 rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={step.durationMinutes}
              onChange={(event) => updateRitualStep(index, { durationMinutes: Number(event.target.value) })}
              className="w-24 rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            value={step.description ?? ""}
            onChange={(event) => updateRitualStep(index, { description: event.target.value })}
            placeholder="Beschreibung"
            className="mt-2 w-full rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-gray-700">
              Step Type
              <select
                value={step.stepType}
                onChange={(event) => updateRitualStep(index, { stepType: event.target.value as ProgramRitualStep["stepType"] })}
                className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
              >
                {STEP_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Input Type
              <select
                value={step.input?.type ?? "text"}
                onChange={(event) =>
                  updateRitualInput(index, {
                    type: event.target.value as InputTypeOption
                  })
                }
                className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
              >
                {INPUT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {step.input?.type === "slider" && (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm text-gray-700">
                Min
                <input
                  type="number"
                  value={step.input?.min ?? 1}
                  onChange={(event) => updateRitualInput(index, { min: Number(event.target.value) })}
                  className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
                />
              </label>
              <label className="text-sm text-gray-700">
                Max
                <input
                  type="number"
                  value={step.input?.max ?? 10}
                  onChange={(event) => updateRitualInput(index, { max: Number(event.target.value) })}
                  className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
                />
              </label>
            </div>
          )}
          {step.input?.type === "options" && (
            <label className="text-sm text-gray-700">
              Optionen (Kommagetrennt)
              <input
                value={(step.input.options ?? []).join(", ")}
                onChange={(event) =>
                  updateRitualInput(index, {
                    options: event.target.value
                      .split(",")
                      .map((entry) => entry.trim())
                      .filter(Boolean)
                  })
                }
                className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
              />
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Button type="button" variant="outline" onClick={() => moveRitualStep(index, "up")}>
              Hoch
            </Button>
            <Button type="button" variant="outline" onClick={() => moveRitualStep(index, "down")}>
              Runter
            </Button>
            <Button type="button" variant="ghost" onClick={() => removeRitualStep(index)}>
              Entfernen
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" onClick={addRitualStep}>
        Ritualschritt hinzufügen
      </Button>
    </div>
  );

  const renderQualityStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Quality Kriterien</p>
        {state.quality.criteria.map((criterion, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={criterion}
              onChange={(event) => updateCriterion(index, event.target.value)}
              className="flex-1 rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
            <Button type="button" variant="ghost" onClick={() => removeCriterion(index)}>
              Entfernen
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addQualityCriterion}>
          Kriterium hinzufügen
        </Button>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">Ratings</p>
        {state.quality.metrics.map((metric, index) => (
          <div key={metric.id} className="grid gap-2 md:grid-cols-3">
            <input
              value={metric.label}
              onChange={(event) => {
                const metrics = [...state.quality.metrics];
                metrics[index] = { ...metric, label: event.target.value };
                updateQuality({ metrics });
              }}
              className="rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={metric.min}
              onChange={(event) => {
                const metrics = [...state.quality.metrics];
                metrics[index] = { ...metric, min: Number(event.target.value) };
                updateQuality({ metrics });
              }}
              className="rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={metric.max}
              onChange={(event) => {
                const metrics = [...state.quality.metrics];
                metrics[index] = { ...metric, max: Number(event.target.value) };
                updateQuality({ metrics });
              }}
              className="rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={state.quality.requireFeasibilityCheck}
          onChange={(event) => updateQuality({ requireFeasibilityCheck: event.target.checked })}
        />
        Realitäts-Check nach Programm erfassen
      </label>
    </div>
  );

  const renderResultStep = () => (
    <div className="space-y-4">
      {state.result.questions.map((question, index) => (
        <div key={question.id} className="rounded-2xl border border-daisy-200 p-4">
          <input
            value={question.prompt}
            onChange={(event) => updateResultQuestion(index, { prompt: event.target.value })}
            className="w-full rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
          />
          <select
            value={question.type}
            onChange={(event) => updateResultQuestion(index, { type: event.target.value as ProgramResultConfig["questions"][number]["type"] })}
            className="mt-2 w-full rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
          >
            <option value="text">Freitext</option>
            <option value="tags">Tags</option>
          </select>
          <input
            value={question.placeholder ?? ""}
            onChange={(event) => updateResultQuestion(index, { placeholder: event.target.value })}
            placeholder="Placeholder"
            className="mt-2 w-full rounded-2xl border border-daisy-200 px-3 py-2 text-sm"
          />
          <Button type="button" variant="ghost" className="mt-3" onClick={() => removeResultQuestion(index)}>
            Frage entfernen
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={addResultQuestion}>
        Frage hinzufügen
      </Button>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={state.result.enableLearningTags}
          onChange={(event) => updateResult({ enableLearningTags: event.target.checked })}
        />
        Learning Tags erlauben
      </label>
    </div>
  );

  const renderXpStep = () => (
    <div className="space-y-4">
      <label className="text-sm text-gray-700">
        XP Basiswert
        <input
          type="number"
          min={10}
          step={10}
          value={state.xp.baseValue}
          onChange={(event) => {
            const value = Number(event.target.value);
            updateInfo({ xpReward: value });
          }}
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={state.xp.requireCompletion}
            onChange={(event) => updateXp({ requireCompletion: event.target.checked })}
          />
          Vollständige Durchführung erforderlich
        </label>
        <label className="text-sm text-gray-700">
          Mindestqualität
          <input
            type="number"
            min={1}
            max={10}
            value={state.xp.minQualityScore ?? 7}
            onChange={(event) => updateXp({ minQualityScore: Number(event.target.value) })}
            className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="text-sm text-gray-700">
        Custom Regel
        <input
          value={state.xp.customRuleLabel ?? ""}
          onChange={(event) => updateXp({ customRuleLabel: event.target.value })}
          className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
        />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">XP Verteilung</p>
        {state.xp.distribution.map((entry, index) => (
          <div key={`${entry.area}-${index}`} className="grid gap-2 md:grid-cols-[2fr,1fr,auto]">
            <select
              value={entry.area}
              onChange={(event) => updateDistribution(index, { area: event.target.value as ProgramCategoryName })}
              className="rounded-2xl border border-daisy-200 px-3 py-2"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              max={100}
              value={entry.percentage}
              onChange={(event) => updateDistribution(index, { percentage: Number(event.target.value) })}
              className="rounded-2xl border border-daisy-200 px-3 py-2"
            />
            <Button type="button" variant="ghost" onClick={() => removeDistribution(index)}>
              Entfernen
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addDistributionEntry}>
          Verteilung hinzufügen
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.runner.quickModeAvailable}
            onChange={(event) => updateRunner({ quickModeAvailable: event.target.checked })}
          />
          Quick Mode anbieten
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.runner.resumeEnabled}
            onChange={(event) => updateRunner({ resumeEnabled: event.target.checked })}
          />
          Fortsetzen erlauben
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.runner.showTimers}
            onChange={(event) => updateRunner({ showTimers: event.target.checked })}
          />
          Timer anzeigen
        </label>
      </div>
      <div className="rounded-2xl border border-daisy-100 bg-daisy-50 p-4 text-sm text-gray-700">
        <p className="font-semibold">Checkliste</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Mindestens ein Ritualschritt</li>
          <li>Name & Area gesetzt</li>
          <li>XP Summe verteilt</li>
        </ul>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep.id) {
      case "info":
        return renderInfoStep();
      case "goals":
        return renderGoalsStep();
      case "state":
        return renderStateStep();
      case "ritual":
        return renderRitualStep();
      case "quality":
        return renderQualityStep();
      case "result":
        return renderResultStep();
      case "xp":
        return renderXpStep();
      default:
        return null;
    }
  };

  return (
    <section className="rounded-3xl bg-white/80 p-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Program Wizard</h2>
          <p className="text-sm text-gray-500">
            Schritt-für-Schritt Programme entwerfen inkl. Ziele, Ritual & XP-Regeln.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={resetWizard}>
            Reset
          </Button>
          <Button type="button" onClick={() => setOpen(true)}>
            Wizard öffnen
          </Button>
        </div>
      </header>
      {success && <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</p>}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600">
                  Schritt {stepIndex + 1} / {STEPS.length}
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {currentStep.label}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Schließen
              </Button>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-daisy-100">
              <div
                className="h-full rounded-full bg-daisy-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {error && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 space-y-4">{renderStep()}</div>
            <div className="mt-8 flex flex-wrap justify-between gap-3">
              <div className="text-xs text-gray-500">
                Autosave aktiv – Entwürfe werden lokal gespeichert.
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={goPrev} disabled={stepIndex === 0 || loading}>
                  Zurück
                </Button>
                {stepIndex < STEPS.length - 1 ? (
                  <Button type="button" onClick={goNext} disabled={loading}>
                    Weiter
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Speichert…" : "Programm speichern"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
