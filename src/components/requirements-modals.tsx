import type { FormEvent, ReactNode } from "react";

import { CalendarClock, Euro, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RequirementArea,
  RequirementRecord,
  RequirementStatus,
  RequirementLogEntry
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
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#050a1f]/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-2xl rounded-[36px] border-4 border-white/70 bg-gradient-to-b from-[#131f47]/95 via-[#2c3f9a]/90 to-[#6d5ce0]/90 p-8 text-white shadow-arcade">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border-2 border-white/70 bg-white/20 p-2 text-white hover:bg-white/30"
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
      <div className="space-y-4 text-white">
        <header className="space-y-1">
          <p className="font-arcade text-[11px] uppercase tracking-[0.5em] text-[#ffd879]">
            {badge}
          </p>
          <h3 className="text-3xl font-semibold uppercase tracking-[0.2em]">
            {title}
          </h3>
          <p className="text-sm text-white/80">
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
                className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
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
                  className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
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
                  className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
                  placeholder="Name oder Team"
                />
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Kosten"
              className="xl:col-span-1"
              element={
                <div className="flex h-14 items-center gap-2 rounded-2xl border-4 border-white/60 bg-white/90 px-4 py-3 text-[#0b1230] focus-within:border-[#ffd879]">
                  <Euro className="h-4 w-4 text-[#ff5fa8]" />
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
              className="xl:col-span-1"
              element={
                <select
                  value={formState.priority}
                  onChange={(event) => onChange("priority", event.target.value)}
                  className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
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
              className="xl:col-span-1"
              element={
                <select
                  value={formState.area}
                  onChange={(event) => onChange("area", event.target.value as RequirementArea)}
                  className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
                >
                  {Object.entries(areaLabels).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              }
            />
          </div>
          <Field
            label="XP (bei Fertig gutschreiben)"
            element={
              <input
                type="number"
                inputMode="numeric"
                value={formState.xp}
                onChange={(event) => onChange("xp", event.target.value)}
                className="retro-input h-14 w-full bg-white/90 text-[#0b1230]"
                placeholder="0"
              />
            }
          />

          <Field
            label="Beschreibung (optional)"
            element={
              <textarea
                value={formState.description}
                onChange={(event) => onChange("description", event.target.value)}
                className="retro-input min-h-[120px] w-full bg-white/90 text-[#0b1230]"
                placeholder="Kontext, gewünschte Ergebnisse, Links…"
              />
            }
          />

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button variant="lagoon" type="submit" disabled={submitting}>
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
  logs: RequirementLogEntry[];
  logsLoading: boolean;
  logDraft: string;
  logSubmitting: boolean;
  logError: string | null;
  onLogDraftChange: (value: string) => void;
  onSubmitLog: () => void;
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
  onEdit,
  logs,
  logsLoading,
  logDraft,
  logSubmitting,
  logError,
  onLogDraftChange,
  onSubmitLog
}: RequirementDetailModalProps) {
  if (!requirement) return null;

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="space-y-4 text-white">
        <header className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-arcade text-[11px] uppercase tracking-[0.45em] text-[#ffd879]">
                Anforderung
              </p>
              <h3 className="text-3xl font-semibold uppercase leading-snug tracking-[0.2em]">
                {requirement.title}
              </h3>
            </div>
            <Button onClick={onEdit} variant="ghost">
              Bearbeiten
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full border-2 border-white/70 bg-white/30 px-3 py-1 text-white">
              {areaLabels[requirement.area]}
            </span>
            <span className="rounded-full border-2 border-white/70 bg-white/30 px-3 py-1 text-white">
              Prio {requirement.priority}
            </span>
            <span className="rounded-full border-2 border-white/70 bg-white/30 px-3 py-1 text-white">
              Status: {statusLabels[requirement.status]}
            </span>
          </div>
        </header>

        <div className="space-y-3 rounded-[26px] border-4 border-white/60 bg-white/90 p-5 text-sm text-[#0b1230]">
          {requirement.description ? (
            <p className="leading-relaxed">{requirement.description}</p>
          ) : (
            <p className="text-[#5b648f]">Kein Beschreibungstext hinterlegt.</p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoRow label="Anfrager" value={requirement.requester} />
            <InfoRow
              label="Zieldatum"
              value={requirement.targetDate ? formatDate(requirement.targetDate) : "Kein Datum"}
              icon={<CalendarClock className="h-4 w-4 text-[#ff5fa8]" />}
            />
            <InfoRow
              label="Kosten"
              value={`${requirement.cost.toLocaleString("de-DE")} €`}
              icon={<Euro className="h-4 w-4 text-[#ff5fa8]" />}
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

        <div className="space-y-3">
          <p className="font-arcade text-[10px] uppercase tracking-[0.4em] text-white/80">
            Aktivitätslog
          </p>
          <textarea
            className="retro-input min-h-[140px] w-full bg-white/95 text-[#0b1230]"
            placeholder="Notiz hinzufügen..."
            value={logDraft}
            onChange={(event) => onLogDraftChange(event.target.value)}
          />
          <div className="flex items-center justify-between">
            {logError ? (
              <p className="text-sm font-semibold text-red-500">{logError}</p>
            ) : (
              <span className="text-xs text-white/80">
                Datum wird automatisch ergänzt.
              </span>
            )}
            <Button
              onClick={onSubmitLog}
              disabled={!logDraft.trim() || logSubmitting}
            >
              {logSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eintrag sichern
            </Button>
          </div>
          <div className="space-y-3">
            {logsLoading ? (
              <p className="text-sm text-white/80">Einträge werden geladen...</p>
            ) : logs.length ? (
              <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-[22px] border-4 border-white/70 bg-white/90 p-3 text-[#0b1230]"
                  >
                    <p className="font-arcade text-[10px] uppercase tracking-[0.35em] text-[#ff5fa8]">
                      {formatDateTime(log.createdAt)}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {log.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/80">
                Noch keine Log-Einträge vorhanden.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-arcade text-[10px] uppercase tracking-[0.35em] text-white/80">
            Status ändern
          </p>
          <div className="flex flex-wrap gap-2">
            {statusOrder.map((status) => (
              <Button
                key={status}
                variant={requirement.status === status ? "lagoon" : "ghost"}
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

        {error && <p className="text-sm font-semibold text-red-300">{error}</p>}
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
    <div className="flex items-center gap-3 rounded-2xl border-2 border-white/60 bg-white/80 px-3 py-2">
      {icon && <span>{icon}</span>}
      <div>
        <p className="text-[10px] font-arcade uppercase tracking-[0.35em] text-[#6874a8]">
          {label}
        </p>
        <p className="text-sm font-semibold text-[#0b1230]">{value}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  element,
  required,
  className
}: {
  label: string;
  element: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  const containerClass = className ? `space-y-2 ${className}` : "space-y-2";
  return (
    <div className={containerClass}>
      <label className="text-sm font-semibold text-white/90">
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

function formatDateTime(input: string) {
  const date = new Date(input);
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
