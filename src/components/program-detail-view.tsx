"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Link2, Pencil, SlidersHorizontal, Users, X } from "lucide-react";

import { useAuth } from "@/components/auth-gate";
import { ProgramContent } from "@/components/program-content";
import { Button } from "@/components/ui/button";
import { ProgramCardsSidebar, type ProgramCardsSection } from "@/components/program-cards-sidebar";
import type { ProgramDefinition, RoleDefinition } from "@/lib/types";

const PROGRAM_CARD_SECTIONS: Record<string, ProgramCardsSection[]> = {
  visualisierungstraining: ["visuals"],
  "performance-checklist": ["performance"],
  lesen: ["reading"],
  "household-cards": ["household"],
  "ziele-smart": ["goals"],
  "brain-training": ["brain"],
  "higher-thinking": ["learning"],
  "emotion-training": ["emotion"],
  meditation: ["meditation"],
  "daily-checklist-body": ["program_settings"],
  "daily-checklist-human": ["program_settings"],
  "environment-program": ["program_settings"],
  "business-development-program": ["program_settings"]
};

interface ProgramDetailViewProps {
  program: ProgramDefinition;
  backLink: string;
}

function roleStateDefaultValue(state: { minValue: number; maxValue: number; step: number }) {
  const midpoint = Math.round((state.minValue + state.maxValue) / 2);
  const step = Math.max(1, state.step);
  const normalized = Math.round(midpoint / step) * step;
  return Math.max(state.minValue, Math.min(state.maxValue, normalized));
}

export function ProgramDetailView({ program, backLink }: ProgramDetailViewProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rolesSidebarOpen, setRolesSidebarOpen] = useState(false);
  const [stateTrackingOpen, setStateTrackingOpen] = useState(false);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [linkedRoleIds, setLinkedRoleIds] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [trackingRoleId, setTrackingRoleId] = useState<string | null>(null);
  const [trackingValuesByRole, setTrackingValuesByRole] = useState<
    Record<string, Record<string, number>>
  >({});
  const [trackingNote, setTrackingNote] = useState("");
  const [trackingSaving, setTrackingSaving] = useState(false);

  const sections = useMemo(
    () => PROGRAM_CARD_SECTIONS[program.slug] ?? [],
    [program.slug]
  );
  const hasCards = sections.length > 0;

  const linkedRoles = useMemo(
    () => roles.filter((role) => linkedRoleIds.includes(role.id)),
    [roles, linkedRoleIds]
  );

  const activeTrackingRole = useMemo(
    () => linkedRoles.find((role) => role.id === trackingRoleId) ?? linkedRoles[0] ?? null,
    [linkedRoles, trackingRoleId]
  );

  const loadRoleLinks = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const roleParams = new URLSearchParams();
      const linksParams = new URLSearchParams({ programId: program.id });
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
  }, [program.id, user?.email, user?.name]);

  useEffect(() => {
    if (!rolesSidebarOpen && !stateTrackingOpen) return;
    void loadRoleLinks();
  }, [rolesSidebarOpen, stateTrackingOpen, loadRoleLinks]);

  useEffect(() => {
    if (!rolesSidebarOpen && !stateTrackingOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [rolesSidebarOpen, stateTrackingOpen]);

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

  const saveRoleLinks = async () => {
    setRolesSaving(true);
    setRolesError(null);
    try {
      const response = await fetch("/api/roles/links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: program.id,
          roleIds: linkedRoleIds,
          userEmail: user?.email,
          userName: user?.name
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Rollen-Verknüpfungen konnten nicht gespeichert werden.");
      }

      await loadRoleLinks();
      setRolesSidebarOpen(false);
    } catch (requestError) {
      console.error(requestError);
      setRolesError(
        requestError instanceof Error
          ? requestError.message
          : "Rollen-Verknüpfungen konnten nicht gespeichert werden."
      );
    } finally {
      setRolesSaving(false);
    }
  };

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
          programId: program.id,
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backLink}
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/70 bg-white/80 px-4 py-2 text-xs font-arcade uppercase tracking-[0.35em] text-[#0b1230] shadow-arcade transition hover:-translate-x-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setStateTrackingOpen(false);
              setRolesSidebarOpen(true);
            }}
          >
            <Users className="h-4 w-4" />
            Mit Rollen verknüpfen
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setSidebarOpen(false);
              setRolesSidebarOpen(false);
              setStateTrackingOpen(true);
            }}
          >
            <SlidersHorizontal className="h-4 w-4" />
            State Tracking
          </Button>
          {hasCards && (
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setRolesSidebarOpen(false);
                setStateTrackingOpen(false);
                setSidebarOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <ProgramContent program={program} />

      {hasCards && (
        <ProgramCardsSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sections={sections}
          program={program}
          title={`${program.code} Einstellungen`}
        />
      )}

      {rolesSidebarOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Roles schließen"
            onClick={() => setRolesSidebarOpen(false)}
            className="absolute inset-0 bg-[#050a1f]/60 backdrop-blur"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col overflow-hidden rounded-l-[36px] border-l-4 border-white/60 bg-gradient-to-b from-[#131f47]/95 via-[#2c3f9a]/90 to-[#6d5ce0]/90 text-white shadow-arcade">
            <header className="flex items-center justify-between border-b border-white/15 px-6 py-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.45em] text-[#ffd879]">Roles</p>
                <h2 className="text-2xl font-semibold uppercase tracking-[0.2em]">
                  {program.code} Verknüpfung
                </h2>
              </div>
              <Button variant="outline" type="button" onClick={() => setRolesSidebarOpen(false)}>
                <X className="h-4 w-4" />
                Schließen
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-sm text-white/85">
                Weise diese Card einer oder mehreren Rollen zu. Die Verknüpfung ist bidirektional und erscheint direkt in der Roles-Ansicht.
              </p>

              {rolesError && (
                <div className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-3 text-sm text-red-100">
                  {rolesError}
                </div>
              )}

              {rolesLoading ? (
                <p className="mt-5 text-sm text-white/80">Rollen werden geladen...</p>
              ) : roles.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-white/25 bg-white/10 p-4 text-sm text-white/85">
                  <p>Es sind noch keine Rollen vorhanden.</p>
                  <Link
                    href="/roles"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/30"
                  >
                    <Link2 className="h-4 w-4" />
                    Zu Roles wechseln
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-3">
                    {roles.map((role) => {
                      const checked = linkedRoleIds.includes(role.id);
                      return (
                        <label
                          key={role.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                            checked
                              ? "border-[#9fe7ff] bg-white/20"
                              : "border-white/20 bg-white/10 hover:bg-white/15"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[#7de0ff]"
                            checked={checked}
                            onChange={() =>
                              setLinkedRoleIds((prev) =>
                                checked
                                  ? prev.filter((entry) => entry !== role.id)
                                  : [...prev, role.id]
                              )
                            }
                          />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-white">{role.name}</span>
                            <span className="mt-0.5 block text-xs text-white/75">
                              {role.states.length} States
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/85">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9fe7ff]">
                      Aktive Verknüpfung
                    </p>
                    {linkedRoles.length === 0 ? (
                      <p className="mt-2">Der Card ist aktuell keine Rolle zugeordnet.</p>
                    ) : (
                      <ul className="mt-2 grid gap-2">
                        {linkedRoles.map((role) => (
                          <li
                            key={role.id}
                            className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm"
                          >
                            {role.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/15 px-6 py-4">
              <p className="text-xs text-white/70">{linkedRoleIds.length} Rolle(n) ausgewählt</p>
              <Button
                type="button"
                onClick={saveRoleLinks}
                disabled={rolesLoading || rolesSaving || roles.length === 0}
              >
                <Link2 className="h-4 w-4" />
                {rolesSaving ? "Speichert..." : "Verknüpfung speichern"}
              </Button>
            </footer>
          </aside>
        </div>
      )}

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
                  {program.code} State Tracking
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStateTrackingOpen(false);
                      setRolesSidebarOpen(true);
                    }}
                    className="mt-3"
                  >
                    <Users className="h-4 w-4" />
                    Jetzt Rollen verknüpfen
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
    </>
  );
}
