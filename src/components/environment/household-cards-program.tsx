"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  HouseholdCardDefinition,
  HouseholdEntryRecord
} from "@/lib/types";
import {
  formatWeekday,
  getWeekDays,
  getWeekEnd,
  getWeekStart,
  isSameDay
} from "@/lib/household";
import type { ProgramDefinition } from "@/lib/types";
import { useAuth } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { SuccessToast } from "@/components/success-toast";
import { useProgramCompletionContext } from "@/contexts/program-completion-context";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

interface HouseholdCardsPayload {
  cards: HouseholdCardDefinition[];
}

interface LogsEntry {
  id: string;
  contentHtml: string;
  createdAt: string;
}

export function HouseholdCardsProgram({ program }: { program: ProgramDefinition }) {
  const router = useRouter();
  const auth = useAuth();
  const completionOverrides = useProgramCompletionContext();
  const [cards, setCards] = useState<HouseholdCardDefinition[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [taskState, setTaskState] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [entries, setEntries] = useState<HouseholdEntryRecord[]>([]);
  const [logs, setLogs] = useState<LogsEntry[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cardsLoadError, setCardsLoadError] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === selectedCardId) ?? null,
    [cards, selectedCardId]
  );

  const successRedirect =
    completionOverrides?.redirectTo === null
      ? null
      : completionOverrides?.redirectTo ??
        `/?programCompleted=${encodeURIComponent(program.name)}`;

  const loadCards = useCallback(async () => {
    setLoadingCards(true);
    try {
      const response = await fetch("/api/environment/household/cards");
      if (!response.ok) {
        throw new Error("Cards konnten nicht geladen werden.");
      }
      const data = (await response.json()) as HouseholdCardsPayload;
      setCards(Array.isArray(data.cards) ? data.cards : []);
      setCardsLoadError(null);
    } catch (requestError) {
      console.error(requestError);
      setCards([]);
      setCardsLoadError("Fehlerhaft und rot markiert");
    } finally {
      setLoadingCards(false);
    }
  }, []);

  const refreshEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const from = getWeekStart(weekStart).toISOString();
      const to = getWeekEnd(weekStart).toISOString();
      const response = await fetch(
        `/api/environment/household/entries?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!response.ok) {
        throw new Error("Einträge konnten nicht geladen werden.");
      }
      const data = await response.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (requestError) {
      console.error(requestError);
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, [weekStart]);

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await fetch("/api/programs/household/logs");
      if (!response.ok) {
        throw new Error("Logs konnten nicht geladen werden.");
      }
      const data = (await response.json()) as LogsEntry[];
      setLogs(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error(requestError);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCards();
  }, [loadCards]);

  useEffect(() => {
    void refreshEntries();
  }, [refreshEntries]);

  useEffect(() => {
    void refreshLogs();
  }, [refreshLogs]);

  useEffect(() => {
    if (cards.length === 0) return;
    const todayWeekday = new Date().getDay();
    const normalizedToday = todayWeekday === 0 ? 7 : todayWeekday;
    setSelectedCardId((current) => {
      if (current && cards.some((card) => card.id === current)) {
        return current;
      }
      const todayCard = cards.find((card) => card.weekday === normalizedToday);
      return todayCard?.id ?? cards[0].id;
    });
  }, [cards]);

  useEffect(() => {
    if (!selectedCard) {
      setTaskState({});
      return;
    }
    const defaults = selectedCard.tasks.reduce<Record<string, boolean>>((acc, assignment) => {
      acc[assignment.taskId] = false;
      return acc;
    }, {});
    setTaskState(defaults);
    setNote("");
  }, [selectedCard]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const completedCount = useMemo(
    () => Object.values(taskState).filter(Boolean).length,
    [taskState]
  );

  const handleTaskToggle = (taskId: string) => {
    setTaskState((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedCard) return;
    setSaving(true);
    setError(null);
    try {
      const completedTaskIds = Object.entries(taskState)
        .filter(([, checked]) => checked)
        .map(([taskId]) => taskId);
      const response = await fetch("/api/environment/household/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: selectedCard.id,
          completedTaskIds,
          note,
          userEmail: auth.user?.email,
          userName: auth.user?.name
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Haushaltskarte konnte nicht gespeichert werden.");
      }

      setTaskState((prev) =>
        Object.keys(prev).reduce<Record<string, boolean>>((acc, key) => {
          acc[key] = false;
          return acc;
        }, {})
      );
      setNote("");
      setToastMessage(`${selectedCard.title} gespeichert (+XP)`);
      await Promise.all([refreshEntries(), refreshLogs()]);
      if (completionOverrides?.onProgramCompleted) {
        await completionOverrides.onProgramCompleted(program);
      }
      if (successRedirect) {
        router.push(successRedirect);
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Haushaltskarte konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  }, [
    selectedCard,
    taskState,
    note,
    auth.user?.email,
    auth.user?.name,
    refreshEntries,
    refreshLogs,
    completionOverrides,
    program,
    successRedirect,
    router
  ]);

  const autoSubmitEnabled = useAutoProgramSubmit(selectedCard ? handleSubmit : null);

  const activeEntriesByDay = useMemo(() => {
    return weekDays.map((day) => {
      const entryForDay = entries
        .slice()
        .filter((entry) => isSameDay(new Date(entry.createdAt), day))
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
        )[0];
      return entryForDay ?? null;
    });
  }, [entries, weekDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-daisy-100 bg-white/80 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Cards</p>
          <h2 className="text-lg font-semibold text-gray-900">Haushalts-Boards</h2>
          <p className="text-sm text-gray-600">
            Wähle eine Karte nach Wochentag und hake die Aufgaben ab.
          </p>
        </div>
        <SuccessToast message={toastMessage ?? undefined} />
      </div>

      <div
        className={`rounded-3xl border p-4 shadow-inner transition ${
          cardsLoadError ? "border-red-300 bg-red-50/80" : "border-daisy-100 bg-white/90"
        }`}
      >
        {loadingCards ? (
          <p className="text-sm text-gray-500">Cards werden geladen…</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-gray-500">
            Noch keine Haushaltskarten im Admin angelegt.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`flex flex-col rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  card.id === selectedCardId
                    ? "border-daisy-400 bg-daisy-50 text-daisy-900"
                    : "border-daisy-100 bg-white text-gray-600 hover:border-daisy-200"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-daisy-600">
                  {formatWeekday(card.weekday)}
                </span>
                <span className="font-semibold text-gray-900">{card.title}</span>
                {card.summary && <span className="text-xs text-gray-500">{card.summary}</span>}
              </button>
            ))}
          </div>
        )}
        {cardsLoadError && (
          <p className="mt-3 text-sm font-semibold text-red-600">{cardsLoadError}</p>
        )}
      </div>

      {selectedCard && (
        <section className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
              {formatWeekday(selectedCard.weekday)}
            </p>
            <h3 className="text-xl font-semibold text-gray-900">{selectedCard.title}</h3>
            {selectedCard.summary && (
              <p className="text-sm text-gray-600">{selectedCard.summary}</p>
            )}
          </header>
          {selectedCard.tasks.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Dieser Karte sind noch keine Aufgaben zugeordnet.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {selectedCard.tasks.map((assignment) => (
                <label
                  key={assignment.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    taskState[assignment.taskId]
                      ? "border-daisy-400 bg-daisy-50 text-daisy-900"
                      : "border-daisy-100 bg-white text-gray-700"
                  }`}
                >
                  <span>{assignment.task.label}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-daisy-500"
                    checked={Boolean(taskState[assignment.taskId])}
                    onChange={() => handleTaskToggle(assignment.taskId)}
                  />
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <span>
              {completedCount} / {selectedCard.tasks.length} Aufgaben erledigt
            </span>
            <button
              type="button"
              onClick={() =>
                setTaskState((prev) =>
                  Object.keys(prev).reduce<Record<string, boolean>>((acc, key) => {
                    acc[key] = true;
                    return acc;
                  }, {})
                )
              }
              className="text-xs font-semibold uppercase tracking-[0.2em] text-daisy-600"
            >
              Alle abhaken
            </button>
          </div>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Notiz (optional)"
            className="mt-4 w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
          />
          {!autoSubmitEnabled && (
            <Button
              type="button"
              className="mt-4"
              onClick={handleSubmit}
              disabled={saving || selectedCard.tasks.length === 0}
            >
              {saving ? "Speichert…" : "Haushaltskarte abschließen"}
            </Button>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      )}

      <section className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Wochenstrahl</p>
            <h3 className="text-xl font-semibold text-gray-900">Haushalt Woche</h3>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setWeekStart((prev) => {
                  const next = new Date(prev);
                  next.setDate(prev.getDate() - 7);
                  return getWeekStart(next);
                })
              }
            >
              ← Vorherige Woche
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setWeekStart((prev) => {
                  const next = new Date(prev);
                  next.setDate(prev.getDate() + 7);
                  return getWeekStart(next);
                })
              }
            >
              Nächste Woche →
            </Button>
          </div>
        </header>
        <div className="mt-6 space-y-3">
          {loadingEntries ? (
            <p className="text-sm text-gray-500">Wochenübersicht lädt…</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-7">
              {weekDays.map((day, index) => {
                const entry = activeEntriesByDay[index];
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex flex-col rounded-2xl border px-3 py-3 text-sm ${
                      entry ? "border-daisy-400 bg-daisy-50" : "border-daisy-100 bg-white"
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {day.toLocaleDateString("de-DE", {
                        weekday: "short",
                        day: "numeric"
                      })}
                    </span>
                    {entry ? (
                      <>
                        <span className="font-semibold text-gray-900">{entry.cardTitle}</span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(entry.createdAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Noch nichts gespeichert</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Verlauf</p>
          <h3 className="text-xl font-semibold text-gray-900">Letzte Haushalts-Logs</h3>
        </header>
        {logsLoading ? (
          <p className="mt-3 text-sm text-gray-500">Logs werden geladen…</p>
        ) : logs.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">Noch keine Logs vorhanden.</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-gray-700">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-2xl border border-daisy-100 bg-white/90 px-4 py-3"
              >
                <div
                  className="prose prose-sm text-gray-800"
                  dangerouslySetInnerHTML={{ __html: log.contentHtml }}
                />
                <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-gray-400">
                  {new Date(log.createdAt).toLocaleString("de-DE", {
                    dateStyle: "short",
                    timeStyle: "short"
                  })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
