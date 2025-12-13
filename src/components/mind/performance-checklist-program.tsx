"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  PerformanceChecklistItem,
  ProgramDefinition
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

const RATING_VALUES = [1, 2, 3, 4, 5] as const;

interface ChecklistLogEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

export function PerformanceChecklistProgram({
  program
}: {
  program: ProgramDefinition;
}) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const [items, setItems] = useState<PerformanceChecklistItem[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ChecklistLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      : completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;

  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const response = await fetch("/api/mind/performance-checklist");
      if (!response.ok) {
        throw new Error("Checklist konnte nicht geladen werden.");
      }
      const data = (await response.json()) as PerformanceChecklistItem[];
      setItems(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Checklist Load failed", requestError);
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    setRatings((prev) => {
      const next: Record<string, number> = {};
      items.forEach((item) => {
        next[item.id] = prev[item.id] ?? 3;
      });
      return next;
    });
  }, [items]);

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch(
        "/api/programs/performance-checklist/logs"
      );
      if (!response.ok) {
        throw new Error("Logs konnten nicht geladen werden.");
      }
      const data = (await response.json()) as ChecklistLogEntry[];
      setLogs(data);
    } catch (requestError) {
      console.error("Checklist Logs failed", requestError);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  const averageScore = useMemo(() => {
    if (items.length === 0) return 0;
    const sum = items.reduce(
      (acc, item) => acc + (ratings[item.id] ?? 0),
      0
    );
    return sum / items.length;
  }, [items, ratings]);

  const historicalAverage = useMemo(
    () => computeHistoricalAverage(logs),
    [logs]
  );

  const updateRating = (itemId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [itemId]: value }));
  };

  const submitChecklist = useCallback(async () => {
    if (items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const stepsPayload = items.reduce<Record<string, number>>((acc, item) => {
        const current = ratings[item.id];
        acc[item.id] =
          typeof current === "number" && Number.isFinite(current)
            ? current
            : 3;
        return acc;
      }, {});

      const payload = {
        steps: stepsPayload,
        quality: {
          ratings: stepsPayload,
          customRulePassed: true
        },
        results: {},
        runner: {
          completed: true,
          totalSteps: items.length,
          scheduleHint: program.blueprint.scheduling.blocks?.[0]?.block,
          xpRules: program.blueprint.xp
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
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Programm konnte nicht gespeichert werden.");
      }

      const logEntries = items.map((item) => ({
        label: item.label,
        summary: item.summary,
        value: stepsPayload[item.id]
      }));
      const contentHtml = buildChecklistLogHtml(logEntries);

      await fetch("/api/programs/performance-checklist/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentHtml,
          userEmail: auth.user?.email,
          userName: auth.user?.name
        })
      });

      setRatings(() => {
        const reset: Record<string, number> = {};
        items.forEach((item) => {
          reset[item.id] = 3;
        });
        return reset;
      });
      await refreshLogs();
      if (completionOverrides?.onProgramCompleted) {
        await completionOverrides.onProgramCompleted(program);
      }
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (requestError) {
      console.error("Performance checklist submit failed", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Programm konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  }, [
    items,
    ratings,
    program,
    auth.user?.email,
    auth.user?.name,
    refreshLogs,
    completionOverrides,
    successRedirect,
    router
  ]);

  const autoSubmitEnabled = useAutoProgramSubmit(submitChecklist);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {program.code}
          </p>
          <h2 className="text-2xl font-semibold text-gray-900">
            {program.name}
          </h2>
          <p className="text-sm text-gray-600">{program.summary}</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-daisy-200 via-white to-daisy-400/60 p-5 shadow-[0_10px_30px_rgba(234,196,94,0.35)]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-800">
              Ø Score heute
            </p>
            <p className="mt-2 text-5xl font-bold text-daisy-900">
              {averageScore.toFixed(1)}
              <span className="text-2xl text-daisy-800">/5</span>
            </p>
            <p className="mt-1 text-sm text-daisy-900/80">
              Basierend auf aktuellen Eingaben
            </p>
          </div>
          <div className="rounded-3xl border border-daisy-100 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Verlauf Ø
            </p>
            <p className="mt-2 text-4xl font-bold text-daisy-700">
              {historicalAverage !== null
                ? historicalAverage.toFixed(2)
                : "–"}
              <span className="text-xl text-daisy-600">/5</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {historicalAverage === null
                ? "Noch keine Einträge gespeichert"
                : `Aus ${logs.length} Log${logs.length === 1 ? "" : "s"} berechnet`}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-daisy-200 bg-white/95 p-5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Performance Checklist
          </p>
          <h3 className="text-lg font-semibold text-gray-900">Tagesstatus</h3>
          <p className="text-sm text-gray-500">
            Bewerte jede Kategorie mit fünf Stufen (1 = low, 5 = peak). Alle
            Werte werden wie beim Morgensport im Verlauf gespeichert.
          </p>
        </header>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {loadingItems ? (
          <p className="text-sm text-gray-500">Checkliste wird geladen…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">
            Noch keine Checklist Items vorhanden. Bitte im Admin &quot;Cards&quot;
            Modul anlegen.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm text-gray-800">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-2 text-left">Bereich</th>
                  <th className="py-2 text-center" colSpan={RATING_VALUES.length}>
                    Rating (1-5)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-daisy-100">
                {items.map((item) => {
                  const current =
                    typeof ratings[item.id] === "number"
                      ? ratings[item.id]
                      : 3;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-semibold text-gray-900">
                          {item.label}
                        </p>
                        {item.summary && (
                          <p className="text-xs text-gray-500">{item.summary}</p>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {RATING_VALUES.map((value) => (
                            <label
                              key={`${item.id}-${value}`}
                              className="flex flex-col items-center gap-1 rounded-2xl bg-white px-2 py-1 text-xs font-semibold text-gray-600"
                            >
                              <input
                                type="radio"
                                name={`rating-${item.id}`}
                                value={value}
                                checked={current === value}
                                onChange={() => updateRating(item.id, value)}
                                className="h-4 w-4 accent-daisy-500"
                                aria-label={`${item.label} Level ${value}`}
                              />
                              <span>{value}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {!autoSubmitEnabled && (
        <Button
          type="button"
          className="w-full"
          onClick={() => void submitChecklist()}
          disabled={saving || items.length === 0}
        >
          {saving ? "Speichert…" : "Checklist abschließen & XP buchen"}
        </Button>
      )}

      <section className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Verlauf
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              Performance Log
            </h3>
            {historicalAverage !== null && (
              <p className="text-sm font-semibold text-daisy-700">
                Live Ø Score: {historicalAverage.toFixed(2)}/5
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => void refreshLogs()}
            disabled={logsLoading}
          >
            {logsLoading ? "Lädt…" : "Aktualisieren"}
          </Button>
        </header>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {logsLoading && <p>Einträge werden geladen…</p>}
          {!logsLoading && logs.length === 0 && (
            <p>Noch keine Einträge gespeichert.</p>
          )}
          {logs.map((log) => (
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
      </section>
    </div>
  );
}

function buildChecklistLogHtml(
  entries: { label: string; summary?: string | null; value: number }[]
) {
  const rows = entries
    .map((entry) => {
      const summary = entry.summary
        ? `<br/><small>${escapeHtml(entry.summary)}</small>`
        : "";
      return `<tr>
        <td><strong>${escapeHtml(entry.label)}</strong>${summary}</td>
        <td style="text-align:right;font-weight:bold;">${entry.value}/5</td>
      </tr>`;
    })
    .join("");
  return `<table><tbody>${rows}</tbody></table>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function computeHistoricalAverage(logs: ChecklistLogEntry[]) {
  let total = 0;
  let count = 0;
  logs.forEach((log) => {
    const values = extractScoresFromHtml(log.contentHtml ?? "");
    values.forEach((value) => {
      total += value;
      count += 1;
    });
  });
  if (count === 0) {
    return null;
  }
  return total / count;
}

function extractScoresFromHtml(html: string) {
  const values: number[] = [];
  const regex = />(\d+(?:\.\d+)?)\/5</g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed)) {
      values.push(parsed);
    }
  }
  return values;
}
