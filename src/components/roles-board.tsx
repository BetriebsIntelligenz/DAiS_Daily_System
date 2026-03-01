"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Info,
  Link2,
  Pencil,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";

import { useAuth } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import type {
  ProgramDefinition,
  RoleDefinition,
  RoleStateEntry
} from "@/lib/types";

interface RoleFormState {
  name: string;
  goal: string;
  description: string;
  notes: string;
  attributes: string;
}

interface StateFormState {
  name: string;
  minValue: number;
  maxValue: number;
  step: number;
  order: number;
}

const EMPTY_ROLE_FORM: RoleFormState = {
  name: "",
  goal: "",
  description: "",
  notes: "",
  attributes: ""
};

const EMPTY_STATE_FORM: StateFormState = {
  name: "",
  minValue: 1,
  maxValue: 10,
  step: 1,
  order: 1
};

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function roleStateDefaultValue(state: {
  minValue: number;
  maxValue: number;
  step: number;
}) {
  const midpoint = Math.round((state.minValue + state.maxValue) / 2);
  const step = Math.max(1, state.step);
  const normalized = Math.round(midpoint / step) * step;
  return Math.max(state.minValue, Math.min(state.maxValue, normalized));
}

function buildDefaultStateValues(states: RoleDefinition["states"]) {
  return Object.fromEntries(
    states.map((state) => [state.id, roleStateDefaultValue(state)])
  );
}

function RoleAvatar({ name, seed }: { name: string; seed?: string | null }) {
  const source = `${name}:${seed ?? ""}`;
  const hash = hashString(source);
  const palettes = [
    ["#5ec8ff", "#4f80ff"],
    ["#ff7bb0", "#ffb36f"],
    ["#66e0a3", "#3ea1ff"],
    ["#8f8bff", "#5ec8ff"],
    ["#ff9c7d", "#ffd36b"]
  ];
  const palette = palettes[hash % palettes.length];
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/70 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(8,19,44,0.35)]"
      style={{
        background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})`
      }}
    >
      <div className="absolute inset-1 rounded-xl border border-white/30" />
      <div className="absolute -right-2 -top-2 h-8 w-8 rounded-full bg-white/20" />
      <div className="absolute -bottom-2 -left-2 h-8 w-8 rounded-full bg-black/10" />
      <span className="relative z-10">{initials || "RL"}</span>
    </div>
  );
}

function buildRoleFromForm(
  roleId: string | null,
  form: RoleFormState,
  user: { email?: string; name?: string } | null
) {
  return {
    ...(roleId ? { id: roleId } : {}),
    name: form.name.trim(),
    goal: form.goal.trim(),
    description: form.description.trim(),
    notes: form.notes.trim(),
    attributes: form.attributes.trim(),
    userEmail: user?.email,
    userName: user?.name
  };
}

function FieldHelp({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Feldhilfe anzeigen"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-daisy-200 bg-white text-daisy-700 transition hover:bg-daisy-50"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute right-0 top-6 z-20 w-72 rounded-xl border border-daisy-200 bg-white p-3 text-left text-xs font-medium normal-case leading-relaxed text-gray-700 shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function FieldBlock({
  label,
  help,
  children,
  className = ""
}: {
  label: string;
  help: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{label}</p>
        <FieldHelp text={help} />
      </div>
      {children}
    </div>
  );
}

function StateControlDistribution({
  role,
  values
}: {
  role: RoleDefinition | null;
  values: Record<string, number>;
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
    const states = role?.states ?? [];
    const entries = states.map((state, index) => {
      const raw = values[state.id];
      const fallback = roleStateDefaultValue(state);
      const value = typeof raw === "number" ? raw : fallback;
      return {
        id: state.id,
        title: state.name,
        value,
        color: palette[index % palette.length]
      };
    });
    const sum = entries.reduce((acc, entry) => acc + entry.value, 0);
    const normalized =
      entries.length === 0
        ? []
        : sum === 0
          ? entries.map((entry) => ({
              ...entry,
              percent: 1 / entries.length
            }))
          : entries.map((entry) => ({
              ...entry,
              percent: entry.value / sum
            }));
    const nextAverage = entries.length > 0 ? sum / entries.length : 0;
    return { segments: normalized, total: sum, average: nextAverage };
  }, [role, values]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!role) {
    return (
      <div className="rounded-3xl border border-daisy-100 bg-white/70 p-4 text-sm text-gray-500">
        Rolle auswählen, um die State-Verteilung zu sehen.
      </div>
    );
  }

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
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Ø State</p>
            <p className="text-4xl font-bold text-daisy-700">{average.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Live</p>
          </div>
        </div>
      </div>
      <div>
        <header className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">SC Integration</p>
          <h3 className="text-lg font-semibold text-gray-900">State Controll Verteilung · {role.name}</h3>
          <p className="text-sm text-gray-500">
            100% Kreisdiagramm mit allen Rollen-States. Aktualisiert bei jeder Slider-Eingabe.
          </p>
        </header>
        {total === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Noch keine Werte gesetzt.
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
                  <p className="font-semibold text-gray-900">{segment.value.toFixed(1)}</p>
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

export function RolesBoard() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [programs, setPrograms] = useState<ProgramDefinition[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_ROLE_FORM);
  const [linkedProgramIds, setLinkedProgramIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateForm, setStateForm] = useState<StateFormState>(EMPTY_STATE_FORM);
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [savingStateConfig, setSavingStateConfig] = useState(false);
  const [savingStateTracking, setSavingStateTracking] = useState(false);
  const [stateValues, setStateValues] = useState<Record<string, number>>({});
  const [trackingNote, setTrackingNote] = useState("");
  const [stateEntries, setStateEntries] = useState<RoleStateEntry[]>([]);
  const [loadingStateEntries, setLoadingStateEntries] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const hydrateRoleForm = useCallback((role: RoleDefinition | null) => {
    if (!role) {
      setForm(EMPTY_ROLE_FORM);
      setLinkedProgramIds([]);
      setStateValues({});
      setStateForm(EMPTY_STATE_FORM);
      setEditingStateId(null);
      return;
    }
    setForm({
      name: role.name,
      goal: role.goal ?? "",
      description: role.description ?? "",
      notes: role.notes ?? "",
      attributes: role.attributes ?? ""
    });
    setLinkedProgramIds(role.linkedProgramIds);
    setStateValues(buildDefaultStateValues(role.states));
    setStateForm({
      ...EMPTY_STATE_FORM,
      order: (role.states.at(-1)?.order ?? role.states.length) + 1
    });
    setEditingStateId(null);
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (user?.email) params.set("userEmail", user.email);
      if (user?.name) params.set("userName", user.name);

      const [rolesResponse, programsResponse] = await Promise.all([
        fetch(`/api/roles?${params.toString()}`),
        fetch("/api/programs")
      ]);

      if (!rolesResponse.ok) {
        const data = await rolesResponse.json().catch(() => null);
        throw new Error(data?.error ?? "Rollen konnten nicht geladen werden.");
      }
      if (!programsResponse.ok) {
        const data = await programsResponse.json().catch(() => null);
        throw new Error(data?.error ?? "Cards konnten nicht geladen werden.");
      }

      const rolesPayload = (await rolesResponse.json()) as RoleDefinition[];
      const programsPayload = (await programsResponse.json()) as ProgramDefinition[];

      setRoles(Array.isArray(rolesPayload) ? rolesPayload : []);
      setPrograms(Array.isArray(programsPayload) ? programsPayload : []);
      setSelectedRoleId((current) => {
        if (current && rolesPayload.some((role) => role.id === current)) {
          return current;
        }
        return rolesPayload[0]?.id ?? null;
      });
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error ? requestError.message : "Rollen konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.name]);

  const loadStateEntries = useCallback(async () => {
    if (!selectedRoleId) {
      setStateEntries([]);
      return;
    }

    setLoadingStateEntries(true);
    try {
      const params = new URLSearchParams();
      if (user?.email) params.set("userEmail", user.email);
      if (user?.name) params.set("userName", user.name);
      const response = await fetch(
        `/api/roles/${selectedRoleId}/state-entries?${params.toString()}`
      );
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "State-Einträge konnten nicht geladen werden.");
      }
      const payload = (await response.json()) as RoleStateEntry[];
      setStateEntries(Array.isArray(payload) ? payload : []);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "State-Einträge konnten nicht geladen werden."
      );
    } finally {
      setLoadingStateEntries(false);
    }
  }, [selectedRoleId, user?.email, user?.name]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    hydrateRoleForm(selectedRole);
  }, [selectedRole, hydrateRoleForm]);

  useEffect(() => {
    void loadStateEntries();
  }, [loadStateEntries]);

  const startNewRole = () => {
    setSelectedRoleId(null);
    setForm(EMPTY_ROLE_FORM);
    setLinkedProgramIds([]);
    setStateValues({});
    setTrackingNote("");
    setStateEntries([]);
    setStateForm(EMPTY_STATE_FORM);
    setEditingStateId(null);
    setError(null);
  };

  const saveRole = async () => {
    if (!form.name.trim()) {
      setError("Bitte einen Rollennamen eintragen.");
      return;
    }

    setSavingRole(true);
    setError(null);
    try {
      const payload = buildRoleFromForm(selectedRoleId, form, user);
      const response = await fetch("/api/roles", {
        method: selectedRoleId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Rolle konnte nicht gespeichert werden.");
      }

      const savedRole = (await response.json()) as RoleDefinition;
      await refreshData();
      setSelectedRoleId(savedRole.id);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error ? requestError.message : "Rolle konnte nicht gespeichert werden."
      );
    } finally {
      setSavingRole(false);
    }
  };

  const deleteRole = async () => {
    if (!selectedRole) return;
    if (!window.confirm(`Rolle "${selectedRole.name}" wirklich löschen?`)) return;

    setSavingRole(true);
    setError(null);
    try {
      const response = await fetch("/api/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRole.id,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Rolle konnte nicht gelöscht werden.");
      }
      await refreshData();
      setSelectedRoleId(null);
      setForm(EMPTY_ROLE_FORM);
      setLinkedProgramIds([]);
      setStateValues({});
      setStateEntries([]);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error ? requestError.message : "Rolle konnte nicht gelöscht werden."
      );
    } finally {
      setSavingRole(false);
    }
  };

  const saveRoleCards = async () => {
    if (!selectedRole) {
      setError("Bitte zuerst eine Rolle auswählen.");
      return;
    }

    setSavingLinks(true);
    setError(null);
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/cards`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programIds: linkedProgramIds,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Card-Verknüpfungen konnten nicht gespeichert werden.");
      }
      await refreshData();
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Card-Verknüpfungen konnten nicht gespeichert werden."
      );
    } finally {
      setSavingLinks(false);
    }
  };

  const saveStateConfig = async () => {
    if (!selectedRole) {
      setError("Bitte zuerst eine Rolle auswählen.");
      return;
    }
    if (!stateForm.name.trim()) {
      setError("Bitte State-Namen eintragen.");
      return;
    }
    if (stateForm.minValue >= stateForm.maxValue) {
      setError("Min-Wert muss kleiner als Max-Wert sein.");
      return;
    }

    setSavingStateConfig(true);
    setError(null);
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/states`, {
        method: editingStateId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingStateId ? { stateId: editingStateId } : {}),
          ...stateForm,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "State konnte nicht gespeichert werden.");
      }
      await refreshData();
      setStateForm({
        ...EMPTY_STATE_FORM,
        order: (selectedRole.states.at(-1)?.order ?? selectedRole.states.length) + 1
      });
      setEditingStateId(null);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error ? requestError.message : "State konnte nicht gespeichert werden."
      );
    } finally {
      setSavingStateConfig(false);
    }
  };

  const startEditState = (state: RoleDefinition["states"][number]) => {
    setEditingStateId(state.id);
    setStateForm({
      name: state.name,
      minValue: state.minValue,
      maxValue: state.maxValue,
      step: state.step,
      order: state.order
    });
  };

  const deleteState = async (stateId: string) => {
    if (!selectedRole) return;
    if (!window.confirm("Diesen State wirklich löschen?")) return;

    setSavingStateConfig(true);
    setError(null);
    try {
      const response = await fetch(`/api/roles/${selectedRole.id}/states`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateId,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "State konnte nicht gelöscht werden.");
      }
      await refreshData();
      if (editingStateId === stateId) {
        setEditingStateId(null);
        setStateForm(EMPTY_STATE_FORM);
      }
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error ? requestError.message : "State konnte nicht gelöscht werden."
      );
    } finally {
      setSavingStateConfig(false);
    }
  };

  const saveRoleStateTracking = async () => {
    if (!selectedRole) {
      setError("Bitte zuerst eine Rolle auswählen.");
      return;
    }
    if (selectedRole.states.length === 0) {
      setError("Bitte zuerst States für diese Rolle anlegen.");
      return;
    }

    setSavingStateTracking(true);
    setError(null);
    try {
      const entries = selectedRole.states.map((state) => ({
        stateId: state.id,
        score:
          typeof stateValues[state.id] === "number"
            ? stateValues[state.id]
            : roleStateDefaultValue(state)
      }));
      const response = await fetch(`/api/roles/${selectedRole.id}/state-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries,
          note: trackingNote,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "State-Tracking konnte nicht gespeichert werden.");
      }
      setTrackingNote("");
      await loadStateEntries();
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "State-Tracking konnte nicht gespeichert werden."
      );
    } finally {
      setSavingStateTracking(false);
    }
  };

  const linkedPrograms = selectedRole?.linkedPrograms ?? [];

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-daisy-500">Roles</p>
        <h2 className="mt-2 text-2xl font-semibold text-gray-900">Rollenverwaltung</h2>
        <p className="mt-1 text-sm text-gray-600">
          Erstelle Rollen, verknüpfe Cards und nutze pro Rolle SC State Controll inklusive Verlauf.
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-daisy-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Deine Rollen</h3>
            <Button type="button" variant="outline" onClick={startNewRole}>
              <Plus className="h-4 w-4" />
              Neu
            </Button>
          </div>
          {loading ? (
            <p className="mt-4 text-sm text-gray-500">Rollen werden geladen...</p>
          ) : roles.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Noch keine Rollen vorhanden.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {roles.map((role) => {
                const active = role.id === selectedRoleId;
                return (
                  <li key={role.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleId(role.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        active
                          ? "border-daisy-300 bg-daisy-50 shadow-sm"
                          : "border-daisy-100 bg-white hover:border-daisy-200"
                      }`}
                    >
                      <RoleAvatar name={role.name} seed={role.avatarSeed} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900">{role.name}</p>
                        <p className="text-xs text-gray-500">
                          {role.linkedProgramIds.length} verknüpfte Cards · {role.states.length} States
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="space-y-6">
          <article className="rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedRoleId ? "Rolle bearbeiten" : "Neue Rolle erstellen"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedRoleId && (
                  <Button type="button" variant="ghost" onClick={deleteRole} disabled={savingRole}>
                    <Trash2 className="h-4 w-4" />
                    Löschen
                  </Button>
                )}
                <Button type="button" onClick={saveRole} disabled={savingRole}>
                  <BadgeCheck className="h-4 w-4" />
                  {savingRole ? "Speichert..." : "Rolle speichern"}
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <FieldBlock
                label="Rollenname"
                help="Name der Rolle. Dieser Name erscheint in der Rollenliste, in der Detailansicht und bei Verknüpfungen mit Cards."
              >
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Rollenname (z.B. Vater)"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </FieldBlock>
              <FieldBlock
                label="Ziel"
                help="Kernziel der Rolle. Hilft bei der inhaltlichen Ausrichtung und ist in der Rollenansicht sichtbar."
              >
                <input
                  value={form.goal}
                  onChange={(event) => setForm((prev) => ({ ...prev, goal: event.target.value }))}
                  placeholder="Ziel der Rolle"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </FieldBlock>
              <FieldBlock
                label="Beschreibung"
                help="Ausführliche Beschreibung der Rolle. Wird in der Detailansicht zur besseren Einordnung angezeigt."
                className="md:col-span-2"
              >
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Beschreibung der Rolle"
                  className="min-h-[120px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </FieldBlock>
              <FieldBlock
                label="Notizen"
                help="Freie Notizen zur Rolle. Geeignet für tägliche Hinweise, Kontext oder Ergänzungen."
              >
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Individuelle Notizen"
                  className="min-h-[120px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </FieldBlock>
              <FieldBlock
                label="Attribute"
                help="Weitere Merkmale oder Definitionen der Rolle. Dient zur klaren Abgrenzung gegenüber anderen Rollen."
              >
                <textarea
                  value={form.attributes}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, attributes: event.target.value }))
                  }
                  placeholder="Weitere Attribute / Definition"
                  className="min-h-[120px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </FieldBlock>
            </div>
          </article>

          <article className="rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm">
            <header className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Card Links</p>
                <h3 className="text-lg font-semibold text-gray-900">Mit Cards verknüpfen</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={saveRoleCards}
                disabled={!selectedRoleId || savingLinks}
              >
                <Link2 className="h-4 w-4" />
                {savingLinks ? "Speichert..." : "Verknüpfung speichern"}
              </Button>
            </header>

            {!selectedRoleId ? (
              <p className="mt-4 text-sm text-gray-500">Wähle zuerst eine Rolle aus.</p>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Card-Auswahl
                  </p>
                  <FieldHelp text="Wähle eine oder mehrere Cards aus, die zu dieser Rolle gehören. Die Auswahl wird beim Speichern der Verknüpfung übernommen." />
                </div>
                <div className="mt-4 grid max-h-[280px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {programs.map((program) => {
                    const checked = linkedProgramIds.includes(program.id);
                    return (
                      <label
                        key={program.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-2 text-sm ${
                          checked
                            ? "border-daisy-300 bg-daisy-50"
                            : "border-daisy-100 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-daisy-500"
                          checked={checked}
                          onChange={() =>
                            setLinkedProgramIds((prev) =>
                              checked
                                ? prev.filter((entry) => entry !== program.id)
                                : [...prev, program.id]
                            )
                          }
                        />
                        <span>
                          <span className="font-semibold text-gray-900">
                            {program.code} - {program.name}
                          </span>
                          <span className="block text-xs text-gray-500">{program.category}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-2xl border border-daisy-100 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                    Verknüpfte Cards in dieser Rolle
                  </p>
                  {linkedPrograms.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">Noch keine Cards verknüpft.</p>
                  ) : (
                    <ul className="mt-2 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
                      {linkedPrograms.map((program) => (
                        <li key={program.id} className="rounded-xl border border-daisy-100 bg-daisy-50/60 px-3 py-2">
                          <p className="font-semibold text-gray-900">
                            {program.code} - {program.name}
                          </p>
                          <p className="text-xs text-gray-500">{program.category}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </article>

          <article className="rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">SC State Config</p>
                <h3 className="text-lg font-semibold text-gray-900">States der Rolle verwalten</h3>
              </div>
              {editingStateId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingStateId(null);
                    setStateForm({
                      ...EMPTY_STATE_FORM,
                      order: (selectedRole?.states.at(-1)?.order ?? selectedRole?.states.length ?? 0) + 1
                    });
                  }}
                >
                  Abbrechen
                </Button>
              )}
            </header>
            {!selectedRole ? (
              <p className="mt-4 text-sm text-gray-500">Wähle zuerst eine Rolle aus.</p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <FieldBlock
                    label="State-Name"
                    help="Bezeichnung des States im SC-System. Dieser Name erscheint in Slidern, Diagrammen und Journal-Einträgen."
                    className="md:col-span-2"
                  >
                    <input
                      value={stateForm.name}
                      onChange={(event) => setStateForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="State Name"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Min"
                    help="Untergrenze der Skala. Dieser Wert ist der kleinste mögliche Slider-Score."
                  >
                    <input
                      type="number"
                      value={stateForm.minValue}
                      onChange={(event) =>
                        setStateForm((prev) => ({ ...prev, minValue: Number(event.target.value) }))
                      }
                      placeholder="Min"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Max"
                    help="Obergrenze der Skala. Dieser Wert ist der größte mögliche Slider-Score."
                  >
                    <input
                      type="number"
                      value={stateForm.maxValue}
                      onChange={(event) =>
                        setStateForm((prev) => ({ ...prev, maxValue: Number(event.target.value) }))
                      }
                      placeholder="Max"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Step"
                    help="Schrittweite des Sliders. Bestimmt, in welchen Intervallen Scores verändert werden können."
                  >
                    <input
                      type="number"
                      value={stateForm.step}
                      onChange={(event) =>
                        setStateForm((prev) => ({ ...prev, step: Number(event.target.value) }))
                      }
                      placeholder="Step"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <FieldBlock
                    label="Order"
                    help="Sortierreihenfolge innerhalb der Rolle. Kleinere Werte werden zuerst angezeigt."
                  >
                    <input
                      type="number"
                      value={stateForm.order}
                      onChange={(event) =>
                        setStateForm((prev) => ({ ...prev, order: Number(event.target.value) }))
                      }
                      placeholder="Order"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <Button
                    type="button"
                    onClick={saveStateConfig}
                    disabled={savingStateConfig}
                    className="self-end md:col-span-2"
                  >
                    {savingStateConfig
                      ? "Speichert..."
                      : editingStateId
                        ? "State aktualisieren"
                        : "State hinzufügen"}
                  </Button>
                </div>

                {selectedRole.states.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">Noch keine States konfiguriert.</p>
                ) : (
                  <ul className="mt-4 grid gap-2">
                    {selectedRole.states.map((state) => (
                      <li
                        key={state.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-daisy-100 bg-white px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{state.name}</p>
                          <p className="text-xs text-gray-500">
                            Skala: {state.minValue} bis {state.maxValue} · Step {state.step} · Order {state.order}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => startEditState(state)}>
                            <Pencil className="h-4 w-4" />
                            Bearbeiten
                          </Button>
                          <Button type="button" variant="ghost" onClick={() => deleteState(state.id)}>
                            <Trash2 className="h-4 w-4" />
                            Löschen
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </article>

          <article className="space-y-5 rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm">
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">State Tracking</p>
              <h3 className="text-lg font-semibold text-gray-900">SC State Controll pro Rolle</h3>
            </header>

            <div className="rounded-2xl border border-daisy-100 bg-white px-4 py-4">
              {!selectedRole ? (
                <p className="text-sm text-gray-500">Wähle zuerst eine Rolle aus.</p>
              ) : selectedRole.states.length === 0 ? (
                <p className="text-sm text-gray-500">Diese Rolle hat noch keine States.</p>
              ) : (
                <div className="space-y-4">
                  {selectedRole.states.map((state) => {
                    const value =
                      typeof stateValues[state.id] === "number"
                        ? stateValues[state.id]
                        : roleStateDefaultValue(state);
                    return (
                      <label key={state.id} className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                        {state.name}: <span className="text-daisy-700">{value}</span>
                        <input
                          type="range"
                          min={state.minValue}
                          max={state.maxValue}
                          step={Math.max(1, state.step)}
                          value={value}
                          onChange={(event) =>
                            setStateValues((prev) => ({
                              ...prev,
                              [state.id]: Number(event.target.value)
                            }))
                          }
                          className="accent-daisy-500"
                        />
                      </label>
                    );
                  })}
                  <FieldBlock
                    label="Tracking-Notiz"
                    help="Optionale Tagesnotiz zum aktuellen State-Stand. Wird zusammen mit den Scores gespeichert."
                  >
                    <textarea
                      value={trackingNote}
                      onChange={(event) => setTrackingNote(event.target.value)}
                      placeholder="Notiz zum aktuellen State-Tracking (optional)"
                      className="min-h-[96px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  </FieldBlock>
                  <Button type="button" onClick={saveRoleStateTracking} disabled={savingStateTracking}>
                    {savingStateTracking ? "Speichert..." : "State-Tracking speichern"}
                  </Button>
                </div>
              )}
            </div>

            <StateControlDistribution role={selectedRole} values={stateValues} />

            <div className="rounded-2xl border border-daisy-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                Letzte State-Einträge
              </p>
              {loadingStateEntries ? (
                <p className="mt-2 text-sm text-gray-500">Verlauf wird geladen...</p>
              ) : stateEntries.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Noch keine Einträge vorhanden.</p>
              ) : (
                <ul className="mt-3 grid gap-2">
                  {stateEntries.slice(0, 20).map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-daisy-100 bg-daisy-50/70 px-3 py-2 text-sm text-gray-700"
                    >
                      <p className="font-semibold text-gray-900">
                        {entry.stateName ?? "State"}: {entry.score}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.createdAt).toLocaleString("de-DE")}
                        {entry.programCode ? ` · Card ${entry.programCode}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <article className="rounded-3xl border border-daisy-100 bg-gradient-to-r from-[#142a66]/90 via-[#2b44a3]/85 to-[#5f74d7]/80 p-5 text-white shadow-arcade">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ffd879]">Game Style</p>
            <h3 className="mt-2 text-xl font-semibold">Rollen als spielbare Einheiten</h3>
            <p className="mt-2 text-sm text-white/90">
              Jede Rolle kann mit mehreren Cards verbunden werden, besitzt eigene SC-States und speichert alle Trackings automatisch im Journal.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9fe7ff]">
              <Sparkles className="h-4 w-4" />
              Neutral · Abstrakt · Gamifiziert
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
