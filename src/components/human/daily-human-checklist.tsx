"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Mail,
  MessageCircle,
  PhoneCall,
  Users,
  Video
} from "lucide-react";

import type {
  HumanContactActivity,
  HumanContactLogEntry,
  HumanContactPersonDefinition,
  HumanContactStatsEntry,
  ProgramDefinition
} from "@/lib/types";
import {
  HUMAN_ACTIVITY_OPTIONS,
  HUMAN_CADENCE_OPTIONS,
  getHumanActivityLabel,
  getHumanRelationLabel
} from "@/lib/human";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SuccessToast } from "@/components/success-toast";
import { useAuth } from "@/components/auth-gate";
import { cn } from "@/lib/utils";

type LogsByPerson = Record<string, HumanContactLogEntry[]>;

const ACTIVITY_ICONS: Record<HumanContactActivity, LucideIcon> = {
  whatsapp: MessageCircle,
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  video_call: Video
};

async function parseError(response: Response) {
  try {
    const payload = await response.json();
    if (payload && typeof payload.error === "string") {
      return payload.error;
    }
  } catch {
    // ignore
  }
  return null;
}

function formatTimestamp(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DailyHumanChecklist({ program }: { program: ProgramDefinition }) {
  const auth = useAuth();
  const [contacts, setContacts] = useState<HumanContactPersonDefinition[]>([]);
  const [contactStats, setContactStats] = useState<HumanContactStatsEntry[]>([]);
  const [logs, setLogs] = useState<LogsByPerson>({});
  const [logSelections, setLogSelections] = useState<Record<string, string | null>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [logLoading, setLogLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const statsById = useMemo(
    () =>
      contactStats.reduce<Record<string, HumanContactStatsEntry>>((acc, entry) => {
        acc[entry.personId] = entry;
        return acc;
      }, {}),
    [contactStats]
  );

  const loadContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/human/contacts");
      if (!response.ok) {
        const message = await parseError(response);
        throw new Error(message ?? "Kontakte konnten nicht geladen werden.");
      }
      const payload = await response.json();
      setContacts(
        Array.isArray(payload.persons)
          ? (payload.persons as HumanContactPersonDefinition[])
          : []
      );
      setContactStats(
        Array.isArray(payload.stats)
          ? (payload.stats as HumanContactStatsEntry[])
          : []
      );
    } catch (requestError) {
      console.error("Human contacts load failed", requestError);
      setContacts([]);
      setContactStats([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Kontakte konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureLogs = useCallback(
    async (personId: string) => {
      if (logs[personId]) {
        return;
      }
      setLogLoading((prev) => ({ ...prev, [personId]: true }));
      try {
        const response = await fetch(
          `/api/human/contacts/logs?personId=${encodeURIComponent(personId)}`
        );
        if (!response.ok) {
          const message = await parseError(response);
          throw new Error(message ?? "Verlauf konnte nicht geladen werden.");
        }
        const payload = (await response.json()) as HumanContactLogEntry[];
        setLogs((prev) => ({ ...prev, [personId]: payload ?? [] }));
      } catch (requestError) {
        console.error("Human contact logs failed", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Verlauf konnte nicht geladen werden."
        );
      } finally {
        setLogLoading((prev) => ({ ...prev, [personId]: false }));
      }
    },
    [logs]
  );

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const handleLogActivity = useCallback(
    async (personId: string, activity: HumanContactActivity) => {
      const key = `${personId}:${activity}`;
      setSavingKey(key);
      setError(null);
      try {
        const response = await fetch("/api/human/contacts/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personId,
            activity,
            note: noteDrafts[personId] ?? "",
            userEmail: auth.user?.email,
            userName: auth.user?.name
          })
        });
        if (!response.ok) {
          const message = await parseError(response);
          throw new Error(message ?? "Aktivität konnte nicht gespeichert werden.");
        }
        const payload = await response.json();
        if (payload.log) {
          setLogs((prev) => {
            const existing = prev[personId] ?? [];
            const next = [payload.log as HumanContactLogEntry, ...existing].slice(0, 20);
            return { ...prev, [personId]: next };
          });
          setLogSelections((prev) => ({
            ...prev,
            [personId]: (payload.log as HumanContactLogEntry).id
          }));
        }
        if (payload.stats) {
          setContactStats((prev) => {
            const next = prev.filter((entry) => entry.personId !== personId);
            next.push(payload.stats as HumanContactStatsEntry);
            return next;
          });
        }
        setNoteDrafts((prev) => ({ ...prev, [personId]: "" }));
        setToastMessage(`${getHumanActivityLabel(activity)} gespeichert`);
      } catch (requestError) {
        console.error("Human contact log failed", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Aktivität konnte nicht gespeichert werden."
        );
      } finally {
        setSavingKey(null);
      }
    },
    [auth.user?.email, auth.user?.name, noteDrafts]
  );

  const sortedContacts = useMemo(
    () => contacts.slice().sort((left, right) => left.name.localeCompare(right.name)),
    [contacts]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-daisy-100 bg-white/80 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-500">
            {program.code} · Human Checklist
          </p>
          <h2 className="text-lg font-semibold text-gray-900">{program.name}</h2>
          <p className="text-sm text-gray-600">
            {program.summary} — {sortedContacts.length} Kontakte
          </p>
        </div>
        <SuccessToast message={toastMessage ?? undefined} />
      </div>

      {error && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Kontakte werden geladen…</p>
      ) : sortedContacts.length === 0 ? (
        <p className="rounded-3xl border border-daisy-100 bg-white/80 px-4 py-6 text-sm text-gray-500">
          Noch keine Kontakte im Admin Bereich angelegt. Bitte im Admin &rarr; Daily Human
          Abschnitt Personen hinzufügen.
        </p>
      ) : (
        <div className="space-y-5">
          {sortedContacts.map((person) => {
            const stats = statsById[person.id];
            const noteValue = noteDrafts[person.id] ?? "";
            const selectedLogId = logSelections[person.id] ?? "";
            const personLogs = logs[person.id] ?? [];
            const selectedLog = personLogs.find((entry) => entry.id === selectedLogId);
            return (
              <Card key={person.id} className="space-y-4">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      {getHumanRelationLabel(person.relation)}
                    </p>
                    <h3 className="text-xl font-semibold text-gray-900">{person.name}</h3>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>Tägliche Kontakte:{" "}
                      {
                        person.assignments.filter((assignment) => assignment.cadence === "daily")
                          .length
                      }
                    </p>
                    <p>Weekly Kontakte:{" "}
                      {
                        person.assignments.filter((assignment) => assignment.cadence === "weekly")
                          .length
                      }
                    </p>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {HUMAN_CADENCE_OPTIONS.map((cadence) => {
                    const assignments = person.assignments.filter(
                      (assignment) => assignment.cadence === cadence.value
                    );
                    return (
                      <div
                        key={`${person.id}-${cadence.value}`}
                        className="rounded-2xl border border-daisy-100 bg-white/80 p-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                          {cadence.label}
                        </p>
                        {assignments.length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            Keine Touchpoints hinterlegt.
                          </p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {assignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="rounded-full bg-daisy-100 px-3 py-1 text-xs font-semibold text-daisy-700"
                              >
                                {getHumanActivityLabel(assignment.activity)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 rounded-2xl border border-daisy-100 bg-white/90 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Aktionen
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HUMAN_ACTIVITY_OPTIONS.map((activity) => {
                      const Icon = ACTIVITY_ICONS[activity.value];
                      const busy = savingKey === `${person.id}:${activity.value}`;
                      return (
                        <Button
                          key={`${person.id}-${activity.value}`}
                          type="button"
                          disabled={busy}
                          onClick={() => void handleLogActivity(person.id, activity.value)}
                          className={cn(
                            "rounded-2xl border px-4 py-2 text-xs",
                            busy
                              ? "border-daisy-200 bg-daisy-100 text-daisy-600"
                              : "border-daisy-200 bg-white text-gray-800 hover:bg-daisy-50"
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4" />}
                          {busy ? "Speichert…" : activity.label}
                        </Button>
                      );
                    })}
                  </div>
                  <textarea
                    value={noteValue}
                    onChange={(event) =>
                      setNoteDrafts((prev) => ({ ...prev, [person.id]: event.target.value }))
                    }
                    placeholder="Notiz für das nächste Gespräch (optional)"
                    className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm text-gray-700 focus:border-daisy-400 focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-daisy-100 bg-white/80 p-3">
                    <label className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                      Verlauf
                    </label>
                    <select
                      value={selectedLogId ?? ""}
                      onFocus={() => void ensureLogs(person.id)}
                      onChange={(event) =>
                        setLogSelections((prev) => ({
                          ...prev,
                          [person.id]: event.target.value || null
                        }))
                      }
                      className="mt-2 w-full rounded-2xl border border-daisy-200 px-4 py-2 text-sm"
                    >
                      <option value="">
                        {logLoading[person.id]
                          ? "Verlauf lädt…"
                          : personLogs.length === 0
                            ? "Noch kein Eintrag"
                            : "Eintrag auswählen"}
                      </option>
                      {personLogs.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {`${getHumanActivityLabel(entry.activity)} · ${formatTimestamp(
                            entry.createdAt
                          )}`}
                        </option>
                      ))}
                    </select>
                    {selectedLog && (
                      <div className="mt-3 rounded-2xl border border-daisy-100 bg-white/90 p-3 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {getHumanActivityLabel(selectedLog.activity)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(selectedLog.createdAt)}
                        </p>
                        {selectedLog.note && <p className="mt-1">{selectedLog.note}</p>}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-daisy-100 bg-white/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                      Live Statistik (30 Tage)
                    </p>
                    {stats && stats.total > 0 ? (
                      <div className="mt-2 space-y-2">
                        {stats.distribution.map((entry) => {
                          const width =
                            entry.percentage > 0
                              ? entry.percentage
                              : entry.count > 0
                                ? 8
                                : 0;
                          return (
                            <div key={entry.activity} className="flex items-center gap-3 text-xs">
                              <span className="w-24 text-gray-500">
                                {getHumanActivityLabel(entry.activity)}
                              </span>
                              <div className="relative h-2 flex-1 rounded-full bg-daisy-100">
                                <div
                                  className="absolute inset-y-0 rounded-full bg-gradient-to-r from-daisy-400 to-daisy-600"
                                  style={{ width: `${width}%` }}
                                />
                              </div>
                              <span className="w-6 text-right font-semibold text-gray-700">
                                {entry.count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">
                        Noch keine Aktivitäten aufgezeichnet.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
