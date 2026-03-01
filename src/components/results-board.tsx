"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  ClipboardList,
  Coins,
  Edit3,
  FileText,
  Info,
  MessageSquare,
  Plus,
  Save,
  Target,
  Users,
  X
} from "lucide-react";

import { useAuth } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";
import type {
  ResultChecklistItem,
  ResultLogEntry,
  ResultObject,
  ResultStatus
} from "@/lib/types";

interface ResultDraft {
  name: string;
  icon: string;
  status: ResultStatus;
  startDate: string;
  deadline: string;
  cost: string;
  stakeholder: string;
  outputFileType: string;
  checklist: ResultChecklistItem[];
  artifacts: string[];
}

interface CreateResultForm {
  name: string;
  icon: string;
  stakeholder: string;
}

const DEFAULT_CREATE_FORM: CreateResultForm = {
  name: "",
  icon: "🎯",
  stakeholder: ""
};

const RESULT_STATUS_OPTIONS: Array<{ value: ResultStatus; label: string }> = [
  { value: "open", label: "Offen" },
  { value: "in_progress", label: "In Bearbeitung" },
  { value: "delayed", label: "Verzug" },
  { value: "problem", label: "Problem" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "stopped", label: "Gestoppt" },
  { value: "archived", label: "Archiv" }
];

const RESULT_STATUS_META: Record<
  ResultStatus,
  { label: string; chipClass: string }
> = {
  open: {
    label: "Offen",
    chipClass: "border-slate-200 bg-slate-100 text-slate-700"
  },
  in_progress: {
    label: "In Bearbeitung",
    chipClass: "border-sky-200 bg-sky-100 text-sky-700"
  },
  delayed: {
    label: "Verzug",
    chipClass: "border-amber-200 bg-amber-100 text-amber-800"
  },
  problem: {
    label: "Problem",
    chipClass: "border-rose-200 bg-rose-100 text-rose-700"
  },
  completed: {
    label: "Abgeschlossen",
    chipClass: "border-emerald-200 bg-emerald-100 text-emerald-700"
  },
  stopped: {
    label: "Gestoppt",
    chipClass: "border-orange-200 bg-orange-100 text-orange-700"
  },
  archived: {
    label: "Archiv",
    chipClass: "border-zinc-200 bg-zinc-100 text-zinc-700"
  }
};

function parseResultStatus(value: unknown): ResultStatus {
  return RESULT_STATUS_OPTIONS.some((option) => option.value === value)
    ? (value as ResultStatus)
    : "open";
}

function toInputDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildDraft(result: ResultObject): ResultDraft {
  return {
    name: result.name,
    icon: result.icon || "🎯",
    status: parseResultStatus(result.status),
    startDate: toInputDate(result.startDate),
    deadline: toInputDate(result.deadline),
    cost: String(Number(result.cost ?? 0)),
    stakeholder: result.stakeholder ?? "",
    outputFileType: result.outputFileType ?? "",
    checklist: result.checklist.map((item) => ({ ...item })),
    artifacts: [...result.artifacts]
  };
}

function formatDateLabel(value?: string | null) {
  if (!value) return "Nicht gesetzt";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nicht gesetzt";
  return date.toLocaleDateString("de-DE");
}

function formatCost(value: number) {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} €`;
}

function sortLogs(logs: ResultLogEntry[]) {
  return [...logs].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
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
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/35 bg-white/15 text-[#9fe7ff] transition hover:bg-white/25"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span className="absolute right-0 top-6 z-20 w-72 rounded-xl border border-white/40 bg-[#10204f] p-3 text-left text-xs font-medium normal-case leading-relaxed text-white shadow-xl">
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b4e9ff]">
          {label}
        </p>
        <FieldHelp text={help} />
      </div>
      {children}
    </div>
  );
}

export function ResultsBoard() {
  const { user } = useAuth();
  const [results, setResults] = useState<ResultObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreateResultForm>(
    DEFAULT_CREATE_FORM
  );
  const [creating, setCreating] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<ResultDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);

  const [logDraft, setLogDraft] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  const activeResult = useMemo(
    () => results.find((result) => result.id === activeResultId) ?? null,
    [results, activeResultId]
  );
  const displayedStatus = parseResultStatus(
    editMode ? draft?.status : activeResult?.status
  );
  const displayedStatusMeta = RESULT_STATUS_META[displayedStatus];
  const orderedLogs = useMemo(
    () => sortLogs(activeResult?.logs ?? []),
    [activeResult?.logs]
  );

  const refreshResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (user?.email) params.set("userEmail", user.email);
      if (user?.name) params.set("userName", user.name);
      const response = await fetch(`/api/results?${params.toString()}`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Results konnten nicht geladen werden.");
      }
      const payload = (await response.json()) as ResultObject[];
      setResults(Array.isArray(payload) ? payload : []);
      setActiveResultId((current) => {
        if (!payload.length) return null;
        if (current && payload.some((result) => result.id === current)) return current;
        return payload[0].id;
      });
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Results konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, [user?.email, user?.name]);

  useEffect(() => {
    void refreshResults();
  }, [refreshResults]);

  useEffect(() => {
    if (!activeResult) {
      setDraft(null);
      return;
    }
    if (!detailOpen) return;
    if (!editMode) {
      setDraft(buildDraft(activeResult));
    }
  }, [activeResult, detailOpen, editMode]);

  useEffect(() => {
    if (!detailOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailOpen]);

  const openResultDetail = (result: ResultObject) => {
    setActiveResultId(result.id);
    setEditMode(false);
    setDraft(buildDraft(result));
    setLogDraft("");
    setDetailOpen(true);
  };

  const createResult = async () => {
    const name = createForm.name.trim();
    if (!name) {
      setError("Bitte einen Result-Namen eintragen.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          icon: createForm.icon.trim() || "🎯",
          status: "open",
          stakeholder: createForm.stakeholder.trim(),
          checklist: [
            { id: `c-${Date.now()}-1`, label: "Kick-off definieren", done: false },
            { id: `c-${Date.now()}-2`, label: "Artefakte sammeln", done: false }
          ],
          artifacts: [],
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Result konnte nicht erstellt werden.");
      }

      const created = (await response.json()) as ResultObject;
      setResults((prev) => [created, ...prev]);
      setCreateForm(DEFAULT_CREATE_FORM);
      openResultDetail(created);
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Result konnte nicht erstellt werden."
      );
    } finally {
      setCreating(false);
    }
  };

  const saveEditMode = async ({
    closeEditMode = true
  }: {
    closeEditMode?: boolean;
  } = {}) => {
    if (!activeResult || !draft) return;

    const name = draft.name.trim();
    if (!name) {
      setError("Der Result-Name ist erforderlich.");
      return;
    }

    setSavingEdit(true);
    setError(null);
    try {
      const response = await fetch("/api/results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeResult.id,
          name,
          icon: draft.icon.trim() || "🎯",
          status: draft.status,
          startDate: draft.startDate || null,
          deadline: draft.deadline || null,
          cost: Number(draft.cost) || 0,
          stakeholder: draft.stakeholder.trim(),
          outputFileType: draft.outputFileType.trim(),
          checklist: draft.checklist,
          artifacts: draft.artifacts.filter((entry) => entry.trim()).map((entry) => entry.trim()),
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Result konnte nicht gespeichert werden.");
      }

      const updated = (await response.json()) as ResultObject;
      setResults((prev) =>
        prev.map((result) => (result.id === updated.id ? updated : result))
      );
      setEditMode(!closeEditMode);
      setDraft(buildDraft(updated));
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Result konnte nicht gespeichert werden."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleEditModeToggle = async () => {
    if (!activeResult) return;
    if (!editMode) {
      setDraft(buildDraft(activeResult));
      setEditMode(true);
      return;
    }
    await saveEditMode({ closeEditMode: true });
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!activeResult || editMode) return;
    setSavingChecklist(true);
    setError(null);
    try {
      const nextChecklist = activeResult.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      );
      const response = await fetch("/api/results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeResult.id,
          checklist: nextChecklist,
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Checkliste konnte nicht aktualisiert werden.");
      }
      const updated = (await response.json()) as ResultObject;
      setResults((prev) =>
        prev.map((result) => (result.id === updated.id ? updated : result))
      );
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Checkliste konnte nicht aktualisiert werden."
      );
    } finally {
      setSavingChecklist(false);
    }
  };

  const submitManualLog = async () => {
    if (!activeResult || !logDraft.trim()) return;
    setSavingLog(true);
    setError(null);
    try {
      const response = await fetch(`/api/results/${activeResult.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: logDraft.trim(),
          userEmail: user?.email,
          userName: user?.name
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Log konnte nicht gespeichert werden.");
      }
      const createdLog = (await response.json()) as ResultLogEntry;
      setResults((prev) =>
        prev.map((result) =>
          result.id === activeResult.id
            ? {
                ...result,
                logs: sortLogs([...result.logs, createdLog])
              }
            : result
        )
      );
      setLogDraft("");
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Log konnte nicht gespeichert werden."
      );
    } finally {
      setSavingLog(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-daisy-100 bg-white/85 p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[#ff5fa8]">
          Results
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[#101838]">
          Result-Übersicht
        </h2>
        <p className="mt-1 text-sm text-[#4d5a8a]">
          Verwalte Result-Objekte, öffne Details im Side-Popup und halte Änderungen automatisch im Log fest.
        </p>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-[30px] border border-daisy-100 bg-white/85 p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[120px,1fr,1fr,auto]">
          <input
            value={createForm.icon}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, icon: event.target.value }))
            }
            className="rounded-2xl border border-daisy-200 bg-white px-4 py-3 text-center text-2xl"
            placeholder="🎯"
          />
          <input
            value={createForm.name}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, name: event.target.value }))
            }
            className="rounded-2xl border border-daisy-200 bg-white px-4 py-3 text-sm"
            placeholder="Neues Result benennen"
          />
          <input
            value={createForm.stakeholder}
            onChange={(event) =>
              setCreateForm((prev) => ({ ...prev, stakeholder: event.target.value }))
            }
            className="rounded-2xl border border-daisy-200 bg-white px-4 py-3 text-sm"
            placeholder="Stakeholder"
          />
          <Button type="button" onClick={createResult} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? "Erstellt..." : "Result erstellen"}
          </Button>
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-[#4d5a8a]">Results werden geladen...</p>
      ) : results.length === 0 ? (
        <div className="rounded-[28px] border border-daisy-100 bg-white/80 p-6 text-sm text-[#4d5a8a]">
          Noch keine Result-Objekte vorhanden.
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result, index) => {
            const status = parseResultStatus(result.status);
            const statusMeta = RESULT_STATUS_META[status];
            return (
              <button
                key={result.id}
                type="button"
                onClick={() => openResultDetail(result)}
                className="group relative overflow-hidden rounded-[26px] border border-white/70 bg-white p-5 text-left shadow-[0_16px_30px_rgba(7,24,56,0.16)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(7,24,56,0.22)]"
              >
                <div
                  className={`absolute inset-0 opacity-70 ${
                    index % 3 === 0
                      ? "bg-gradient-to-br from-[#d6f6ff]/60 via-transparent to-[#ffe5cd]/80"
                      : index % 3 === 1
                        ? "bg-gradient-to-br from-[#ede6ff]/60 via-transparent to-[#dcf6ff]/80"
                        : "bg-gradient-to-br from-[#ffe8f4]/60 via-transparent to-[#dafbe6]/80"
                  }`}
                />
                <div className="relative space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{result.icon || "🎯"}</span>
                    <span className="rounded-full border border-[#11204e]/20 bg-white/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#31407a]">
                      Result
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#111a3e]">{result.name}</h3>
                    <p className="mt-1 text-xs text-[#4d5a8a]">
                      Stakeholder: {result.stakeholder || "Nicht gesetzt"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#465583]">
                    <span>Deadline: {formatDateLabel(result.deadline)}</span>
                    <span>{result.logs.length} Logs</span>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${statusMeta.chipClass}`}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {detailOpen && activeResult && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Result schließen"
            onClick={() => {
              setDetailOpen(false);
              setEditMode(false);
            }}
            className="absolute inset-0 bg-[#050a1f]/60 backdrop-blur"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[680px] flex-col overflow-hidden rounded-l-[36px] border-l-4 border-white/60 bg-gradient-to-b from-[#131f47]/95 via-[#2a3f95]/92 to-[#6e5ce0]/88 text-white shadow-arcade">
            <header className="flex items-center justify-between border-b border-white/15 px-6 py-5">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.45em] text-[#ffd879]">
                  Result Detail
                </p>
                <h2 className="mt-1 truncate text-2xl font-semibold uppercase tracking-[0.18em]">
                  {(editMode ? draft?.name : activeResult.name) || activeResult.name}
                </h2>
                <div className="mt-2">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                      displayedStatusMeta.chipClass
                    }`}
                  >
                    {displayedStatusMeta.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleEditModeToggle()}
                >
                  <Edit3 className="h-4 w-4" />
                  {editMode ? "View" : "Bearbeiten"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDetailOpen(false);
                    setEditMode(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  Schließen
                </Button>
              </div>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <section className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#9fe7ff]">
                  <Target className="h-4 w-4" />
                  Basisinformationen
                </div>
                {editMode && draft ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldBlock
                      label="Icon"
                      help="Symbol für das Result in der Übersicht. Wird direkt auf der Result-Card angezeigt."
                    >
                      <input
                        value={draft.icon}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, icon: event.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-2xl"
                      />
                    </FieldBlock>
                    <FieldBlock
                      label="Name"
                      help="Titel des Results. Dieser Name erscheint in der Übersicht und im Detail-Popup."
                    >
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                        placeholder="Name"
                      />
                    </FieldBlock>
                    <FieldBlock
                      label="Status"
                      help="Aktueller Zustand des Results. Der Status wird als farbiger Chip in der Detail- und Kartenansicht angezeigt."
                    >
                      <select
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status: parseResultStatus(event.target.value)
                                }
                              : prev
                          )
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                      >
                        {RESULT_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value} className="text-[#111a3e]">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FieldBlock>
                    <FieldBlock
                      label="Startdatum"
                      help="Beginn des Results. Dient der zeitlichen Einordnung im Verlauf."
                    >
                      <input
                        type="date"
                        value={draft.startDate}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, startDate: event.target.value } : prev
                          )
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                      />
                    </FieldBlock>
                    <FieldBlock
                      label="Deadline"
                      help="Geplantes Enddatum des Results. Änderungen werden automatisch im Log protokolliert."
                    >
                      <input
                        type="date"
                        value={draft.deadline}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, deadline: event.target.value } : prev
                          )
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                      />
                    </FieldBlock>
                    <FieldBlock
                      label="Kosten"
                      help="Geplante oder tatsächliche Kosten des Results. Wird als Betrag im Footer angezeigt."
                    >
                      <input
                        type="number"
                        value={draft.cost}
                        onChange={(event) =>
                          setDraft((prev) => (prev ? { ...prev, cost: event.target.value } : prev))
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                        placeholder="Kosten"
                      />
                    </FieldBlock>
                    <FieldBlock
                      label="Stakeholder"
                      help="Beteiligte oder verantwortliche Person/Gruppe für das Result."
                    >
                      <input
                        value={draft.stakeholder}
                        onChange={(event) =>
                          setDraft((prev) =>
                            prev ? { ...prev, stakeholder: event.target.value } : prev
                          )
                        }
                        className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                        placeholder="Stakeholder"
                      />
                    </FieldBlock>
                  </div>
                ) : (
                  <div className="grid gap-3 text-sm text-white/90 md:grid-cols-2">
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      Name: {activeResult.name}
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      Startdatum: {formatDateLabel(activeResult.startDate)}
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      Deadline: {formatDateLabel(activeResult.deadline)}
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      Kosten: {formatCost(activeResult.cost)}
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2">
                      Status: {RESULT_STATUS_META[parseResultStatus(activeResult.status)].label}
                    </div>
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 md:col-span-2">
                      Stakeholder: {activeResult.stakeholder || "Nicht gesetzt"}
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#9fe7ff]">
                  <CheckSquare className="h-4 w-4" />
                  Checkliste
                </div>
                {editMode && draft ? (
                  <div className="space-y-2">
                    {draft.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={(event) =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    checklist: prev.checklist.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, done: event.target.checked }
                                        : entry
                                    )
                                  }
                                : prev
                            )
                          }
                          className="h-4 w-4 accent-[#7de0ff]"
                        />
                        <input
                          value={item.label}
                          onChange={(event) =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    checklist: prev.checklist.map((entry) =>
                                      entry.id === item.id
                                        ? { ...entry, label: event.target.value }
                                        : entry
                                    )
                                  }
                                : prev
                            )
                          }
                          className="flex-1 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    checklist: prev.checklist.filter(
                                      (entry) => entry.id !== item.id
                                    )
                                  }
                                : prev
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                checklist: [
                                  ...prev.checklist,
                                  {
                                    id: `c-${Date.now()}`,
                                    label: "",
                                    done: false
                                  }
                                ]
                              }
                            : prev
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Punkt hinzufügen
                    </Button>
                  </div>
                ) : activeResult.checklist.length === 0 ? (
                  <p className="text-sm text-white/75">Keine Checklistenpunkte vorhanden.</p>
                ) : (
                  <ul className="space-y-2">
                    {activeResult.checklist.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => void toggleChecklistItem(item.id)}
                          disabled={savingChecklist}
                          className="h-4 w-4 accent-[#7de0ff]"
                        />
                        <span className={item.done ? "line-through text-white/65" : ""}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#9fe7ff]">
                  <ClipboardList className="h-4 w-4" />
                  Artefakte & Output
                </div>
                {editMode && draft ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b4e9ff]">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {RESULT_STATUS_OPTIONS.map((option) => {
                          const active = draft.status === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setDraft((prev) =>
                                  prev ? { ...prev, status: option.value } : prev
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                                active
                                  ? "border-[#9fe7ff] bg-[#9fe7ff]/20 text-white"
                                  : "border-white/30 bg-white/10 text-white/80 hover:bg-white/20"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <input
                      value={draft.outputFileType}
                      onChange={(event) =>
                        setDraft((prev) =>
                          prev ? { ...prev, outputFileType: event.target.value } : prev
                        )
                      }
                      className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                      placeholder="Output File Type"
                    />
                    {draft.artifacts.map((artifact, index) => (
                      <div key={`artifact-${index}`} className="flex items-center gap-2">
                        <input
                          value={artifact}
                          onChange={(event) =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    artifacts: prev.artifacts.map((entry, entryIndex) =>
                                      entryIndex === index ? event.target.value : entry
                                    )
                                  }
                                : prev
                            )
                          }
                          className="flex-1 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
                          placeholder="Artefakt"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setDraft((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    artifacts: prev.artifacts.filter(
                                      (_, entryIndex) => entryIndex !== index
                                    )
                                  }
                                : prev
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setDraft((prev) =>
                          prev
                            ? { ...prev, artifacts: [...prev.artifacts, ""] }
                            : prev
                        )
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Artefakt hinzufügen
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void saveEditMode({ closeEditMode: false })}
                      disabled={savingEdit}
                    >
                      <Save className="h-4 w-4" />
                      {savingEdit ? "Speichert..." : "Artefakte & Output speichern"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-sm">
                      Output File Type: {activeResult.outputFileType || "Nicht gesetzt"}
                    </div>
                    {activeResult.artifacts.length === 0 ? (
                      <p className="text-sm text-white/75">Keine Artefakte hinterlegt.</p>
                    ) : (
                      <ul className="space-y-2">
                        {activeResult.artifacts.map((artifact, index) => (
                          <li
                            key={`${artifact}-${index}`}
                            className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm"
                          >
                            {artifact}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </section>

              <section className="rounded-2xl border border-white/20 bg-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[#9fe7ff]">
                  <MessageSquare className="h-4 w-4" />
                  Log-Chat
                </div>

                <div className="max-h-[260px] space-y-2 overflow-y-auto rounded-xl border border-white/20 bg-[#0f1d4d]/65 p-3">
                  {orderedLogs.length === 0 ? (
                    <p className="text-sm text-white/75">Noch keine Log-Einträge vorhanden.</p>
                  ) : (
                    orderedLogs.map((logEntry) => (
                      <div
                        key={logEntry.id}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm"
                      >
                        <p className="leading-relaxed text-white">{logEntry.message}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
                          {new Date(logEntry.createdAt).toLocaleString("de-DE")}
                          {logEntry.logType === "change" ? " · Änderung" : " · Manuell"}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <textarea
                    value={logDraft}
                    onChange={(event) => setLogDraft(event.target.value)}
                    className="w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70"
                    placeholder="Manuellen Log-Eintrag hinzufügen..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={submitManualLog}
                    disabled={savingLog || !logDraft.trim()}
                  >
                    <FileText className="h-4 w-4" />
                    {savingLog ? "Speichert..." : "Log-Eintrag speichern"}
                  </Button>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/15 px-6 py-4">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-white/75">
                <span className="inline-flex items-center gap-1">
                  <Coins className="h-4 w-4" />
                  {formatCost(editMode && draft ? Number(draft.cost || 0) : activeResult.cost)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {(editMode && draft ? draft.stakeholder : activeResult.stakeholder) || "n/a"}
                </span>
              </div>
              {editMode && (
                <Button type="button" onClick={() => void saveEditMode()} disabled={savingEdit}>
                  <Save className="h-4 w-4" />
                  {savingEdit ? "Speichert..." : "Änderungen speichern"}
                </Button>
              )}
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
