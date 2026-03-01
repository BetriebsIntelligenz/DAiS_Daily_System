"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, SlidersHorizontal, Square, Timer, Users, X } from "lucide-react";

import type {
  ProgramDefinition,
  ProgramStackDefinition,
  RoleDefinition
} from "@/lib/types";
import { useAuth } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import { ProgramContent } from "@/components/program-content";
import { ProgramCompletionProvider } from "@/contexts/program-completion-context";
import { HOUSEHOLD_WEEKDAYS, formatWeekday } from "@/lib/household";

function roleStateDefaultValue(state: { minValue: number; maxValue: number; step: number }) {
  const midpoint = Math.round((state.minValue + state.maxValue) / 2);
  const step = Math.max(1, state.step);
  const normalized = Math.round(midpoint / step) * step;
  return Math.max(state.minValue, Math.min(state.maxValue, normalized));
}

export function ProgramStackRunner({
  stack,
  programs
}: {
  stack: ProgramStackDefinition;
  programs: ProgramDefinition[];
}) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedProgramIds, setCompletedProgramIds] = useState<string[]>([]);
  const [flowFinished, setFlowFinished] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [autoSubmitReady, setAutoSubmitReady] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const autoSubmitRef = useRef<(() => Promise<void>) | null>(null);
  const [stateTrackingOpen, setStateTrackingOpen] = useState(false);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [linkedRoleIds, setLinkedRoleIds] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [trackingRoleId, setTrackingRoleId] = useState<string | null>(null);
  const [trackingValuesByRole, setTrackingValuesByRole] = useState<
    Record<string, Record<string, number>>
  >({});
  const [trackingNote, setTrackingNote] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleTimer = () => setTimerActive((prev) => !prev);
  const stopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const currentProgram = programs[currentIndex];
  const currentCompleted = completedProgramIds.includes(currentProgram.id);
  const total = programs.length;
  const linkedRoles = useMemo(
    () => roles.filter((role) => linkedRoleIds.includes(role.id)),
    [roles, linkedRoleIds]
  );
  const activeTrackingRole = useMemo(
    () => linkedRoles.find((role) => role.id === trackingRoleId) ?? linkedRoles[0] ?? null,
    [linkedRoles, trackingRoleId]
  );

  const handleProgramCompleted = useCallback(
    async (program: ProgramDefinition) => {
      setCompletedProgramIds((prev) =>
        prev.includes(program.id) ? prev : [...prev, program.id]
      );
      setFlowFinished(false);
    },
    []
  );

  const registerAutoSubmit = useCallback((handler: (() => Promise<void>) | null) => {
    autoSubmitRef.current = handler;
    setAutoSubmitReady(Boolean(handler));
  }, []);

  const attemptAutoSubmit = useCallback(async () => {
    const handler = autoSubmitRef.current;
    if (!handler) {
      console.warn("Kein Auto-Submit Handler registriert", currentProgram.id);
      return false;
    }
    setAutoSubmitting(true);
    try {
      await handler();
      return true;
    } catch (error) {
      console.error("Programm konnte nicht automatisch abgeschlossen werden", error);
      return false;
    } finally {
      setAutoSubmitting(false);
    }
  }, [currentProgram.id]);

  const loadRoleLinks = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const roleParams = new URLSearchParams();
      const linksParams = new URLSearchParams({ programId: currentProgram.id });
      if (user?.email) {
        roleParams.set("userEmail", user.email);
        linksParams.set("userEmail", user.email);
      }
      if (user?.name) {
        roleParams.set("userName", user.name);
        linksParams.set("userName", user.name);
      }

      const [rolesResponse, linksResponse] = await Promise.all([
        fetch(`/api/roles?${roleParams.toString()}`),
        fetch(`/api/roles/links?${linksParams.toString()}`)
      ]);

      if (!rolesResponse.ok) {
        const data = await rolesResponse.json().catch(() => null);
        throw new Error(data?.error ?? "Rollen konnten nicht geladen werden.");
      }
      if (!linksResponse.ok) {
        const data = await linksResponse.json().catch(() => null);
        throw new Error(data?.error ?? "Card-Verknüpfungen konnten nicht geladen werden.");
      }

      const rolesPayload = (await rolesResponse.json()) as RoleDefinition[];
      const linksPayload = (await linksResponse.json()) as { roleIds?: string[] };

      setRoles(Array.isArray(rolesPayload) ? rolesPayload : []);
      setLinkedRoleIds(
        Array.isArray(linksPayload.roleIds)
          ? linksPayload.roleIds.filter((entry): entry is string => typeof entry === "string")
          : []
      );
    } catch (requestError) {
      console.error(requestError);
      setRolesError(
        requestError instanceof Error
          ? requestError.message
          : "Rollen konnten nicht geladen werden."
      );
    } finally {
      setRolesLoading(false);
    }
  }, [currentProgram.id, user?.email, user?.name]);

  useEffect(() => {
    if (!stateTrackingOpen) return;
    void loadRoleLinks();
  }, [loadRoleLinks, stateTrackingOpen]);

  useEffect(() => {
    if (!stateTrackingOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [stateTrackingOpen]);

  useEffect(() => {
    if (!stateTrackingOpen) return;
    if (linkedRoles.length === 0) {
      setTrackingRoleId(null);
      return;
    }

    setTrackingRoleId((current) => {
      if (current && linkedRoles.some((role) => role.id === current)) {
        return current;
      }
      return linkedRoles[0]?.id ?? null;
    });

    setTrackingValuesByRole((previous) => {
      const next = { ...previous };
      for (const role of linkedRoles) {
        if (!next[role.id]) {
          next[role.id] = Object.fromEntries(
            role.states.map((state) => [state.id, roleStateDefaultValue(state)])
          );
        } else {
          for (const state of role.states) {
            if (typeof next[role.id][state.id] !== "number") {
              next[role.id][state.id] = roleStateDefaultValue(state);
            }
          }
        }
      }
      return next;
    });
  }, [linkedRoles, stateTrackingOpen]);

  const saveStateTracking = async () => {
    if (!activeTrackingRole) {
      setRolesError("Keine Rolle für State-Tracking ausgewählt.");
      return;
    }
    if (activeTrackingRole.states.length === 0) {
      setRolesError("Die ausgewählte Rolle hat noch keine States.");
      return;
    }

    setTrackingSaving(true);
    setRolesError(null);
    try {
      const roleValues = trackingValuesByRole[activeTrackingRole.id] ?? {};
      const entries = activeTrackingRole.states.map((state) => ({
        stateId: state.id,
        score:
          typeof roleValues[state.id] === "number"
            ? roleValues[state.id]
            : roleStateDefaultValue(state)
      }));
      const response = await fetch(`/api/roles/${activeTrackingRole.id}/state-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          note: trackingNote,
          programId: currentProgram.id,
          userEmail: user?.email,
          userName: user?.name
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "State-Tracking konnte nicht gespeichert werden.");
      }

      setTrackingNote("");
      setStateTrackingOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setRolesError(
        requestError instanceof Error
          ? requestError.message
          : "State-Tracking konnte nicht gespeichert werden."
      );
    } finally {
      setTrackingSaving(false);
    }
  };

  const goNext = useCallback(async () => {
    if (flowFinished || autoSubmitting) return;
    if (!currentCompleted) {
      const success = await attemptAutoSubmit();
      if (!success) return;
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlowFinished(false);
    } else {
      setFlowFinished(true);
      setTimerActive(false); // Auto-stop timer
    }
  }, [attemptAutoSubmit, autoSubmitting, currentCompleted, currentIndex, flowFinished, total]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setFlowFinished(false);
  };

  const stackProgress = useMemo(
    () => ((completedProgramIds.length / total) * 100).toFixed(0),
    [completedProgramIds.length, total]
  );

  const completionContextValue = useMemo(
    () => ({
      onProgramCompleted: handleProgramCompleted,
      redirectTo: null,
      autoSubmitEnabled: true,
      registerAutoSubmit
    }),
    [handleProgramCompleted, registerAutoSubmit]
  );

  return (
    <div className="space-y-6 text-[#0b1230]">
      <div className="rounded-[28px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold shadow-arcade">
        Programm Modus: {stack.title}
        {stack.durationMinutes && (
          <span className="block text-xs font-normal text-gray-500">
            Geplante Dauer: {stack.durationMinutes} Min.
          </span>
        )}
      </div>

      {stack.weekdays && stack.weekdays.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-daisy-200 bg-white/50 text-xs shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-daisy-50 text-daisy-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Wochentag</th>
                <th className="px-3 py-2 font-semibold">Start</th>
                <th className="px-3 py-2 font-semibold">Ende</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-daisy-100">
              {stack.weekdays
                .sort((a, b) => a - b)
                .map((day) => {
                  const startTime =
                    stack.startTimes && stack.startTimes[day]
                      ? stack.startTimes[day]
                      : stack.startTime;

                  let endTime = "-";
                  if (startTime && stack.durationMinutes) {
                    const [h, m] = startTime.split(":").map(Number);
                    const end = new Date();
                    end.setHours(h, m + stack.durationMinutes);
                    endTime = end.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  }

                  return (
                    <tr key={day} className="text-gray-600">
                      <td className="px-3 py-2 font-medium">
                        {formatWeekday(day)}
                      </td>
                      <td className="px-3 py-2">{startTime || "-"}</td>
                      <td className="px-3 py-2">{endTime}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between rounded-[24px] border border-daisy-200 bg-white/50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-lg font-bold font-mono text-daisy-900">
          <Timer className="h-5 w-5 text-daisy-500" />
          <span>{formatTime(timerSeconds)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-daisy-600 hover:bg-daisy-100 hover:text-daisy-800"
            onClick={toggleTimer}
          >
            {timerActive ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
            <span className="sr-only">{timerActive ? "Pause" : "Start"}</span>
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={stopTimer}
          >
            <Square className="h-4 w-4 fill-current" />
            <span className="sr-only">Stop</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm text-[#4b5685]">
        <span>
          Schritt {currentIndex + 1} von {total} · Fortschritt {stackProgress}%
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-[#7a83b5]">
          {stack.summary}
        </span>
      </div>
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          type="button"
          onClick={() => setStateTrackingOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          State Tracking
        </Button>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#6f78aa]">
        {programs.map((program, index) => {
          const done = completedProgramIds.includes(program.id);
          const isActive = index === currentIndex;
          return (
            <li
              key={program.id}
              className={`rounded-full border-2 px-3 py-1 ${done
                ? "border-white/90 bg-[#ffe5f9] text-[#821650]"
                : isActive
                  ? "border-white/70 bg-white text-[#0b1230] shadow-arcade"
                  : "border-white/40 bg-white/60 text-[#4f5a87]"
                }`}
            >
              {program.code}
            </li>
          );
        })}
      </ol>
      <ProgramCompletionProvider value={completionContextValue}>
        <ProgramContent program={currentProgram} />
      </ProgramCompletionProvider>
      {flowFinished && (
        <div className="rounded-[26px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm text-[#0b1230] shadow-arcade">
          Programm abgeschlossen! Wähle eine Folgeaktion.
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
          Zurück
        </Button>
        <Button
          variant="lagoon"
          onClick={() => void goNext()}
          disabled={
            flowFinished ||
            autoSubmitting ||
            (!currentCompleted && !autoSubmitReady)
          }
        >
          {autoSubmitting
            ? "Speichert…"
            : currentIndex === total - 1
              ? "Programm abschließen"
              : "Weiter"}
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Zum Hauptmenü</Link>
        </Button>
      </div>

      {stateTrackingOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="State Tracking schließen"
            onClick={() => setStateTrackingOpen(false)}
            className="absolute inset-0 bg-[#050a1f]/60 backdrop-blur"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col overflow-hidden rounded-l-[36px] border-l-4 border-white/60 bg-gradient-to-b from-[#131f47]/95 via-[#2c3f9a]/90 to-[#6d5ce0]/90 text-white shadow-arcade">
            <header className="flex items-center justify-between border-b border-white/15 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-[#ffd879]">SC</p>
                <h2 className="text-2xl font-semibold uppercase tracking-[0.2em]">
                  {currentProgram.code} State Tracking
                </h2>
              </div>
              <Button variant="outline" type="button" onClick={() => setStateTrackingOpen(false)}>
                <X className="h-4 w-4" />
                Schließen
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-sm text-white/85">
                Erfasse die Rollen-States direkt für diese Card. Die Einträge werden als Rollen-State-Tracking gespeichert und im Journal dokumentiert.
              </p>

              {rolesError && (
                <div className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-100">
                  {rolesError}
                </div>
              )}

              {rolesLoading ? (
                <p className="mt-5 text-sm text-white/80">Rollen werden geladen...</p>
              ) : linkedRoles.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-white/85">
                  <p>Diese Card ist noch keiner Rolle zugeordnet.</p>
                  <Button asChild type="button" variant="outline" className="mt-3">
                    <Link href={`/programs/${currentProgram.slug}`}>
                      <Users className="h-4 w-4" />
                      Jetzt Rollen verknüpfen
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {linkedRoles.map((role) => {
                      const active = role.id === activeTrackingRole?.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setTrackingRoleId(role.id)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                            active
                              ? "border-[#9fe7ff] bg-white/25 text-white"
                              : "border-white/25 bg-white/10 text-white/80 hover:bg-white/20"
                          }`}
                        >
                          {role.name}
                        </button>
                      );
                    })}
                  </div>

                  {activeTrackingRole == null ? null : activeTrackingRole.states.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-white/85">
                      Die Rolle &quot;{activeTrackingRole.name}&quot; hat noch keine States. Bitte in der Rollenverwaltung zuerst States anlegen.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4 rounded-2xl border border-white/20 bg-white/10 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9fe7ff]">
                        {activeTrackingRole.name}
                      </p>
                      {activeTrackingRole.states.map((state) => {
                        const roleValues = trackingValuesByRole[activeTrackingRole.id] ?? {};
                        const value =
                          typeof roleValues[state.id] === "number"
                            ? roleValues[state.id]
                            : roleStateDefaultValue(state);
                        return (
                          <label
                            key={state.id}
                            className="flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-semibold text-white"
                          >
                            {state.name}: <span className="text-[#9fe7ff]">{value}</span>
                            <input
                              type="range"
                              min={state.minValue}
                              max={state.maxValue}
                              step={Math.max(1, state.step)}
                              value={value}
                              onChange={(event) =>
                                setTrackingValuesByRole((prev) => ({
                                  ...prev,
                                  [activeTrackingRole.id]: {
                                    ...(prev[activeTrackingRole.id] ?? {}),
                                    [state.id]: Number(event.target.value)
                                  }
                                }))
                              }
                              className="accent-[#7de0ff]"
                            />
                          </label>
                        );
                      })}
                      <textarea
                        value={trackingNote}
                        onChange={(event) => setTrackingNote(event.target.value)}
                        placeholder="Notiz zu diesem Tracking (optional)"
                        className="min-h-[88px] w-full rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/15 px-6 py-4">
              <p className="text-xs text-white/70">
                {activeTrackingRole?.name ? `Aktive Rolle: ${activeTrackingRole.name}` : "Keine aktive Rolle"}
              </p>
              <Button
                type="button"
                onClick={saveStateTracking}
                disabled={
                  rolesLoading ||
                  trackingSaving ||
                  activeTrackingRole == null ||
                  activeTrackingRole.states.length === 0
                }
              >
                <SlidersHorizontal className="h-4 w-4" />
                {trackingSaving ? "Speichert..." : "State Tracking speichern"}
              </Button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
