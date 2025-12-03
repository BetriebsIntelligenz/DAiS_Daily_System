"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ProgramDefinition,
  ProgramResultConfig,
  ProgramRitualStep
} from "@/lib/types";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAuth } from "./auth-gate";
import { Button } from "./ui/button";

interface QualityRatings {
  [metricId: string]: number;
}

interface CriteriaState {
  [criterion: string]: boolean;
}

interface RunnerDraft {
  stepIndex: number;
  phase: "steps" | "quality";
  responses: Record<string, unknown>;
  qualityRatings: QualityRatings;
  criteria: CriteriaState;
  resultAnswers: Record<string, string>;
  stateChecks: { before: number | null; after: number | null };
  feasibility: boolean | null;
  isQuickMode: boolean;
  customRulePassed: boolean;
}

function formatSeconds(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function deriveInitialRatings(program: ProgramDefinition): QualityRatings {
  const metrics = program.blueprint.quality.metrics;
  return metrics.reduce<QualityRatings>((acc, metric) => {
    acc[metric.id] = Math.round((metric.min + metric.max) / 2);
    return acc;
  }, {});
}

function deriveInitialResults(program: ProgramDefinition) {
  return program.blueprint.result.questions.reduce<Record<string, string>>(
    (acc, question) => {
      acc[question.id] = "";
      return acc;
    },
    {}
  );
}

function stepHasValue(step: ProgramRitualStep, value: unknown) {
  if (!step.input) return true;
  switch (step.input.type) {
    case "checkbox":
      return typeof value === "boolean" && value === true;
    case "slider":
    case "rating":
      return typeof value === "number";
    case "options":
      return Array.isArray(value) && value.length > 0;
    case "timer":
      return true;
    case "textarea":
    case "text":
    default:
      return typeof value === "string" && value.trim().length > 0;
  }
}

function getStepDuration(step: ProgramRitualStep, quickMode: boolean) {
  const minutes = step.durationMinutes || 5;
  const effective = quickMode ? Math.max(1, Math.round(minutes / 2)) : minutes;
  return Math.max(30, effective * 60);
}

function formatResultValue(question: ProgramResultConfig["questions"][number], value: string) {
  if (question.type === "tags") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return value;
}

export function ProgramRunner({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const steps = program.blueprint.ritual;
  const qualityDefinition = program.blueprint.quality;
  const resultDefinition = program.blueprint.result;
  const xpRules = program.blueprint.xp;
  const scheduling = program.blueprint.scheduling;
  const runnerConfig = program.blueprint.runner;

  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<"steps" | "quality">("steps");
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [qualityRatings, setQualityRatings] = useState<QualityRatings>(() =>
    deriveInitialRatings(program)
  );
  const [criteria, setCriteria] = useState<CriteriaState>({});
  const [resultAnswers, setResultAnswers] = useState<Record<string, string>>(() =>
    deriveInitialResults(program)
  );
  const [stateChecks, setStateChecks] = useState<{ before: number | null; after: number | null }>(
    { before: null, after: null }
  );
  const [feasibility, setFeasibility] = useState<boolean | null>(
    qualityDefinition.requireFeasibilityCheck ? null : true
  );
  const [customRulePassed, setCustomRulePassed] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(() =>
    steps[0] ? getStepDuration(steps[0], false) : 0
  );
  const [timerRunning, setTimerRunning] = useState(false);
  const [draftFound, setDraftFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftKey = useMemo(() => `program-runner-${program.id}` as const, [program.id]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        setDraftFound(true);
      }
    } catch (storageError) {
      console.warn(storageError);
    }
  }, [draftKey]);

  useEffect(() => {
    if (phase !== "steps") return;
    const step = steps[stepIndex];
    if (!step) return;
    setTimerSeconds(getStepDuration(step, isQuickMode));
    setTimerRunning(false);
  }, [steps, stepIndex, isQuickMode, phase]);

  useEffect(() => {
    if (!runnerConfig.showTimers) return;
    if (!timerRunning) return;
    if (phase !== "steps") return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, runnerConfig.showTimers, phase]);

  useEffect(() => {
    try {
      const draft: RunnerDraft = {
        stepIndex,
        phase,
        responses,
        qualityRatings,
        criteria,
        resultAnswers,
        stateChecks,
        feasibility,
        isQuickMode,
        customRulePassed
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (storageError) {
      console.warn("Runner draft konnte nicht gespeichert werden", storageError);
    }
  }, [draftKey, stepIndex, phase, responses, qualityRatings, criteria, resultAnswers, stateChecks, feasibility, isQuickMode, customRulePassed]);

  const currentStep = phase === "steps" ? steps[stepIndex] : undefined;
  const progress = steps.length > 0 ? (Math.min(stepIndex, steps.length) / steps.length) * 100 : 0;

  const qualityAverage = useMemo(() => {
    const values = Object.values(qualityRatings);
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [qualityRatings]);

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      :
        completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;

  const loadDraft = () => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RunnerDraft;
      setStepIndex(parsed.stepIndex ?? 0);
      setPhase(parsed.phase ?? "steps");
      setResponses(parsed.responses ?? {});
      setQualityRatings(parsed.qualityRatings ?? deriveInitialRatings(program));
      setCriteria(parsed.criteria ?? {});
      setResultAnswers(parsed.resultAnswers ?? deriveInitialResults(program));
      setStateChecks(parsed.stateChecks ?? { before: null, after: null });
      setFeasibility(parsed.feasibility ?? (qualityDefinition.requireFeasibilityCheck ? null : true));
      setIsQuickMode(parsed.isQuickMode ?? false);
      setCustomRulePassed(parsed.customRulePassed ?? false);
      setDraftFound(false);
    } catch (storageError) {
      console.warn(storageError);
    }
  };

  const clearDraft = () => {
    try {
      window.localStorage.removeItem(draftKey);
    } catch (storageError) {
      console.warn(storageError);
    }
    setDraftFound(false);
  };

  const updateResponse = (stepId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [stepId]: value }));
  };

  const toggleCriterion = (criterion: string) => {
    setCriteria((prev) => ({ ...prev, [criterion]: !prev[criterion] }));
  };

  const updateQualityRating = (metricId: string, value: number) => {
    setQualityRatings((prev) => ({ ...prev, [metricId]: value }));
  };

  const updateResult = (questionId: string, value: string) => {
    setResultAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNextStep = () => {
    if (phase !== "steps") return;
    if (stepIndex + 1 < steps.length) {
      setStepIndex((prev) => prev + 1);
    } else {
      setPhase("quality");
      setTimerRunning(false);
    }
  };

  const handlePrevStep = () => {
    if (phase !== "steps") return;
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (phase !== "quality") return;
    if (qualityDefinition.requireFeasibilityCheck && feasibility === null) {
      setError("Bitte Feasibility angeben.");
      return;
    }
    if (resultDefinition.questions.some((question) => question.type === "text" && !resultAnswers[question.id])) {
      setError("Bitte die Result-Fragen ausfüllen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const stepPayload = responses;
      const qualityPayload = {
        ratings: qualityRatings,
        criteriaMet: Object.entries(criteria)
          .filter(([, value]) => value)
          .map(([key]) => key),
        feasibility,
        stateCheckBefore: stateChecks.before,
        stateCheckAfter: stateChecks.after,
        customRulePassed
      };
      const resultPayload = Object.entries(resultAnswers).reduce<Record<string, unknown>>(
        (acc, [questionId, value]) => {
          const question = resultDefinition.questions.find((entry) => entry.id === questionId);
          if (!question) {
            acc[questionId] = value;
          } else {
            acc[questionId] = formatResultValue(question, value);
          }
          return acc;
        },
        {}
      );

      const payload = {
        steps: stepPayload,
        quality: qualityPayload,
        results: resultPayload,
        runner: {
          quickMode: isQuickMode,
          completed: true,
          totalSteps: steps.length,
          scheduleHint: scheduling.blocks?.[0]?.block,
          xpRules
        }
      };

      const response = await fetch("/api/program-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: program.id,
          payload,
          userEmail: auth.user?.email,
          userName: auth.user?.name
        })
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body?.error ?? "Programmlauf fehlgeschlagen");
      }
      clearDraft();
      setSaving(false);
      if (completionOverrides?.onProgramCompleted) {
        await completionOverrides.onProgramCompleted(program);
      }
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (requestError) {
      setSaving(false);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Speichern fehlgeschlagen"
      );
    }
  };

  if (steps.length === 0) {
    return (
      <div className="rounded-3xl border border-daisy-200 bg-white/80 p-6 text-sm text-gray-700">
        Für dieses Programm sind noch keine Ritualschritte definiert.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{program.code}</p>
            <h2 className="text-2xl font-semibold text-gray-900">{program.name}</h2>
            <p className="text-sm text-gray-600">{program.summary}</p>
          </div>
          {runnerConfig.quickModeAvailable && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={isQuickMode}
                onChange={(event) => setIsQuickMode(event.target.checked)}
              />
              Quick Mode
            </label>
          )}
        </div>
        {program.blueprint.stateRole.desiredState && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="rounded-full bg-daisy-100 px-3 py-1">
              Desired State: {program.blueprint.stateRole.desiredState}
            </span>
            {program.blueprint.stateRole.roleTags.map((role) => (
              <span key={role} className="rounded-full bg-daisy-50 px-3 py-1">
                {role}
              </span>
            ))}
          </div>
        )}
        {program.blueprint.stateRole.stateCheckBefore && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-600">
              State Check vor dem Programm ({stateChecks.before ?? "-"})
              <input
                type="range"
                min={1}
                max={10}
                value={stateChecks.before ?? 5}
                onChange={(event) =>
                  setStateChecks((prev) => ({ ...prev, before: Number(event.target.value) }))
                }
                className="mt-1 w-full"
              />
            </label>
          </div>
        )}
      </header>

      {draftFound && (
        <div className="flex flex-wrap items-center justify-between rounded-3xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm text-daisy-900">
          <span>Entwurf gefunden – möchtest du fortsetzen?</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearDraft}>
              Verwerfen
            </Button>
            <Button type="button" onClick={loadDraft}>
              Fortsetzen
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-gray-700">
          <span>
            Fortschritt: {Math.min(stepIndex + 1, steps.length)}/{steps.length}
          </span>
          {runnerConfig.showTimers && phase === "steps" && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-daisy-600">{formatSeconds(timerSeconds)}</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setTimerRunning((prev) => !prev)}
              >
                {timerRunning ? "Pause" : "Timer starten"}
              </Button>
            </div>
          )}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-daisy-100">
          <div className="h-full rounded-full bg-daisy-500" style={{ width: `${progress}%` }} />
        </div>
        <ol className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {steps.map((step, index) => {
            const done = phase !== "steps" || index < stepIndex;
            const isCurrent = phase === "steps" && index === stepIndex;
            return (
              <li
                key={step.id}
                className={`rounded-full border px-3 py-1 ${
                  done
                    ? "border-daisy-500 bg-daisy-100 text-daisy-700"
                    : isCurrent
                      ? "border-daisy-400 bg-white"
                      : "border-daisy-100 bg-white"
                }`}
              >
                {step.title}
              </li>
            );
          })}
        </ol>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {phase === "steps" && currentStep && (
        <div className="rounded-3xl border border-daisy-200 bg-white/95 p-6">
          <h3 className="text-xl font-semibold text-gray-900">{currentStep.title}</h3>
          <p className="mt-1 text-sm text-gray-600">{currentStep.description}</p>
          <div className="mt-4">
            <StepInput
              step={currentStep}
              value={responses[currentStep.id]}
              onChange={(value) => updateResponse(currentStep.id, value)}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handlePrevStep} disabled={stepIndex === 0}>
              Zurück
            </Button>
            {currentStep.optional && (
              <Button type="button" variant="ghost" onClick={handleNextStep}>
                Schritt überspringen
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNextStep}
              disabled={!(currentStep.optional || stepHasValue(currentStep, responses[currentStep.id]))}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      {phase === "quality" && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-daisy-200 bg-white/95 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quality Ratings</h3>
            <div className="mt-4 grid gap-3">
              {qualityDefinition.metrics.map((metric) => (
                <label key={metric.id} className="text-sm font-medium text-gray-700">
                  {metric.label}: {qualityRatings[metric.id] ?? metric.min}
                  <input
                    type="range"
                    min={metric.min}
                    max={metric.max}
                    value={qualityRatings[metric.id] ?? metric.min}
                    onChange={(event) => updateQualityRating(metric.id, Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p className="font-semibold">Kriterien</p>
              {qualityDefinition.criteria.map((criterion) => (
                <label key={criterion} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={criteria[criterion] ?? false}
                    onChange={() => toggleCriterion(criterion)}
                  />
                  {criterion}
                </label>
              ))}
            </div>
            {qualityDefinition.requireFeasibilityCheck && (
              <div className="mt-4 flex gap-4 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="feasibility"
                    checked={feasibility === true}
                    onChange={() => setFeasibility(true)}
                  />
                  Realistisch
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="feasibility"
                    checked={feasibility === false}
                    onChange={() => setFeasibility(false)}
                  />
                  Nicht realistisch
                </label>
              </div>
            )}
            {program.blueprint.stateRole.stateCheckAfter && (
              <label className="mt-4 block text-sm font-semibold text-gray-700">
                State Check nach dem Programm ({stateChecks.after ?? "-"})
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stateChecks.after ?? 6}
                  onChange={(event) =>
                    setStateChecks((prev) => ({ ...prev, after: Number(event.target.value) }))
                  }
                  className="mt-1 w-full"
                />
              </label>
            )}
            {xpRules.customRuleLabel && (
              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={customRulePassed}
                  onChange={(event) => setCustomRulePassed(event.target.checked)}
                />
                {xpRules.customRuleLabel}
              </label>
            )}
          </section>

          <section className="rounded-3xl border border-daisy-200 bg-white/95 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Result & Reflektion</h3>
            <div className="mt-4 grid gap-4">
              {resultDefinition.questions.map((question) => (
                <label key={question.id} className="text-sm font-semibold text-gray-700">
                  {question.prompt}
                  {question.type === "tags" ? (
                    <input
                      value={resultAnswers[question.id] ?? ""}
                      onChange={(event) => updateResult(question.id, event.target.value)}
                      placeholder="Tag1, Tag2"
                      className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
                    />
                  ) : (
                    <textarea
                      value={resultAnswers[question.id] ?? ""}
                      onChange={(event) => updateResult(question.id, event.target.value)}
                      className="mt-1 w-full rounded-2xl border border-daisy-200 px-3 py-2"
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-daisy-200 bg-white/95 p-6">
            <h3 className="text-lg font-semibold text-gray-900">XP Vorschau</h3>
            <p className="mt-2 text-sm text-gray-600">
              Basis XP: {xpRules.baseValue} · Durchschnittsqualität: {qualityAverage?.toFixed(1) ?? "-"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
              {xpRules.distribution.map((entry) => (
                <span key={`${entry.area}-${entry.percentage}`} className="rounded-full bg-daisy-50 px-3 py-1">
                  {entry.area}: {entry.percentage}%
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setPhase("steps")}>
                Zurück zu den Schritten
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? "Speichert…" : "Programm abschließen"}
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StepInput({
  step,
  value,
  onChange
}: {
  step: ProgramRitualStep;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (!step.input) {
    return (
      <div className="rounded-2xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm text-gray-700">
        Kein Input erforderlich – konzentriere dich auf den Schritt.
      </div>
    );
  }

  switch (step.input.type) {
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
          />
          Schritt erledigt
        </label>
      );
    case "slider":
    case "rating": {
      const min = step.input.min ?? 1;
      const max = step.input.max ?? 10;
      const numericValue = typeof value === "number" ? value : Math.round((min + max) / 2);
      return (
        <label className="text-sm font-medium text-gray-700">
          {step.input.type === "rating" ? "Rating" : "Slider"}: {numericValue}
          <input
            type="range"
            min={min}
            max={max}
            value={numericValue}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-2 w-full"
          />
        </label>
      );
    }
    case "options": {
      const options = step.input.options ?? [];
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2 text-sm text-gray-700">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(event) => {
                  if (event.target.checked) {
                    onChange([...selected, option]);
                  } else {
                    onChange(selected.filter((entry) => entry !== option));
                  }
                }}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }
    case "textarea":
      return (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={step.input.placeholder}
          className="min-h-[120px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
      );
    case "timer":
      return (
        <div className="rounded-2xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm text-gray-700">
          Timer läuft automatisch – konzentriere dich auf den Schritt.
        </div>
      );
    case "text":
    default:
      return (
        <input
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={step.input.placeholder}
          className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
      );
  }
}
