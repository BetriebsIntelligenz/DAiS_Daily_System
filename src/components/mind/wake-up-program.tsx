"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

const CHECKLIST_ITEMS = [
  { id: "wu-earth-love", label: "Earth Love Meditation" },
  { id: "wu-gratitude", label: "Dankbarkeits Meditation" },
  { id: "wu-visualization", label: "Visualisierung" },
  { id: "wu-power-shot", label: "Power Health Shot" },
  { id: "wu-pump-up", label: "Pump Up Session" }
] as const;

type ChecklistItemId = (typeof CHECKLIST_ITEMS)[number]["id"];
type ChecklistState = Record<ChecklistItemId, boolean>;

interface WakeUpLogEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

interface WakeUpChecklistLogItem {
  id: ChecklistItemId;
  label: string;
  completed: boolean;
}

export function WakeUpProgram({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const [checklist, setChecklist] = useState<ChecklistState>(() => createInitialChecklistState());
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<WakeUpLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const dateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }).format(new Date());
  }, []);

  const defaultQualityRatings = useMemo(() => {
    return program.blueprint.quality.metrics.reduce<Record<string, number>>((acc, metric) => {
      acc[metric.id] = metric.max;
      return acc;
    }, {});
  }, [program.blueprint.quality.metrics]);

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      : completionOverrides?.redirectTo ?? "http://localhost:3001/requirements";

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch("/api/programs/wake-up/logs");
      if (!response.ok) {
        throw new Error("Wake Up Verlauf konnte nicht geladen werden");
      }
      const data = (await response.json()) as WakeUpLogEntry[];
      setLogs(data);
    } catch (requestError) {
      console.error("Wake Up Logs konnten nicht geladen werden", requestError);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  const completedCount = useMemo(() => {
    return CHECKLIST_ITEMS.reduce((count, item) => (checklist[item.id] ? count + 1 : count), 0);
  }, [checklist]);

  const toggleItem = (itemId: ChecklistItemId) => {
    setChecklist((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const resetForm = () => {
    setChecklist(createInitialChecklistState());
  };

  const submitProgram = async () => {
    setSaving(true);
    try {
      const stepsPayload = CHECKLIST_ITEMS.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.id] = Boolean(checklist[item.id]);
        return acc;
      }, {});

      const payload = {
        steps: stepsPayload,
        quality: {
          ratings: defaultQualityRatings,
          criteriaMet: program.blueprint.quality.criteria,
          feasibility: true,
          stateCheckBefore: null,
          stateCheckAfter: null,
          customRulePassed: true
        },
        results: {},
        runner: {
          completed: true,
          totalSteps: Object.keys(stepsPayload).length,
          scheduleHint: program.blueprint.scheduling.blocks?.[0]?.block,
          xpRules: program.blueprint.xp
        }
      } satisfies Record<string, unknown>;

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
        throw new Error(body?.error ?? "Programm konnte nicht gebucht werden");
      }

      await logWakeUpEntry(
        CHECKLIST_ITEMS.map((item) => ({
          id: item.id,
          label: item.label,
          completed: Boolean(checklist[item.id])
        }))
      );

      resetForm();
      if (completionOverrides?.onProgramCompleted) {
        await completionOverrides.onProgramCompleted(program);
      }
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (requestError) {
      console.error("Wake Up Program konnte nicht gespeichert werden", requestError);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    await submitProgram();
  };

  const autoSubmitEnabled = useAutoProgramSubmit(submitProgram);

  const logWakeUpEntry = async (items: WakeUpChecklistLogItem[]) => {
    const contentHtml = buildWakeUpLogHtml(items);
    try {
      await fetch("/api/programs/wake-up/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentHtml,
          userEmail: auth.user?.email,
          userName: auth.user?.name
        })
      });
      await refreshLogs();
    } catch (logError) {
      console.error("Wake Up Log konnte nicht gespeichert werden", logError);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <section className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">{program.code}</p>
          <h2 className="text-2xl font-semibold text-gray-900">{program.name}</h2>
          <p className="text-sm text-gray-600">Heute ist {dateLabel}</p>
          <p className="text-sm text-gray-500">{program.summary}</p>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-daisy-200 bg-white/95 p-5">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Daily Wake Up
          </p>
          <h3 className="text-lg font-semibold text-gray-900">Checkliste</h3>
          <p className="text-sm text-gray-500">
            Aktiviere jede Sequenz nacheinander. Der Verlauf speichert deinen Fortschritt inklusive Timestamp.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-500">
            {completedCount}/{CHECKLIST_ITEMS.length} erledigt
          </p>
        </header>
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <label
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-daisy-100 bg-white/95 px-4 py-3 text-sm font-semibold text-gray-800"
            >
              <div>
                <p>{item.label}</p>
                <p className="text-xs font-normal text-gray-500">
                  {checklist[item.id] ? "Durchgeführt" : "Noch offen"}
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(checklist[item.id])}
                onChange={() => toggleItem(item.id)}
                className="h-5 w-5 rounded accent-daisy-500"
              />
            </label>
          ))}
        </div>
      </section>

      {!autoSubmitEnabled && (
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Speichert…" : "Wake Up Ritual abschließen & XP buchen"}
        </Button>
      )}

      <section className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Verlauf
            </p>
            <h3 className="text-lg font-semibold text-gray-900">Wake Up Log</h3>
          </div>
          <Button type="button" variant="ghost" onClick={() => refreshLogs()} disabled={logsLoading}>
            {logsLoading ? "Lädt…" : "Aktualisieren"}
          </Button>
        </header>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {logsLoading && <p>Einträge werden geladen…</p>}
          {!logsLoading && logs.length === 0 && <p>Noch keine Einträge vorhanden.</p>}
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
    </form>
  );
}

function createInitialChecklistState(): ChecklistState {
  return CHECKLIST_ITEMS.reduce<ChecklistState>((acc, item) => {
    acc[item.id] = false;
    return acc;
  }, {} as ChecklistState);
}

function buildWakeUpLogHtml(items: WakeUpChecklistLogItem[]) {
  const listItems = items
    .map(
      (item) =>
        `<li><strong>${item.completed ? "✓" : "–"}</strong> ${escapeHtml(item.label)}</li>`
    )
    .join("");
  return `<ul>${listItems}</ul>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
