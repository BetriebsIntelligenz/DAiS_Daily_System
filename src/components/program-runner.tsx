"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { ProgramDefinition, ProgramRitualStep } from "@/lib/types";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAuth } from "./auth-gate";
import { Button } from "./ui/button";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

interface RunnerDraft {
  responses: Record<string, unknown>;
}

interface OptionsWithMinutesValue {
  selections: string[];
  minutes: Record<string, string>;
}

interface MorgensportLogEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

interface StateControlLogEntry {
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

function buildMorgensportSummary(value: unknown) {
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
  if (items.every((item) => item.minutes === 0)) {
    return null;
  }
  const workoutsHtml = `<ul>${items
    .map((item) => `<li><strong>${item.label}</strong>: ${item.minutes} Min</li>`)
    .join("")}</ul>`;
  return workoutsHtml;
}

function buildStateControlSummary(
  steps: ProgramRitualStep[],
  responses: Record<string, unknown>
) {
  if (steps.length === 0) {
    return null;
  }
  const items = steps.map((step) => {
    const rawValue = responses[step.id];
    const value = typeof rawValue === "number" ? rawValue : null;
    const max =
      typeof step.input?.max === "number"
        ? step.input.max
        : typeof step.input?.min === "number"
          ? step.input.min
          : 10;
    return {
      title: step.title,
      value,
      max
    };
  });

  if (items.every((item) => item.value === null)) {
    return null;
  }

  const listHtml = `<ul>${items
    .map((item) => `<li><strong>${item.title}:</strong> ${item.value ?? "-"} / ${item.max}</li>`)
    .join("")}</ul>`;
  return listHtml;
}

export function ProgramRunner({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const steps = program.blueprint.ritual ?? [];
  const xpRules = program.blueprint.xp;
  const scheduling = program.blueprint.scheduling;
  const MORGENSPORT_PROGRAM_ID = "daily-checklist-body";
  const MORGENSPORT_STEP_ID = "db1-sport-step";
  const STATE_CONTROL_PROGRAM_ID = "state-controll";
  const isMorgensport = program.id === MORGENSPORT_PROGRAM_ID;
  const isStateControl = program.id === STATE_CONTROL_PROGRAM_ID;

  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftFound, setDraftFound] = useState(false);
  const [morgensportLogs, setMorgensportLogs] = useState<MorgensportLogEntry[]>([]);
  const [morgensportLogsLoading, setMorgensportLogsLoading] = useState(false);
  const [stateControlLogs, setStateControlLogs] = useState<StateControlLogEntry[]>([]);
  const [stateControlLogsLoading, setStateControlLogsLoading] = useState(false);

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      :
        completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;

  const draftKey = useMemo(() => `program-runner-${program.id}` as const, [program.id]);

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

  const refreshStateControlLogs = useCallback(async () => {
    if (!isStateControl) return;
    setStateControlLogsLoading(true);
    try {
      const response = await fetch("/api/programs/state-controll/logs");
      if (!response.ok) return;
      const data = (await response.json()) as StateControlLogEntry[];
      setStateControlLogs(data);
    } catch (logsError) {
      console.error("State Controll Logs konnten nicht geladen werden", logsError);
    } finally {
      setStateControlLogsLoading(false);
    }
  }, [isStateControl]);

  useEffect(() => {
    if (!isMorgensport) return;
    void refreshMorgensportLogs();
  }, [isMorgensport, refreshMorgensportLogs]);

  useEffect(() => {
    if (!isStateControl) return;
    void refreshStateControlLogs();
  }, [isStateControl, refreshStateControlLogs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        setDraftFound(true);
      }
    } catch (storageError) {
      console.warn(storageError);
    }
  }, [draftKey]);

  const loadDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RunnerDraft;
      setResponses(parsed.responses ?? {});
      setDraftFound(false);
    } catch (storageError) {
      console.warn(storageError);
    }
  }, [draftKey]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(draftKey);
      } catch (storageError) {
        console.warn(storageError);
      }
    }
    setDraftFound(false);
    setResponses({});
  }, [draftKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (Object.keys(responses).length === 0) {
        window.localStorage.removeItem(draftKey);
        return;
      }
      const payload: RunnerDraft = { responses };
      window.localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch (storageError) {
      console.warn("Runner draft konnte nicht gespeichert werden", storageError);
    }
  }, [draftKey, responses]);

  const updateResponse = (stepId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [stepId]: value }));
  };

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        steps: responses,
        quality: { customRulePassed: true },
        results: {},
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
        const summary = buildMorgensportSummary(responses[MORGENSPORT_STEP_ID]);
        if (summary) {
          try {
            await fetch("/api/programs/morgensport/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contentHtml: summary,
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

      if (isStateControl) {
        const summary = buildStateControlSummary(steps, responses);
        if (summary) {
          try {
            await fetch("/api/programs/state-controll/logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contentHtml: summary,
                userEmail: auth.user?.email,
                userName: auth.user?.name
              })
            });
            await refreshStateControlLogs();
          } catch (logError) {
            console.error("State Controll Log konnte nicht gespeichert werden", logError);
          }
        }
      }

      clearDraft();
      setResponses({});

      if (completionOverrides?.onProgramCompleted) {
        await completionOverrides.onProgramCompleted(program);
      }

      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Speichern fehlgeschlagen"
      );
    } finally {
      setSaving(false);
    }
  }, [
    responses,
    steps,
    scheduling.blocks,
    xpRules,
    program,
    auth.user?.email,
    auth.user?.name,
    completionOverrides,
    successRedirect,
    isMorgensport,
    isStateControl,
    refreshMorgensportLogs,
    refreshStateControlLogs,
    clearDraft,
    router
  ]);

  const autoSubmitEnabled = useAutoProgramSubmit(handleSubmit);

  if (steps.length === 0) {
    return (
      <div className="rounded-3xl border border-daisy-200 bg-white/80 p-6 text-sm text-gray-700">
        Für dieses Programm sind noch keine Eingaben erforderlich.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="retro-panel p-6 text-[#0b1230]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-arcade text-[10px] uppercase tracking-[0.4em] text-[#7480c1]">
              {program.code}
            </p>
            <h2 className="text-2xl font-semibold text-[#070f2c]">{program.name}</h2>
            <p className="text-sm text-[#4b5685]">{program.summary}</p>
          </div>
        </div>
        {program.blueprint.stateRole.desiredState && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#4b5685]">
            <span className="retro-chip">
              Desired State: {program.blueprint.stateRole.desiredState}
            </span>
            {program.blueprint.stateRole.roleTags.map((role) => (
              <span key={role} className="retro-chip">
                {role}
              </span>
            ))}
          </div>
        )}
      </header>

      {draftFound && (
        <div className="flex flex-wrap items-center justify-between rounded-[26px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm text-[#0b1230] shadow-arcade">
          <span>Entwurf gefunden – möchtest du fortsetzen?</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={clearDraft}>
              Verwerfen
            </Button>
            <Button type="button" variant="lagoon" onClick={loadDraft}>
              Fortsetzen
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-[26px] border-4 border-[#ff95b2] bg-[#ffe4ec] px-4 py-3 text-sm text-[#7a132c] shadow-arcade">
          {error}
        </div>
      )}

      {isStateControl ? (
        <div className="space-y-4">
          <StateControlSummary steps={steps} responses={responses} />
          <StateControlTable
            steps={steps}
            responses={responses}
            onChange={updateResponse}
            onSubmit={() => void handleSubmit()}
            submitting={saving}
            showSubmitButton={!autoSubmitEnabled}
            logs={stateControlLogs}
            loading={stateControlLogsLoading}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step) => (
            <article key={step.id} className="retro-panel p-6">
              <header>
                <h3 className="text-xl font-semibold text-[#0b1230]">{step.title}</h3>
                {step.description && (
                  <p className="mt-1 text-sm text-[#4b5685]">{step.description}</p>
                )}
              </header>
              <div className="mt-4">
                <StepInput
                  step={step}
                  value={responses[step.id]}
                  onChange={(value) => updateResponse(step.id, value)}
                />
              </div>
              {isMorgensport && step.id === MORGENSPORT_STEP_ID && (
                <details className="mt-4 rounded-[24px] border-4 border-white/70 bg-white/95 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-[#0b1230]">
                    Verlauf anzeigen ({morgensportLogs.length})
                  </summary>
                  <div className="mt-3 space-y-3 text-sm text-[#4b5685]">
                    {morgensportLogsLoading && <p>Einträge werden geladen…</p>}
                    {!morgensportLogsLoading && morgensportLogs.length === 0 && (
                      <p>Noch keine Morgensport-Einträge gespeichert.</p>
                    )}
                    {morgensportLogs.map((log) => (
                      <article
                        key={log.id}
                        className="rounded-2xl border border-daisy-100 bg-daisy-50/60 px-4 py-3"
                      >
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
            </article>
          ))}
        </div>
      )}

      {!autoSubmitEnabled && !isStateControl && (
        <Button type="button" className="w-full" onClick={() => void handleSubmit()} disabled={saving}>
          {saving ? "Speichert…" : "Programm abschließen"}
        </Button>
      )}

      {!autoSubmitEnabled && isStateControl && (
        <div className="rounded-3xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm text-daisy-800">
          Zum Abschließen bitte den Button im State-Table nutzen.
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
      <div className="rounded-[24px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm text-[#4b5685]">
        Kein Input erforderlich – konzentriere dich auf den Schritt.
      </div>
    );
  }

  switch (step.input.type) {
    case "checkbox":
      return (
        <label className="flex items-center gap-3 rounded-[22px] border-2 border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-[#0b1230]">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => onChange(event.target.checked)}
            className="h-5 w-5 rounded border-2 border-[#0b1230] accent-[#ff5fa8]"
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
        <label className="text-sm font-semibold text-[#0b1230]">
          {step.input.type === "rating" ? "Rating" : "Slider"}: {numericValue}
          <input
            type="range"
            min={min}
            max={max}
            value={numericValue}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-2 w-full accent-[#ff5fa8]"
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
          <div className="space-y-3 text-sm text-[#0b1230]">
            {options.map((option) => {
              const selected = selections.includes(option);
              const minuteValue = minutes[option] ?? "";
              return (
                <div
                  key={option}
                  className="flex flex-wrap items-center gap-3 rounded-[24px] border-2 border-white/70 bg-white px-4 py-3"
                >
                  <label className="flex items-center gap-2 font-semibold">
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
                    className="w-24 rounded-xl border-2 border-white/70 px-3 py-1 text-sm"
                  />
                </div>
              );
            })}
          </div>
        );
      }
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-2 text-sm text-[#0b1230]">
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
          className="retro-input min-h-[130px] w-full bg-white/95 text-[#0b1230]"
        />
      );
    case "timer":
      return (
        <div className="rounded-[24px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm text-[#4b5685]">
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
          className="retro-input w-full bg-white/95 text-[#0b1230]"
        />
      );
  }
}

function StateControlTable({
  steps,
  responses,
  onChange,
  onSubmit,
  submitting,
  showSubmitButton,
  logs,
  loading
}: {
  steps: ProgramRitualStep[];
  responses: Record<string, unknown>;
  onChange: (stepId: string, value: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  showSubmitButton: boolean;
  logs: StateControlLogEntry[];
  loading: boolean;
}) {
  return (
    <div className="space-y-5 retro-panel p-6">
      <div>
        <h3 className="text-xl font-semibold text-[#0b1230]">State Übersicht</h3>
        <p className="text-sm text-[#4b5685]">
          Alle States in einer Liste – jede Zeile direkt bewerten.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm text-[#0b1230]">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.3em] text-[#6b74a7]">
              <th className="pb-2">State</th>
              <th className="pb-2">Wertung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/70">
            {steps.map((step) => {
              const min = typeof step.input?.min === "number" ? step.input.min : 1;
              const max = typeof step.input?.max === "number" ? step.input.max : 10;
              const current =
                typeof responses[step.id] === "number"
                  ? (responses[step.id] as number)
                  : Math.round((min + max) / 2);
              return (
                <tr key={step.id} className="align-middle">
                  <td className="py-3 pr-4 font-semibold">{step.title}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold text-[#ff5fa8]">
                        {current}/{max}
                      </span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={current}
                        onChange={(event) => onChange(step.id, Number(event.target.value))}
                        className="w-full accent-[#ff5fa8]"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <StateControlLogs logs={logs} loading={loading} />
      {showSubmitButton && (
        <div className="flex justify-end">
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Speichert…" : "Programm abschließen"}
          </Button>
        </div>
      )}
    </div>
  );
}

function StateControlLogs({
  logs,
  loading
}: {
  logs: StateControlLogEntry[];
  loading: boolean;
}) {
  return (
    <details className="rounded-[24px] border-4 border-white/70 bg-white/95 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[#0b1230]">
        Verlauf anzeigen ({logs.length})
      </summary>
      <div className="mt-3 space-y-3 text-sm text-[#4b5685]">
        {loading && <p>Einträge werden geladen…</p>}
        {!loading && logs.length === 0 && <p>Noch keine State Controll-Einträge gespeichert.</p>}
        {!loading &&
          logs.map((log) => (
            <article
              key={log.id}
              className="rounded-[22px] border-2 border-white/70 bg-white/90 px-4 py-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff5fa8]">
                {new Date(log.createdAt).toLocaleString("de-DE")}
              </p>
              <div
                className="prose prose-sm max-w-none text-[#2f3763]"
                dangerouslySetInnerHTML={{ __html: log.contentHtml }}
              />
            </article>
          ))}
      </div>
    </details>
  );
}

function StateControlSummary({
  steps,
  responses
}: {
  steps: ProgramRitualStep[];
  responses: Record<string, unknown>;
}) {
  const { segments, total, average } = useMemo(() => {
    const palette = [
      "#fbbf24",
      "#f97316",
      "#ef4444",
      "#14b8a6",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899"
    ];
    const entries = steps.map((step, index) => {
      const raw =
        typeof responses[step.id] === "number"
          ? (responses[step.id] as number)
          : null;
      const min = typeof step.input?.min === "number" ? step.input.min : 1;
      const max = typeof step.input?.max === "number" ? step.input.max : 10;
      const fallback = Math.round((min + max) / 2);
      const value = raw ?? fallback;
      return {
        id: step.id,
        title: step.title,
        value,
        color: palette[index % palette.length]
      };
    });
    const sum = entries.reduce((acc, entry) => acc + entry.value, 0);
    const normalized =
      sum === 0
        ? entries.map((entry) => ({
            ...entry,
            percent: 1 / entries.length
          }))
        : entries.map((entry) => ({
            ...entry,
            percent: entry.value / sum
          }));
    const average = entries.length > 0 ? sum / entries.length : 0;
    return { segments: normalized, total: sum, average };
  }, [responses, steps]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <section className="grid gap-6 rounded-3xl border border-daisy-200 bg-white/95 p-5 md:grid-cols-[240px,1fr]">
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="240" height="240" viewBox="0 0 240 240" role="img" aria-label="State Controll Verteilung">
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="24"
              fill="none"
            />
            {segments.map((segment) => {
              const dash = circumference * segment.percent;
              const circle = (
                <circle
                  key={segment.id}
                  cx="120"
                  cy="120"
                  r={radius}
                  stroke={segment.color}
                  strokeWidth="24"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 120 120)"
                />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ø State
            </p>
            <p className="text-4xl font-bold text-daisy-700">
              {average.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">Live</p>
          </div>
        </div>
      </div>
      <div>
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Live Analyse
          </p>
          <h3 className="text-lg font-semibold text-gray-900">
            State Controll Verteilung
          </h3>
          <p className="text-sm text-gray-500">
            100% Kreisdiagramm mit allen States, aktualisiert bei jeder Eingabe.
          </p>
        </header>
        {total === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Noch keine Werte gesetzt. Bewege die Regler, um die Verteilung zu sehen.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 text-sm text-gray-700">
            {segments.map((segment) => (
              <li
                key={segment.id}
                className="flex items-center justify-between rounded-2xl border border-daisy-100 bg-white/80 px-4 py-2"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-semibold">{segment.title}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {segment.value.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(segment.percent * 100).toFixed(0)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
