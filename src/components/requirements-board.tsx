"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import {
  RequirementCreateModal,
  RequirementDetailModal,
  type RequirementFormState
} from "./requirements-modals";
import type {
  RequirementArea,
  RequirementRecord,
  RequirementStatus
} from "@/lib/types";

const statusOrder: RequirementStatus[] = [
  "open",
  "in_progress",
  "problem",
  "done"
];

const statusLabels: Record<RequirementStatus, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  problem: "Problem",
  done: "Fertig"
};

const areaLabels: Record<RequirementArea, string> = {
  privat: "Privat",
  finanzen: "Finanzen",
  arbeit: "Arbeit",
  staat: "Staat"
};

const defaultForm: RequirementFormState = {
  title: "",
  requester: "",
  targetDate: "",
  cost: "",
  priority: "2",
  area: "privat",
  xp: "0",
  description: ""
};

interface RequirementsBoardProps {
  initialRequirements: RequirementRecord[];
}

export function RequirementsBoard({
  initialRequirements
}: RequirementsBoardProps) {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState(initialRequirements);
  const [showCreate, setShowCreate] = useState(false);
  const [activeRequirement, setActiveRequirement] = useState<
    RequirementRecord | null
  >(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RequirementFormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupedRequirements = useMemo(
    () =>
      statusOrder.map((status) => {
        const items = requirements
          .filter((item) => item.status === status)
          .sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        return { status, items };
      }),
    [requirements]
  );

  const updateForm = <K extends keyof RequirementFormState>(
    field: K,
    value: RequirementFormState[K]
  ) => setFormState((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const load = async () => {
      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
      const response = await fetch(`/api/requirements${emailParam}`);
      if (!response.ok) return;
      const data: RequirementRecord[] = await response.json();
      setRequirements(data);
    };
    load();
  }, [user?.email]);

  const resetForm = () => {
    setFormState({ ...defaultForm });
    setError(null);
  };

  const createRequirement = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: formState.title,
        requester: formState.requester,
        targetDate: formState.targetDate || undefined,
        cost: formState.cost ? Number(formState.cost) : 0,
        priority: Number(formState.priority),
        area: formState.area,
        description: formState.description,
        xp: formState.xp ? Number(formState.xp) : 0,
        email: user?.email
      };

      const response = await fetch("/api/requirements", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                ...payload
              }
            : payload
        )
      });

      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || "Speichern fehlgeschlagen");
      }

      const requirement: RequirementRecord = await response.json();
      if (editingId) {
        updateRequirement(requirement);
      } else {
        setRequirements((prev) => [requirement, ...prev]);
      }
      setShowCreate(false);
      setEditingId(null);
      resetForm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fehler beim Speichern.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequirement = (updated: RequirementRecord) => {
    setRequirements((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setActiveRequirement(updated);
  };

  const changeStatus = async (status: RequirementStatus) => {
    if (!activeRequirement) return;
    setSavingStatus(true);
    try {
      const response = await fetch("/api/requirements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeRequirement.id,
          status,
          email: user?.email
        })
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message.error || "Update fehlgeschlagen");
      }
      const requirement: RequirementRecord = await response.json();
      updateRequirement(requirement);
    } catch (err) {
      console.error(err);
      setError("Status konnte nicht aktualisiert werden.");
    } finally {
      setSavingStatus(false);
    }
  };

  const closeModals = () => {
    setShowCreate(false);
    setActiveRequirement(null);
    setEditingId(null);
    resetForm();
  };

  const startEdit = (requirement: RequirementRecord) => {
    setFormState({
      title: requirement.title,
      requester: requirement.requester,
      targetDate: requirement.targetDate ? requirement.targetDate.split("T")[0] : "",
      cost: `${requirement.cost}`,
      priority: `${requirement.priority}`,
      area: requirement.area,
      xp: `${requirement.xp}`,
      description: requirement.description ?? ""
    });
    setEditingId(requirement.id);
    setShowCreate(true);
    setActiveRequirement(null);
    setError(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-daisy-500">
            Anforderungen
          </p>
          <h2 className="text-xl font-semibold text-gray-900">
            Sammelstelle für Wünsche & Tasks
          </h2>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-daisy-500">
          <Plus className="h-4 w-4" /> Neu
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {groupedRequirements.map((group) => (
          <section
            key={group.status}
            className="rounded-3xl bg-daisy-50/60 p-4 shadow-inner"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-daisy-600">
                  {statusLabels[group.status]}
                </p>
                <p className="text-[11px] uppercase tracking-[0.3em] text-daisy-400">
                  {group.items.length} Karten
                </p>
              </div>
              {group.status === "problem" && (
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
              )}
            </div>
            <div className="space-y-3">
              {group.items.map((item) => {
                const priorityTone =
                  item.priority === 1
                    ? "border-red-400/90 bg-red-50 text-red-800 shadow-[0_12px_30px_rgba(248,113,113,0.25)]"
                    : "border-daisy-100 bg-white/90 text-gray-900 shadow-card";

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveRequirement(item)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${priorityTone}`}
                  >
                    <span className="text-sm font-semibold leading-tight">
                      {item.title}
                    </span>
                    {item.priority === 1 && (
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
                        Prio 1
                      </span>
                    )}
                  </button>
                );
              })}
              {!group.items.length && (
                <p className="text-sm text-daisy-500">Noch leer.</p>
              )}
            </div>
          </section>
        ))}
      </div>

      <RequirementCreateModal
        open={showCreate}
        formState={formState}
        areaLabels={areaLabels}
        submitting={submitting}
        error={error}
        onChange={updateForm}
        onSubmit={createRequirement}
        onClose={closeModals}
        mode={editingId ? "edit" : "create"}
      />

      <RequirementDetailModal
        open={Boolean(activeRequirement)}
        requirement={activeRequirement}
        areaLabels={areaLabels}
        statusLabels={statusLabels}
        statusOrder={statusOrder}
        savingStatus={savingStatus}
        error={showCreate ? null : error}
        onClose={closeModals}
        onChangeStatus={changeStatus}
        onEdit={() => activeRequirement && startEdit(activeRequirement)}
      />
    </div>
  );
}
