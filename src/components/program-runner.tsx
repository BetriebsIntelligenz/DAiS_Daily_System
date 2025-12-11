"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  ProgramDefinition,
  ProgramQualityMetric,
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
  customRulePassed: boolean;
  timerStates: TimerStateMap;
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
      if (step.input?.optionsRequireMinutes) {
        if (!isOptionsWithMinutesValue(value)) {
          return false;
        }
        if (value.selections.length === 0) {
          return false;
        }
        return value.selections.every((selection) => {
          const minutesValue = value.minutes[selection];
          const parsed = typeof minutesValue === "string" ? Number(minutesValue) : Number(minutesValue ?? 0);
          return Number.isFinite(parsed) && parsed > 0;
        });
      }
      return Array.isArray(value) && value.length > 0;
    case "timer":
      return true;
    case "textarea":
    case "text":
    default:
      return typeof value === "string" && value.trim().length > 0;
  }
}

interface TimerState {
  seconds: number;
  running: boolean;
}

type TimerStateMap = Record<string, TimerState>;

interface OptionsWithMinutesValue {
  selections: string[];
  minutes: Record<string, string>;
}

interface MorgensportLogEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

function isOptionsWithMinutesValue(value: unknown): value is OptionsWithMinutesValue {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<OptionsWithMinutesValue> & { minutes?: unknown };
  return Array.isArray(candidate.selections) && typeof candidate.minutes === "object" && candidate.minutes !== null;
}

function buildInitialTimerStates(steps: ProgramRitualStep[]): TimerStateMap {
  return steps.reduce<TimerStateMap>((acc, step) => {
    acc[step.id] = { seconds: 0, running: false };
    return acc;
  }, {});
}

function mergeTimerStates(source: TimerStateMap | undefined, steps: ProgramRitualStep[]): TimerStateMap {
  const baseline = buildInitialTimerStates(steps);
  if (!source) {
    return baseline;
  }
  let changed = false;
  const next: TimerStateMap = {};
  for (const step of steps) {
    const existing = source[step.id];
    if (existing && typeof existing.seconds === "number") {
      next[step.id] = {
        seconds: existing.seconds,
        running: Boolean(existing.running)
      };
    } else {
      next[step.id] = baseline[step.id];
      changed = true;
    }
  }
  if (Object.keys(source).length !== steps.length) {
    changed = true;
  }
  return changed ? next : source;
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

function buildMorgensportSummary(
  value: unknown,
  metrics: ProgramQualityMetric[],
  ratings: QualityRatings,
  stateCheckAfter: number | null
) {
  if (!isOptionsWithMinutesValue(value) || value.selections.length === 0) {
    return null;
  }
  const items = value.selections.map((selection) => {
    const raw = Number(value.minutes[selection]);
    return {
      label: selection,
      minutes: Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0
    };
  });
  const workoutsHtml = `<ul>${items
    .map((item) => `<li><strong>${item.label}</strong>: ${item.minutes} Min</li>`)
    .join("")}</ul>`;
  const qualityHtml = `<ul>${metrics
    .map((metric) => `<li>${metric.label}: ${ratings[metric.id] ?? metric.min}</li>`)
    .join("")}</ul>`;
  const stateAfter = typeof stateCheckAfter === "number" ? stateCheckAfter : "-";
  const html = `${workoutsHtml}<div class="mt-2"><p class="font-semibold">Quality</p>${qualityHtml}</div><p class="mt-2"><strong>State Check nach dem Programm:</strong> ${stateAfter}</p>`;
  return { html, items };
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
  const MORGENSPORT_PROGRAM_ID = "daily-checklist-body";
  const MORGENSPORT_STEP_ID = "db1-sport-step";
  const isMorgensport = program.id === MORGENSPORT_PROGRAM_ID;

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
    qualityDefinition.requireFeasibilityCheck && !isMorgensport ? null : true
  );
  const [customRulePassed, setCustomRulePassed] = useState(false);
  const [timerStates, setTimerStates] = useState<TimerStateMap>(() =>
    buildInitialTimerStates(steps)
  );
  const [draftFound, setDraftFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [morgensportLogs, setMorgensportLogs] = useState<MorgensportLogEntry[]>([]);
  const [morgensportLogsLoading, setMorgensportLogsLoading] = useState(false);

  const draftKey = useMemo(() => `program-runner-${program.id}` as const, [program.id]);
  const stepVisible = phase === "steps" || isMorgensport;
  const currentStepIndex = steps.length === 0 ? -1 : Math.min(stepIndex, steps.length - 1);
  const currentStep = stepVisible && currentStepIndex >= 0 ? steps[currentStepIndex] : undefined;
  const currentStepId = currentStep?.id ?? null;
  const currentTimer = currentStepId ? timerStates[currentStepId] : undefined;
  const requireFeasibility = qualityDefinition.requireFeasibilityCheck && !isMorgensport;
  const showCriteria = qualityDefinition.criteria.length > 0 && !isMorgensport;
  const showResultSection = !isMorgensport && resultDefinition.questions.length > 0;
  const showXpSection = !isMorgensport;
  const qualitySectionVisible = phase === "quality" || isMorgensport;
  const showCustomRule = Boolean(xpRules.customRuleLabel) && !isMorgensport;

  const qualityMetrics = useMemo(() => {
    if (!isMorgensport) {
      return qualityDefinition.metrics;
    }
    return qualityDefinition.metrics.map((metric) => {
      if (metric.id === "focus") {
        return { ...metric, label: "Kraft" };
      }
      if (metric.id === "depth") {
        return { ...metric, label: "Motivation" };
      }
      return metric;
    });
  }, [qualityDefinition.metrics, isMorgensport]);

  const refreshMorgensportLogs = useCallback(async () => {
    if (!isMorgensport) return;
    setMorgensportLogsLoading(true);
    try {
      const response = await fetch("/api/programs/morgensport/logs");
      if (!response.ok) return;
      const data = (await response.json()) as MorgensportLogEntry[];
      setMorgensportLogs(data);
    } catch (logsError) {
      console.error("Morgensport Logs konnten nicht geladen werden", logsError);
    } finally {
      setMorgensportLogsLoading(false);
    }
  }, [isMorgensport]);

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
    if (!isMorgensport) return;
    refreshMorgensportLogs();
  }, [isMorgensport, refreshMorgensportLogs]);

  useEffect(() => {
    setTimerStates((prev) => {
      const merged = mergeTimerStates(prev, steps);
      return merged === prev ? prev : merged;
    });
  }, [steps]);

  useEffect(() => {
    if (!runnerConfig.showTimers) return;
    if (phase !== "steps") return;
    if (!currentStepId || !currentTimer?.running) return;
    const stepId = currentStepId;
    const interval = window.setInterval(() => {
      setTimerStates((prev) => {
        const target = prev[stepId];
        if (!target || !target.running) {
          return prev;
        }
        return {
          ...prev,
          [stepId]: {
            ...target,
            seconds: target.seconds + 1
          }
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [runnerConfig.showTimers, phase, currentStepId, currentTimer?.running]);

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
        customRulePassed,
        timerStates
      };
      window.localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch (storageError) {
      console.warn("Runner draft konnte nicht gespeichert werden", storageError);
    }
  }, [draftKey, stepIndex, phase, responses, qualityRatings, criteria, resultAnswers, stateChecks, feasibility, customRulePassed, timerStates]);
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
      setFeasibility(parsed.feasibility ?? (requireFeasibility ? null : true));
      setCustomRulePassed(parsed.customRulePassed ?? false);
      setTimerStates(mergeTimerStates(parsed.timerStates, steps));
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
    if (currentStep) {
      setTimerStates((prev) => {
        const state = prev[currentStep.id];
        if (!state?.running) {
          return prev;
        }
        return {
          ...prev,
          [currentStep.id]: { ...state, running: false }
        };
      });
    }
    if (stepIndex + 1 < steps.length) {
      setStepIndex((prev) => prev + 1);
    } else {
      if (!isMorgensport) {
        setPhase("quality");
      }
    }
  };

  const handlePrevStep = () => {
    if (phase !== "steps") return;
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const startTimer = (step: ProgramRitualStep) => {
    setTimerStates((prev) => {
      const current = prev[step.id] ?? { seconds: 0, running: false };
      if (current.running) {
        return prev;
      }
      return {
        ...prev,
        [step.id]: { ...current, running: true }
      };
    });
  };

  const pauseTimer = (step: ProgramRitualStep) => {
    setTimerStates((prev) => {
      const current = prev[step.id];
      if (!current?.running) {
        return prev;
      }
      return {
        ...prev,
        [step.id]: { ...current, running: false }
      };
    });
  };

  const stopTimer = (step: ProgramRitualStep) => {
    setTimerStates((prev) => {
      const current = prev[step.id];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [step.id]: {
          ...current,
          running: false
        }
      };
    });
  };

  useEffect(() => {
    if (phase === "steps") return;
    setTimerStates((prev) => {
      let changed = false;
      const next: TimerStateMap = {};
      for (const [key, value] of Object.entries(prev)) {
        if (value.running) {
          next[key] = { ...value, running: false };
          changed = true;
        } else {
          next[key] = value;
        }
      }
      return changed ? next : prev;
    });
  }, [phase]);

  const handleSubmit = async () => {
    if (phase !== "quality" && !isMorgensport) return;
    if (requireFeasibility && feasibility === null) {
      setError("Bitte Feasibility angeben.");
      return;
    }
    if (showResultSection && resultDefinition.questions.some((question) => question.type === "text" && !resultAnswers[question.id])) {
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
        feasibility: requireFeasibility ? feasibility : true,
        stateCheckBefore: stateChecks.before,
        stateCheckAfter: stateChecks.after,
        customRulePassed: isMorgensport ? true : customRulePassed
      };
      const resultPayload = showResultSection
        ? Object.entries(resultAnswers).reduce<Record<string, unknown>>(
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
          )
        : {};

      const payload = {
        steps: stepPayload,
        quality: qualityPayload,
        results: resultPayload,
        runner: {
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
      if (isMorgensport) {
        const summary = buildMorgensportSummary(
          responses[MORGENSPORT_STEP_ID],
          qualityMetrics,
          qualityRatings,
          stateChecks.after
        );
        if (summary) {
          try {
            await fetch("/api/programs/morgensport/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contentHtml: summary.html,
                userEmail: auth.user?.email,
                userName: auth.user?.name
              })
            });
            await refreshMorgensportLogs();
          } catch (logError) {
            console.error("Morgensport Log konnte nicht gespeichert werden", logError);
          }
        }
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
          {runnerConfig.showTimers && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-daisy-50 px-4 py-3">
              <span className="font-mono text-2xl font-semibold text-daisy-600">
                {formatSeconds(currentTimer?.seconds ?? 0)}
              </span>
              <div className="flex flex-wrap gap-2 text-sm font-medium text-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startTimer(currentStep)}
                  disabled={currentTimer?.running}
                >
                  Start
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pauseTimer(currentStep)}
                  disabled={!currentTimer?.running}
                >
                  Pause
                </Button>
                <Button type="button" variant="ghost" onClick={() => stopTimer(currentStep)}>
                  Stop
                </Button>
              </div>
            </div>
          )}
          <div className="mt-4">
            <StepInput
              step={currentStep}
              value={responses[currentStep.id]}
              onChange={(value) => updateResponse(currentStep.id, value)}
            />
          </div>
          {isMorgensport && currentStep.id === MORGENSPORT_STEP_ID && (
            <details className="mt-4 rounded-2xl border border-daisy-200 bg-white/90 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                Verlauf anzeigen ({morgensportLogs.length})
              </summary>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                {morgensportLogsLoading && <p>Einträge werden geladen…</p>}
                {!morgensportLogsLoading && morgensportLogs.length === 0 && (
                  <p>Noch keine Morgensport-Einträge gespeichert.</p>
                )}
                {morgensportLogs.map((log) => (
                  <article key={log.id} className="rounded-2xl border border-daisy-100 bg-daisy-50/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-daisy-600">
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-gray-800"
                      dangerouslySetInnerHTML={{ __html: log.contentHtml }}
                    />
                  </article>
                ))}
              </div>
            </details>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handlePrevStep} disabled={stepIndex === 0}>
              Zurück
            </Button>
            {currentStep.optional && (
              <Button type="button" variant="ghost" onClick={handleNextStep}>
                Schritt überspringen
              </Button>
            )}
            {!isMorgensport && (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!(currentStep.optional || stepHasValue(currentStep, responses[currentStep.id]))}
              >
                Weiter
              </Button>
            )}
          </div>
        </div>
      )}

      {qualitySectionVisible && (
        <div className="space-y-6">
          <section className="rounded-3xl border border-daisy-200 bg-white/95 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Quality Ratings</h3>
            <div className="mt-4 grid gap-3">
              {qualityMetrics.map((metric) => (
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
            {showCriteria && (
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
            )}
            {requireFeasibility && (
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
            {showCustomRule && (
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

          {showResultSection && (
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
          )}

          {showXpSection && (
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
          )}

          {!showXpSection && (
            <div className="mt-6 flex flex-wrap gap-3">
              {!isMorgensport && (
                <Button type="button" variant="outline" onClick={() => setPhase("steps")}>
                  Zurück zu den Schritten
                </Button>
              )}
              <Button type="button" onClick={handleSubmit} disabled={saving}>
                {saving ? "Speichert…" : "Programm abschließen"}
              </Button>
            </div>
          )}
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
      if (step.input.optionsRequireMinutes) {
        const structuredValue = isOptionsWithMinutesValue(value)
          ? value
          : {
              selections: Array.isArray(value) ? (value as string[]) : [],
              minutes: {}
            };
        const { selections, minutes } = structuredValue;
        return (
          <div className="space-y-3 text-sm text-gray-700">
            {options.map((option) => {
              const selected = selections.includes(option);
              const minuteValue = minutes[option] ?? "";
              return (
                <div
                  key={option}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-daisy-200 bg-white px-4 py-3"
                >
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          onChange({
                            selections: selected ? selections : [...selections, option],
                            minutes
                          });
                        } else {
                          const { [option]: _removed, ...restMinutes } = minutes;
                          onChange({
                            selections: selections.filter((entry) => entry !== option),
                            minutes: restMinutes
                          });
                        }
                      }}
                    />
                    {option}
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Minuten"
                    value={minuteValue}
                    disabled={!selected}
                    onChange={(event) => {
                      const nextMinutes = { ...minutes, [option]: event.target.value };
                      onChange({
                        selections: selected ? selections : [...selections, option],
                        minutes: nextMinutes
                      });
                    }}
                    className="w-24 rounded-xl border border-daisy-200 px-3 py-1 text-sm"
                  />
                </div>
              );
            })}
          </div>
        );
      }
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
