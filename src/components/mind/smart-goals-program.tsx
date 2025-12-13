"use client";

import { useCallback, useEffect, useState } from "react";

import type { MindGoalCheckin, MindGoalWithProgress, ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletion } from "@/hooks/use-program-completion";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

interface GoalInputState {
  progress: number;
  assessment: string;
  read: boolean;
}

export function SmartGoalsProgram({ program }: { program: ProgramDefinition }) {
  const [goals, setGoals] = useState<MindGoalWithProgress[]>([]);
  const [goalInputs, setGoalInputs] = useState<Record<string, GoalInputState>>({});
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);
  const [logsGoal, setLogsGoal] = useState<MindGoalWithProgress | null>(null);
  const { user } = useAuth();
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadGoals = useCallback(async () => {
    const params = new URLSearchParams();
    if (user?.email) params.set("userEmail", user.email);
    if (user?.name) params.set("userName", user.name);
    const response = await fetch(`/api/mind/goals${params.toString() ? `?${params.toString()}` : ""}`);
    if (!response.ok) return;
    const data: MindGoalWithProgress[] = await response.json();
    setGoals(data ?? []);
    setGoalInputs((prev) => {
      const next: Record<string, GoalInputState> = {};
      for (const goal of data) {
        next[goal.id] = {
          progress: goal.latestProgress ?? prev[goal.id]?.progress ?? 0,
          assessment: goal.lastAssessment ?? prev[goal.id]?.assessment ?? "",
          read: false
        };
      }
      return next;
    });
  }, [user?.email, user?.name]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const updateGoalInput = (goalId: string, partial: Partial<GoalInputState>) => {
    setGoalInputs((prev) => ({
      ...prev,
      [goalId]: {
        progress: prev[goalId]?.progress ?? 0,
        assessment: prev[goalId]?.assessment ?? "",
        read: prev[goalId]?.read ?? false,
        ...partial
      }
    }));
  };

  const handleGoalCheckin = async (goalId: string) => {
    const state = goalInputs[goalId];
    if (!state) return;
    setSavingGoalId(goalId);
    await fetch("/api/mind/goals/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId,
        progressPercent: state.progress,
        selfAssessment: state.assessment,
        readThrough: state.read,
        userEmail: user?.email,
        userName: user?.name
      })
    });
    setCompletedGoals((prev) => (prev.includes(goalId) ? prev : [...prev, goalId]));
    await loadGoals();
    // Reset Assessment nach erfolgreichem Check-in
    setGoalInputs((prev) => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        assessment: ""
      }
    }));
    setSavingGoalId(null);
  };

  const handleComplete = async () => {
    await completeProgram({
      type: "smart-goals",
      completedGoals
    });
    setCompletedGoals([]);
  };
  const autoSubmitEnabled = useAutoProgramSubmit(handleComplete);

  return (
    <div className="space-y-6">
      {goals.map((goal) => {
        const state = goalInputs[goal.id] ?? {
          progress: goal.latestProgress ?? 0,
          assessment: "",
          read: false
        };
        return (
          <div key={goal.id} className="space-y-4 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm">
            <header className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"

                    type="button"
                    onClick={() => setLogsGoal(goal)}
                  >
                    Logs
                  </Button>
                  <span className="text-sm font-semibold text-daisy-500">
                    {Math.round(goal.latestProgress ?? 0)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-daisy-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-daisy-300 to-daisy-500"
                  style={{ width: `${Math.min(goal.latestProgress ?? 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {goal.metricName ?? "Progress"} / Zielwert {goal.targetValue ?? "-"}
                {goal.unit ? ` ${goal.unit}` : ""} — Deadline{" "}
                {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString("de-DE") : "offen"}
              </p>
            </header>

            <div className="grid gap-2 text-sm text-gray-600">
              <SmartRow label="S" value={goal.specific} />
              <SmartRow label="M" value={goal.measurable} />
              <SmartRow label="A" value={goal.achievable} />
              <SmartRow label="R" value={goal.relevant} />
              <SmartRow label="T" value={goal.timeBound} />
            </div>

            <label className="text-sm font-semibold text-gray-700">
              Fortschritt ({state.progress}%)
              <input
                type="range"
                min={0}
                max={100}
                value={state.progress}
                onChange={(event) => updateGoalInput(goal.id, { progress: Number(event.target.value) })}
                className="mt-2 w-full"
              />
            </label>

            <label className="text-sm font-semibold text-gray-700">
              Erfolgslog
              <textarea
                value={state.assessment}
                onChange={(event) => updateGoalInput(goal.id, { assessment: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </label>
            <GoalLogs logs={goal.logs} />

            <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                className="h-5 w-5 accent-daisy-500"
                checked={state.read}
                onChange={(event) => updateGoalInput(goal.id, { read: event.target.checked })}
              />
              Heute bewusst gelesen
            </label>

            <Button
              type="button"
              onClick={() => void handleGoalCheckin(goal.id)}
              disabled={savingGoalId === goal.id}
            >
              {savingGoalId === goal.id ? "Speichere…" : "Check-in sichern"}
            </Button>
          </div>
        );
      })}

      {!autoSubmitEnabled && (
        <Button onClick={handleComplete} disabled={submitting}>
          Mind Ziel Session abschließen
        </Button>
      )}

      {logsGoal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Erfolgslog</p>
                <h3 className="text-xl font-semibold">{logsGoal.title}</h3>
              </div>
              <Button variant="ghost" type="button" onClick={() => setLogsGoal(null)}>
                Schließen
              </Button>
            </header>
            <div className="mt-4 max-h-[360px] overflow-y-auto space-y-3 text-sm text-gray-700">
              {logsGoal.logs && logsGoal.logs.length > 0 ? (
                logsGoal.logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-daisy-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-daisy-600">
                        {entry.progressPercent}%
                      </span>
                    </div>
                    {entry.selfAssessment && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {entry.selfAssessment}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Noch keine Einträge.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SmartRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-daisy-100 bg-white px-4 py-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-daisy-500 text-xs font-semibold text-white">
        {label}
      </span>
      <p className="text-sm text-gray-600">{value}</p>
    </div>
  );
}

function GoalLogs({ logs }: { logs?: MindGoalCheckin[] }) {
  const entries = logs ?? [];
  return (
    <details className="mt-3 rounded-2xl border border-daisy-200 bg-white/90 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gray-900">
        Verlauf anzeigen ({entries.length})
      </summary>
      <div className="mt-3 space-y-3 text-sm text-gray-700">
        {entries.length === 0 ? (
          <p>Noch keine Erfolgslog-Einträge gespeichert.</p>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-daisy-100 bg-daisy-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-daisy-600">
                {new Date(entry.createdAt).toLocaleString("de-DE")}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Fortschritt</span>
                <span className="font-semibold text-daisy-600">{Math.round(entry.progressPercent)}%</span>
              </div>
              {entry.selfAssessment && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                  {entry.selfAssessment}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </details>
  );
}
