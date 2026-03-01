"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Info } from "lucide-react";

import type { ProgramDefinition, ProgramExercise, ProgramUnit } from "@/lib/types";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS: ProgramDefinition["category"][] = [
  "mind",
  "body",
  "human",
  "environment",
  "business"
];
const FREQUENCY_OPTIONS: ProgramDefinition["frequency"][] = [
  "daily",
  "weekly",
  "monthly",
  "adhoc",
  "block_only"
];
const MODE_OPTIONS: ProgramDefinition["mode"][] = ["single", "flow"];

type EditorFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "toggle"
  | "scale"
  | "multiselect"
  | "select"
  | "date";

interface ExerciseDraft {
  id?: string;
  label: string;
  description: string;
  fieldType: EditorFieldType;
  xpValue: number;
  placeholder: string;
  optionsText: string;
  scaleMin: number;
  scaleMax: number;
}

interface UnitDraft {
  id?: string;
  title: string;
  order: number;
  exercises: ExerciseDraft[];
}

interface CardDraft {
  id?: string;
  name: string;
  slug: string;
  code: string;
  summary: string;
  category: ProgramDefinition["category"];
  frequency: ProgramDefinition["frequency"];
  durationMinutes: number;
  xpReward: number;
  mode: ProgramDefinition["mode"];
  units: UnitDraft[];
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createEmptyExercise(): ExerciseDraft {
  return {
    label: "",
    description: "",
    fieldType: "text",
    xpValue: 100,
    placeholder: "",
    optionsText: "",
    scaleMin: 1,
    scaleMax: 5
  };
}

function createEmptyUnit(order: number): UnitDraft {
  return {
    title: `Unit ${order}`,
    order,
    exercises: [createEmptyExercise()]
  };
}

function createEmptyCard(): CardDraft {
  return {
    name: "",
    slug: "",
    code: "",
    summary: "",
    category: "mind",
    frequency: "daily",
    durationMinutes: 10,
    xpReward: 200,
    mode: "single",
    units: [createEmptyUnit(1)]
  };
}

function inferFieldType(exercise: ProgramExercise): EditorFieldType {
  const variant = exercise.config?.inputVariant;

  if (exercise.type === "checkbox") {
    return variant === "toggle" ? "toggle" : "checkbox";
  }
  if (exercise.type === "multiselect") {
    return exercise.config?.singleSelect ? "select" : "multiselect";
  }
  if (exercise.type === "scale") {
    return "scale";
  }
  if (exercise.type === "number") {
    return "number";
  }
  if (exercise.type === "html") {
    return "textarea";
  }
  if (exercise.type === "text") {
    if (variant === "date") {
      return "date";
    }
    if (variant === "text") {
      return "text";
    }
    return "textarea";
  }

  return "text";
}

function programToDraft(program: ProgramDefinition): CardDraft {
  return {
    id: program.id,
    name: program.name,
    slug: program.slug,
    code: program.code,
    summary: program.summary,
    category: program.category,
    frequency: program.frequency,
    durationMinutes: program.durationMinutes,
    xpReward: program.xpReward,
    mode: program.mode,
    units: program.units
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((unit, unitIndex) => ({
        id: unit.id,
        title: unit.title,
        order: unit.order || unitIndex + 1,
        exercises: unit.exercises.map((exercise) => ({
          id: exercise.id,
          label: exercise.label,
          description: exercise.description ?? "",
          fieldType: inferFieldType(exercise),
          xpValue: exercise.xpValue,
          placeholder: exercise.config?.placeholder ?? "",
          optionsText: Array.isArray(exercise.config?.options)
            ? exercise.config?.options.join("\n")
            : "",
          scaleMin: Number(exercise.config?.scaleMin ?? 1),
          scaleMax: Number(exercise.config?.scaleMax ?? 5)
        }))
      }))
  };
}

function exerciseDraftToPayload(exercise: ExerciseDraft) {
  const options = exercise.optionsText
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  switch (exercise.fieldType) {
    case "textarea":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "html" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          inputVariant: "textarea",
          placeholder: exercise.placeholder || undefined
        }
      };
    case "number":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "number" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          placeholder: exercise.placeholder || undefined
        }
      };
    case "checkbox":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "checkbox" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {}
      };
    case "toggle":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "checkbox" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          inputVariant: "toggle"
        }
      };
    case "scale":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "scale" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          scaleMin: Math.round(Number(exercise.scaleMin) || 1),
          scaleMax: Math.round(Number(exercise.scaleMax) || 5)
        }
      };
    case "multiselect":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "multiselect" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          options,
          singleSelect: false
        }
      };
    case "select":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "multiselect" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          options,
          singleSelect: true
        }
      };
    case "date":
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "text" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          inputVariant: "date"
        }
      };
    case "text":
    default:
      return {
        label: exercise.label,
        description: exercise.description || undefined,
        type: "text" as const,
        xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0)),
        config: {
          inputVariant: "text",
          placeholder: exercise.placeholder || undefined
        }
      };
  }
}

interface AdminCardEditorProps {
  programs: ProgramDefinition[];
  onRefresh: () => Promise<void>;
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
          {label}
        </p>
        <FieldHelp text={help} />
      </div>
      {children}
    </div>
  );
}

export function AdminCardEditor({ programs, onRefresh }: AdminCardEditorProps) {
  const [draft, setDraft] = useState<CardDraft>(createEmptyCard);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedPrograms = useMemo(
    () => [...programs].sort((left, right) => left.code.localeCompare(right.code)),
    [programs]
  );

  const resetEditor = () => {
    setDraft(createEmptyCard());
    setEditingProgramId(null);
    setError(null);
  };

  const startEdit = (program: ProgramDefinition) => {
    setDraft(programToDraft(program));
    setEditingProgramId(program.id);
    setError(null);
  };

  const duplicateProgram = (program: ProgramDefinition) => {
    const next = programToDraft(program);
    setDraft({
      ...next,
      id: undefined,
      name: `${next.name} Copy`,
      slug: "",
      code: ""
    });
    setEditingProgramId(null);
    setError(null);
  };

  const updateUnit = (unitIndex: number, updater: (unit: UnitDraft) => UnitDraft) => {
    setDraft((prev) => ({
      ...prev,
      units: prev.units.map((unit, index) => (index === unitIndex ? updater(unit) : unit))
    }));
  };

  const validateDraft = () => {
    if (!draft.name.trim()) {
      return "Programmtitel ist erforderlich.";
    }
    if (!draft.units.length) {
      return "Mindestens eine Unit ist erforderlich.";
    }
    for (const unit of draft.units) {
      if (!unit.title.trim()) {
        return "Jede Unit benötigt einen Titel.";
      }
      if (!unit.exercises.length) {
        return `Unit \"${unit.title}\" benötigt mindestens ein Feld.`;
      }
      for (const exercise of unit.exercises) {
        if (!exercise.label.trim()) {
          return `Jedes Feld in Unit \"${unit.title}\" benötigt ein Label.`;
        }
        if ((exercise.fieldType === "select" || exercise.fieldType === "multiselect") &&
          exercise.optionsText
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean).length === 0) {
          return `Feld \"${exercise.label}\" benötigt mindestens eine Option.`;
        }
      }
    }
    return null;
  };

  const submitCard = async () => {
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      id: editingProgramId ?? undefined,
      name: draft.name.trim(),
      slug: normalizeSlug(draft.slug.trim() || draft.name),
      code: (draft.code.trim() || draft.name.slice(0, 3)).toUpperCase(),
      summary: draft.summary.trim(),
      category: draft.category,
      frequency: draft.frequency,
      durationMinutes: Math.max(1, Math.round(Number(draft.durationMinutes) || 1)),
      xpReward: Math.max(0, Math.round(Number(draft.xpReward) || 0)),
      mode: draft.mode,
      units: draft.units.map((unit, unitIndex) => ({
        id: unit.id,
        title: unit.title.trim(),
        order: unitIndex + 1,
        exercises: unit.exercises.map((exercise) => exerciseDraftToPayload(exercise))
      }))
    };

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/programs", {
        method: editingProgramId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Card konnte nicht gespeichert werden.");
      }
      await onRefresh();
      resetEditor();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Card konnte nicht gespeichert werden."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProgram = async (program: ProgramDefinition) => {
    if (!window.confirm(`Card \"${program.name}\" wirklich löschen/archivieren?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/programs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: program.id })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Card konnte nicht gelöscht werden.");
      }
      await onRefresh();
      if (editingProgramId === program.id) {
        resetEditor();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Card konnte nicht gelöscht werden."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Card Editor</h2>
        <p className="text-sm text-gray-500">
          Erstelle und bearbeite vollwertige Programm-Cards mit Units und Feldern.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr,1.3fr]">
        <section className="rounded-3xl border border-daisy-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Bestehende Cards
            </h3>
            <Button type="button" variant="outline" onClick={resetEditor} disabled={saving}>
              Neue Card
            </Button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {sortedPrograms.map((program) => (
              <li
                key={program.id}
                className="rounded-2xl border border-daisy-100 bg-white p-3"
              >
                <p className="font-semibold text-gray-900">
                  {program.code} — {program.name}
                </p>
                <p className="text-sm text-gray-600">
                  {program.category} · {program.units.length} Units
                </p>
                {program.summary && (
                  <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-700">
                    {program.summary}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="ghost" onClick={() => startEdit(program)}>
                    Bearbeiten
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => duplicateProgram(program)}>
                    Duplizieren
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => deleteProgram(program)}>
                    Löschen
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-daisy-100 bg-white/80 p-4 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            {editingProgramId ? "Card bearbeiten" : "Neue Card"}
          </h3>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <FieldBlock
              label="Programmtitel"
              help="Name der Card. Wird in Programmliste, Detailansicht und Stack-Auswahl angezeigt."
            >
              <input
                value={draft.name}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Programmtitel"
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </FieldBlock>
            <FieldBlock
              label="Code"
              help="Kurzcode der Card (z. B. MC1). Wird in Kartenchips, Listen und Stack-Schritten angezeigt."
            >
              <input
                value={draft.code}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))
                }
                placeholder="Code (z.B. MC1)"
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </FieldBlock>
            <FieldBlock
              label="Slug"
              help="Technische URL-ID der Card. Wenn leer, wird sie automatisch aus dem Programmtitel erzeugt."
            >
              <input
                value={draft.slug}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, slug: normalizeSlug(event.target.value) }))
                }
                placeholder="Slug (optional)"
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </FieldBlock>
            <FieldBlock
              label="Kategorie"
              help="Legt fest, unter welchem Hauptmenüpunkt die Card einsortiert wird."
            >
              <select
                value={draft.category}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    category: event.target.value as ProgramDefinition["category"]
                  }))
                }
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock
              label="Frequenz"
              help="Bestimmt, wie die Card in der Routine gedacht ist (z. B. täglich oder wöchentlich)."
            >
              <select
                value={draft.frequency}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    frequency: event.target.value as ProgramDefinition["frequency"]
                  }))
                }
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock
              label="Modus"
              help="Steuert die Ausführung der Card im Programmablauf (Single oder Flow)."
            >
              <select
                value={draft.mode}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    mode: event.target.value as ProgramDefinition["mode"]
                  }))
                }
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </FieldBlock>
            <FieldBlock
              label="Dauer"
              help="Geplante Dauer in Minuten. Wird in Beschreibung und Zeitdarstellungen verwendet."
            >
              <input
                type="number"
                value={draft.durationMinutes}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))
                }
                placeholder="Dauer (Minuten)"
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </FieldBlock>
            <FieldBlock
              label="XP Reward"
              help="Gesamt-XP der Card. Beeinflusst die XP-Vergabe bei erfolgreichem Run."
            >
              <input
                type="number"
                value={draft.xpReward}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, xpReward: Number(event.target.value) }))
                }
                placeholder="XP Reward"
                className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </FieldBlock>
            <FieldBlock
              label="Beschreibung"
              help="Kurztext zur Card. Wird in Übersicht, Detailansicht und Orientierung für Nutzer angezeigt."
              className="md:col-span-2"
            >
              <textarea
                value={draft.summary}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, summary: event.target.value }))
                }
                placeholder="Kurzbeschreibung"
                className="min-h-[150px] w-full rounded-2xl border border-daisy-200 px-4 py-3 text-[15px] leading-relaxed"
              />
            </FieldBlock>
          </div>

          <div className="mt-5 space-y-4">
            {draft.units.map((unit, unitIndex) => (
              <article key={`${unit.id ?? "new"}-${unitIndex}`} className="rounded-2xl border border-daisy-100 bg-white p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <FieldBlock
                    label="Unit Titel"
                    help="Name des Abschnitts innerhalb der Card. Strukturierte Darstellung für Nutzer im Run."
                    className="flex-1"
                  >
                    <input
                      value={unit.title}
                      onChange={(event) =>
                        updateUnit(unitIndex, (current) => ({
                          ...current,
                          title: event.target.value
                        }))
                      }
                      placeholder="Unit Titel"
                      className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                    />
                  </FieldBlock>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={draft.units.length <= 1}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        units: prev.units.filter((_, index) => index !== unitIndex)
                      }))
                    }
                  >
                    Unit löschen
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {unit.exercises.map((exercise, exerciseIndex) => (
                    <div key={`${exercise.id ?? "new"}-${exerciseIndex}`} className="rounded-2xl border border-daisy-100 bg-daisy-50/40 p-3">
                      <div className="grid gap-2 md:grid-cols-2">
                        <FieldBlock
                          label="Feldlabel"
                          help="Name des Eingabefelds. Wird im Programm-Run direkt dem Nutzer angezeigt."
                        >
                          <input
                            value={exercise.label}
                            onChange={(event) =>
                              updateUnit(unitIndex, (current) => ({
                                ...current,
                                exercises: current.exercises.map((entry, index) =>
                                  index === exerciseIndex
                                    ? { ...entry, label: event.target.value }
                                    : entry
                                )
                              }))
                            }
                            placeholder="Feldlabel"
                            className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                          />
                        </FieldBlock>
                        <FieldBlock
                          label="Feldtyp"
                          help="Legt Interaktion und Validierung fest, z. B. Checkbox, Select, Date oder Number."
                        >
                          <select
                            value={exercise.fieldType}
                            onChange={(event) =>
                              updateUnit(unitIndex, (current) => ({
                                ...current,
                                exercises: current.exercises.map((entry, index) =>
                                  index === exerciseIndex
                                    ? {
                                        ...entry,
                                        fieldType: event.target.value as EditorFieldType
                                      }
                                    : entry
                                )
                              }))
                            }
                            className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                          >
                            <option value="text">Text</option>
                            <option value="textarea">Textarea</option>
                            <option value="number">Number</option>
                            <option value="checkbox">Checkbox</option>
                            <option value="toggle">Toggle</option>
                            <option value="date">Date</option>
                            <option value="scale">Scale</option>
                            <option value="multiselect">Multi Select</option>
                            <option value="select">Select</option>
                          </select>
                        </FieldBlock>
                        <FieldBlock
                          label="XP Wert"
                          help="XP-Anteil dieses Felds innerhalb der Unit. Wirkt auf die Punkteverteilung beim Abschluss."
                        >
                          <input
                            type="number"
                            value={exercise.xpValue}
                            onChange={(event) =>
                              updateUnit(unitIndex, (current) => ({
                                ...current,
                                exercises: current.exercises.map((entry, index) =>
                                  index === exerciseIndex
                                    ? { ...entry, xpValue: Number(event.target.value) }
                                    : entry
                                )
                              }))
                            }
                            placeholder="XP Wert"
                            className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                          />
                        </FieldBlock>
                      </div>
                      <FieldBlock
                        label="Beschreibung"
                        help="Hilfetext für dieses Feld. Erklärt dem Nutzer, was erwartet wird und verbessert die Verständlichkeit im Run."
                        className="mt-2"
                      >
                        <textarea
                          value={exercise.description}
                          onChange={(event) =>
                            updateUnit(unitIndex, (current) => ({
                              ...current,
                              exercises: current.exercises.map((entry, index) =>
                                index === exerciseIndex
                                  ? { ...entry, description: event.target.value }
                                  : entry
                              )
                            }))
                          }
                          placeholder="Beschreibung (optional)"
                          className="min-h-[120px] w-full rounded-xl border border-daisy-200 px-3 py-2.5 text-[15px] leading-relaxed"
                        />
                      </FieldBlock>

                      {(exercise.fieldType === "text" ||
                        exercise.fieldType === "textarea" ||
                        exercise.fieldType === "number") && (
                        <FieldBlock
                          label="Placeholder"
                          help="Beispiel- oder Hinweistext im leeren Eingabefeld. Unterstützt Nutzer bei der Eingabe."
                          className="mt-2"
                        >
                          <input
                            value={exercise.placeholder}
                            onChange={(event) =>
                              updateUnit(unitIndex, (current) => ({
                                ...current,
                                exercises: current.exercises.map((entry, index) =>
                                  index === exerciseIndex
                                    ? { ...entry, placeholder: event.target.value }
                                    : entry
                                )
                              }))
                            }
                            placeholder="Placeholder"
                            className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                          />
                        </FieldBlock>
                      )}

                      {(exercise.fieldType === "select" || exercise.fieldType === "multiselect") && (
                        <FieldBlock
                          label="Optionen"
                          help="Auswahlwerte für Select/Multi-Select. Jede Zeile wird als eigene Option im Frontend angezeigt."
                          className="mt-2"
                        >
                          <textarea
                            value={exercise.optionsText}
                            onChange={(event) =>
                              updateUnit(unitIndex, (current) => ({
                                ...current,
                                exercises: current.exercises.map((entry, index) =>
                                  index === exerciseIndex
                                    ? { ...entry, optionsText: event.target.value }
                                    : entry
                                )
                              }))
                            }
                            placeholder="Optionen (eine pro Zeile)"
                            className="min-h-[110px] w-full rounded-xl border border-daisy-200 px-3 py-2"
                          />
                        </FieldBlock>
                      )}

                      {exercise.fieldType === "scale" && (
                        <div className="mt-2 grid gap-2 md:grid-cols-2">
                          <FieldBlock
                            label="Scale Min"
                            help="Untergrenze der Bewertungsskala für dieses Feld."
                          >
                            <input
                              type="number"
                              value={exercise.scaleMin}
                              onChange={(event) =>
                                updateUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? { ...entry, scaleMin: Number(event.target.value) }
                                      : entry
                                  )
                                }))
                              }
                              placeholder="Scale Min"
                              className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                            />
                          </FieldBlock>
                          <FieldBlock
                            label="Scale Max"
                            help="Obergrenze der Bewertungsskala für dieses Feld."
                          >
                            <input
                              type="number"
                              value={exercise.scaleMax}
                              onChange={(event) =>
                                updateUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? { ...entry, scaleMax: Number(event.target.value) }
                                      : entry
                                  )
                                }))
                              }
                              placeholder="Scale Max"
                              className="w-full rounded-xl border border-daisy-200 px-3 py-2"
                            />
                          </FieldBlock>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={unit.exercises.length <= 1}
                          onClick={() =>
                            updateUnit(unitIndex, (current) => ({
                              ...current,
                              exercises: current.exercises.filter((_, index) => index !== exerciseIndex)
                            }))
                          }
                        >
                          Feld löschen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() =>
                    updateUnit(unitIndex, (current) => ({
                      ...current,
                      exercises: [...current.exercises, createEmptyExercise()]
                    }))
                  }
                >
                  Feld hinzufügen
                </Button>
              </article>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  units: [...prev.units, createEmptyUnit(prev.units.length + 1)]
                }))
              }
            >
              Unit hinzufügen
            </Button>
            <Button type="button" onClick={submitCard} disabled={saving}>
              {saving ? "Speichert…" : editingProgramId ? "Card aktualisieren" : "Card erstellen"}
            </Button>
          </div>

          {error && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
