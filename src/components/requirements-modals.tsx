import type { FormEvent, ReactNode } from "react";

import { CalendarClock, Euro, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RequirementArea,
  RequirementRecord,
  RequirementStatus
} from "@/lib/types";

export interface RequirementFormState {
  title: string;
  requester: string;
  targetDate: string;
  cost: string;
  priority: string;
  area: RequirementArea;
  xp: string;
  description: string;
}

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

function ModalShell({ open, onClose, children }: ModalShellProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800"
          aria-label="Schließen"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

interface RequirementCreateModalProps {
  open: boolean;
  formState: RequirementFormState;
  areaLabels: Record<RequirementArea, string>;
  submitting: boolean;
  error: string | null;
  onChange: <K extends keyof RequirementFormState>(
    field: K,
    value: RequirementFormState[K]
  ) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
  mode?: "create" | "edit";
}

export function RequirementCreateModal({
  open,
  formState,
  areaLabels,
  submitting,
  error,
  onChange,
  onSubmit,
  onClose,
  mode = "create"
}: RequirementCreateModalProps) {
  const submitLabel = mode === "edit" ? "Änderungen sichern" : "Anforderung anlegen";
  const title = mode === "edit" ? "Anforderung bearbeiten" : "Details erfassen";
  const badge = mode === "edit" ? "Anforderung" : "Neue Anforderung";

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="space-y-4">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-daisy-500">
            {badge}
          </p>
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">
            Name, Zieldatum, Anfrager, Kosten, Prio und Bereich angeben.
          </p>
        </header>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Titel der Anforderung"
            required
            element={
              <input
                required
                value={formState.title}
                onChange={(event) => onChange("title", event.target.value)}
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                placeholder="z.B. Steuerbescheid digitalisieren"
              />
            }
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field
              label="Anforderungs-Zieldatum"
              element={
                <input
                  type="date"
                  value={formState.targetDate}
                  onChange={(event) => onChange("targetDate", event.target.value)}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                />
              }
            />
            <Field
              label="Anfrager"
              required
              element={
                <input
                  value={formState.requester}
                  onChange={(event) => onChange("requester", event.target.value)}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                  placeholder="Name oder Team"
                />
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field
              label="Kosten"
              element={
                <div className="flex items-center gap-2 rounded-2xl border border-daisy-200 px-4 py-3 focus-within:border-daisy-500">
                  <Euro className="h-4 w-4 text-daisy-500" />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formState.cost}
                    onChange={(event) => onChange("cost", event.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                    placeholder="0"
                  />
                </div>
              }
            />
            <Field
              label="Prio (1 = hoch)"
              element={
                <select
                  value={formState.priority}
                  onChange={(event) => onChange("priority", event.target.value)}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                >
                  {[1, 2, 3, 4].map((prio) => (
                    <option key={prio} value={prio}>
                      {prio}
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label="Bereich"
              required
              element={
                <select
                  value={formState.area}
                  onChange={(event) => onChange("area", event.target.value as RequirementArea)}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                >
                  {Object.entries(areaLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              }
            />
            <Field
              label="XP (bei Fertig gutschreiben)"
              element={
                <input
                  type="number"
                  inputMode="numeric"
                  value={formState.xp}
                  onChange={(event) => onChange("xp", event.target.value)}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                  placeholder="0"
                />
              }
            />
          </div>

          <Field
            label="Beschreibung (optional)"
            element={
              <textarea
                value={formState.description}
                onChange={(event) => onChange("description", event.target.value)}
                className="min-h-[100px] w-full rounded-2xl border border-daisy-200 px-4 py-3 focus:border-daisy-500 focus:outline-none"
                placeholder="Kontext, gewünschte Ergebnisse, Links…"
              />
            }
          />

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Speichert…
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

interface RequirementDetailModalProps {
  open: boolean;
  requirement: RequirementRecord | null;
  areaLabels: Record<RequirementArea, string>;
  statusLabels: Record<RequirementStatus, string>;
  statusOrder: RequirementStatus[];
  savingStatus: boolean;
  error: string | null;
  onClose: () => void;
  onChangeStatus: (status: RequirementStatus) => void;
  onEdit: () => void;
}

export function RequirementDetailModal({
  open,
  requirement,
  areaLabels,
  statusLabels,
  statusOrder,
  savingStatus,
  error,
  onClose,
  onChangeStatus,
  onEdit
}: RequirementDetailModalProps) {
  if (!requirement) return null;

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="space-y-4">
        <header className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-daisy-500">
                Anforderung
              </p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {requirement.title}
              </h3>
            </div>
            <Button onClick={onEdit} variant="outline">
              Bearbeiten
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-daisy-100 px-3 py-1 text-daisy-700">
              {areaLabels[requirement.area]}
            </span>
            <span className="rounded-full bg-daisy-200 px-3 py-1 text-daisy-800">
              Prio {requirement.priority}
            </span>
            <span className="rounded-full bg-daisy-100 px-3 py-1 text-daisy-700">
              Status: {statusLabels[requirement.status]}
            </span>
          </div>
        </header>

        <div className="space-y-2 rounded-2xl bg-daisy-50 p-4 text-sm text-gray-800">
          {requirement.description ? (
            <p className="leading-relaxed">{requirement.description}</p>
          ) : (
            <p className="text-gray-500">Kein Beschreibungstext hinterlegt.</p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow label="Anfrager" value={requirement.requester} />
            <InfoRow
              label="Zieldatum"
              value={requirement.targetDate ? formatDate(requirement.targetDate) : "Kein Datum"}
              icon={<CalendarClock className="h-4 w-4 text-daisy-500" />}
            />
            <InfoRow
              label="Kosten"
              value={`${requirement.cost.toLocaleString("de-DE")} €`}
              icon={<Euro className="h-4 w-4 text-daisy-500" />}
            />
            <InfoRow
              label="XP bei Fertig"
              value={`${requirement.xp.toLocaleString("de-DE")} XP`}
            />
            <InfoRow
              label="Zuletzt aktualisiert"
              value={formatDate(requirement.updatedAt)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
            Status ändern
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOrder.map((status) => (
              <Button
                key={status}
                variant={requirement.status === status ? "default" : "outline"}
                onClick={() => onChangeStatus(status)}
                disabled={savingStatus && requirement.status === status}
              >
                {savingStatus && requirement.status === status ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {statusLabels[status]}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
      </div>
    </ModalShell>
  );
}

function InfoRow({
  label,
  value,
  icon
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2">
      {icon && <span>{icon}</span>}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-daisy-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  element,
  required
}: {
  label: string;
  element: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-800">
        {label}
        {required ? " *" : ""}
      </label>
      {element}
    </div>
  );
}

function formatDate(input: string) {
  const date = new Date(input);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
