"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import type { ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";

interface DayPlanningLogEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

interface DayPlanningTask {
  id: string;
  label: string;
}

const TASK_STORAGE_KEY = "mm5-day-planning-tasks";

export function DayPlanningProgram({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const [focus, setFocus] = useState("");
  const [emailsChecked, setEmailsChecked] = useState(false);
  const [emailNote, setEmailNote] = useState("");
  const [meetingsChecked, setMeetingsChecked] = useState(false);
  const [meetingPrep, setMeetingPrep] = useState("");
  const [tasks, setTasks] = useState<DayPlanningTask[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [tasksHydrated, setTasksHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<DayPlanningLogEntry[]>([]);
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
      const response = await fetch("/api/programs/day-planning/logs");
      if (!response.ok) {
        throw new Error("Verlauf konnte nicht geladen werden");
      }
      const data = (await response.json()) as DayPlanningLogEntry[];
      setLogs(data);
    } catch (requestError) {
      console.error(requestError);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DayPlanningTask[];
        if (Array.isArray(parsed)) {
          setTasks(
            parsed
              .filter((item) => typeof item?.id === "string" && typeof item?.label === "string")
              .map((item) => ({ id: item.id, label: item.label.trim() }))
              .filter((item) => item.label.length > 0)
          );
        }
      }
    } catch (storageError) {
      console.warn("Day Planning Tasks konnten nicht geladen werden", storageError);
    } finally {
      setTasksHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!tasksHydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    } catch (storageError) {
      console.warn("Day Planning Tasks konnten nicht gespeichert werden", storageError);
    }
  }, [tasks, tasksHydrated]);

  const addTask = () => {
    const value = taskInput.trim();
    if (!value) return;
    setTasks((prev) => [...prev, { id: createTaskId(), label: value }]);
    setTaskInput("");
  };

  const startEditTask = (task: DayPlanningTask) => {
    setEditingTaskId(task.id);
    setEditingTaskValue(task.label);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setEditingTaskValue("");
    }
  };

  const saveTaskEdit = () => {
    if (!editingTaskId) return;
    const value = editingTaskValue.trim();
    if (!value) {
      deleteTask(editingTaskId);
      return;
    }
    setTasks((prev) => prev.map((task) => (task.id === editingTaskId ? { ...task, label: value } : task)));
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  const cancelTaskEdit = () => {
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  const resetForm = () => {
    setFocus("");
    setEmailsChecked(false);
    setEmailNote("");
    setMeetingsChecked(false);
    setMeetingPrep("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!focus.trim()) {
      setError("Bitte den heutigen Fokus ausfüllen.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const importantTasks = tasks.map((task) => task.label.trim()).filter((task) => task.length > 0);
      const stepsPayload = {
        "mm5-why": focus.trim(),
        "mm5-emails": emailsChecked,
        "mm5-email-note": emailNote.trim(),
        "mm5-meetings": meetingsChecked,
        "mm5-meeting-prep": meetingPrep.trim(),
        "mm5-important-tasks": importantTasks
      } satisfies Record<string, unknown>;

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

      await logDayPlanningEntry({
        focus: stepsPayload["mm5-why"] as string,
        emailsChecked,
        emailNote: stepsPayload["mm5-email-note"] as string,
        meetingsChecked,
        meetingPrep: stepsPayload["mm5-meeting-prep"] as string,
        tasks: importantTasks
      });

      resetForm();
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
          : "Programm konnte nicht gespeichert werden"
      );
    } finally {
      setSaving(false);
    }
  };

  const logDayPlanningEntry = async (entry: {
    focus: string;
    emailsChecked: boolean;
    emailNote: string;
    meetingsChecked: boolean;
    meetingPrep: string;
    tasks: string[];
  }) => {
    const contentHtml = buildLogHtml(entry);
    try {
      await fetch("/api/programs/day-planning/logs", {
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
      console.error("Day Planning Log konnte nicht gespeichert werden", logError);
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

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <section className="space-y-5 rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Fokus
          </p>
          <h3 className="text-lg font-semibold text-gray-900">
            Was ist das Wichtigste heute?
          </h3>
        </header>
        <textarea
          value={focus}
          onChange={(event) => setFocus(event.target.value)}
          placeholder="Fokus Aufgabe..."
          className="h-28 w-full rounded-2xl border border-daisy-200 bg-white/95 px-4 py-3 text-sm text-gray-900"
        />
      </section>

      <section className="space-y-4 rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Wichtige Aufgaben
          </p>
          <h3 className="text-lg font-semibold text-gray-900">Prioritätenliste</h3>
          <p className="text-sm text-gray-500">Aufgaben hinzufügen, speichern oder wieder entfernen.</p>
        </header>
        <div className="flex flex-col gap-3 md:flex-row">
          <textarea
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                addTask();
              }
            }}
            placeholder="Neue Aufgabe…"
            className="h-12 flex-1 rounded-2xl border border-daisy-200 bg-white/95 px-4 py-2 text-sm text-gray-900"
          />
          <Button type="button" className="shrink-0" onClick={addTask}>
            Hinzufügen
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-sm text-gray-600">Noch keine Aufgaben hinterlegt.</p>
          )}
          {tasks.map((task) => (
            <div key={task.id} className="space-y-2">
              {editingTaskId === task.id ? (
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    value={editingTaskValue}
                    onChange={(event) => setEditingTaskValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveTaskEdit();
                      }
                    }}
                    className="flex-1 rounded-2xl border border-daisy-200 bg-white/95 px-4 py-2 text-sm text-gray-900"
                  />
                  <div className="flex gap-2">
                    <Button type="button" onClick={saveTaskEdit}>
                      Speichern
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelTaskEdit}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={() => startEditTask(task)}
                    className="w-full rounded-2xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-left text-sm font-semibold text-gray-800 shadow-sm"
                  >
                    {task.label}
                  </button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => startEditTask(task)}>
                      Bearbeiten
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => deleteTask(task.id)}>
                      Löschen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Aktivitäten
          </p>
          <h3 className="text-lg font-semibold text-gray-900">
            Inbox & Termine abhaken
          </h3>
        </header>

        <article className="space-y-3 rounded-2xl border border-daisy-100 bg-white/95 p-4">
          <label className="flex items-center justify-between gap-4 text-sm font-semibold text-gray-800">
            <span>E-Mails geprüft</span>
            <input
              type="checkbox"
              checked={emailsChecked}
              onChange={(event) => setEmailsChecked(event.target.checked)}
              className="h-5 w-5 rounded accent-daisy-500"
            />
          </label>
          <textarea
            value={emailNote}
            onChange={(event) => setEmailNote(event.target.value)}
            placeholder="Welche Nachricht braucht Follow-up?"
            className="w-full rounded-2xl border border-daisy-200 bg-white/90 px-4 py-3 text-sm text-gray-900"
          />
        </article>

        <article className="space-y-3 rounded-2xl border border-daisy-100 bg-white/95 p-4">
          <label className="flex items-center justify-between gap-4 text-sm font-semibold text-gray-800">
            <span>Termine geprüft</span>
            <input
              type="checkbox"
              checked={meetingsChecked}
              onChange={(event) => setMeetingsChecked(event.target.checked)}
              className="h-5 w-5 rounded accent-daisy-500"
            />
          </label>
          <textarea
            value={meetingPrep}
            onChange={(event) => setMeetingPrep(event.target.value)}
            placeholder="Was muss vor dem nächsten Termin passieren?"
            className="w-full rounded-2xl border border-daisy-200 bg-white/90 px-4 py-3 text-sm text-gray-900"
          />
        </article>
      </section>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Speichert…" : "Programm abschließen & XP buchen"}
      </Button>

      <section className="rounded-3xl border border-daisy-200 bg-white/90 p-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              Verlauf
            </p>
            <h3 className="text-lg font-semibold text-gray-900">Day Planning Log</h3>
          </div>
          <Button type="button" variant="ghost" onClick={() => refreshLogs()} disabled={logsLoading}>
            {logsLoading ? "Lädt…" : "Aktualisieren"}
          </Button>
        </header>
        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {logsLoading && <p>Einträge werden geladen…</p>}
          {!logsLoading && logs.length === 0 && (
            <p>Noch keine Einträge vorhanden.</p>
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
    </form>
  );
}

function buildLogHtml(entry: {
  focus: string;
  emailsChecked: boolean;
  emailNote: string;
  meetingsChecked: boolean;
  meetingPrep: string;
  tasks: string[];
}) {
  const lines = [
    `<p><strong>Fokus:</strong> ${escapeHtml(entry.focus)}</p>`,
    `<p><strong>E-Mails geprüft:</strong> ${entry.emailsChecked ? "Ja" : "Nein"}</p>`
  ];
  if (entry.emailNote) {
    lines.push(`<p><strong>E-Mail Notiz:</strong> ${escapeHtml(entry.emailNote)}</p>`);
  }
  lines.push(
    `<p><strong>Termine geprüft:</strong> ${entry.meetingsChecked ? "Ja" : "Nein"}</p>`
  );
  if (entry.meetingPrep) {
    lines.push(`<p><strong>Vorbereitung:</strong> ${escapeHtml(entry.meetingPrep)}</p>`);
  }
  if (entry.tasks.length > 0) {
    const taskItems = entry.tasks
      .map((task) => `<span class="block">• ${escapeHtml(task)}</span>`)
      .join("");
    lines.push(`<p><strong>Wichtige Aufgaben:</strong><br />${taskItems}</p>`);
  }
  return lines.join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br />");
}

function createTaskId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `task-${Math.random().toString(36).slice(2, 9)}`;
}
