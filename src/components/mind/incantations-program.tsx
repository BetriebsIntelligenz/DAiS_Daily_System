"use client";

import { useMemo, useState } from "react";

import type { ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useProgramCompletion } from "@/hooks/use-program-completion";

const AFFIRMATIONS = [
  { id: "natural-wealth", text: "Reichtum ist mein natürlicher Zustand" },
  { id: "money-magnet", text: "Ich bin ein Magnet für Geld und Erfolg." },
  { id: "pure-energy", text: "Ich bin Energie." },
  { id: "i-am-healthy", text: "Ich bin gesund." },
  { id: "gratitude-health", text: "Ich bin dankbar für meine Gesundheit." }
] as const;

type AffirmationId = (typeof AFFIRMATIONS)[number]["id"];

function createChecklistState() {
  return AFFIRMATIONS.reduce<Record<AffirmationId, boolean>>(
    (acc, entry) => {
      acc[entry.id] = false;
      return acc;
    },
    {} as Record<AffirmationId, boolean>
  );
}

export function IncantationsProgram({ program }: { program: ProgramDefinition }) {
  const { completeProgram, submitting } = useProgramCompletion(program);
  const [checked, setChecked] = useState<Record<AffirmationId, boolean>>(createChecklistState);
  const [intensity, setIntensity] = useState(7);
  const [error, setError] = useState<string | null>(null);

  const completedCount = useMemo(
    () => AFFIRMATIONS.filter((entry) => checked[entry.id]).length,
    [checked]
  );
  const allCompleted = completedCount === AFFIRMATIONS.length;

  const toggleAffirmation = (id: AffirmationId) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
    setError(null);
  };

  const handleComplete = async () => {
    if (!allCompleted) {
      setError("Bitte jede Incantation mindestens einmal laut bestätigt.");
      return;
    }
    setError(null);
    await completeProgram({
      type: "incantations-checklist",
      affirmations: AFFIRMATIONS.map((entry) => ({
        id: entry.id,
        text: entry.text,
        completed: checked[entry.id]
      })),
      intensity
    });
    setChecked(createChecklistState());
    setIntensity(7);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-400">
            Ritual
          </p>
          <h2 className="text-xl font-semibold text-gray-900">
            Incantations bestätigen
          </h2>
          <p className="text-sm text-gray-600">
            Wiederhole jede Formel laut, fühle sie im Körper und hake anschließend die Karte ab.
          </p>
        </header>
        <div className="grid gap-3">
          {AFFIRMATIONS.map((affirmation) => (
            <label
              key={affirmation.id}
              className="flex items-start gap-3 rounded-3xl border border-daisy-100 bg-gradient-to-br from-white to-daisy-50/60 p-4 text-sm font-medium text-gray-900 shadow-sm"
            >
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-gray-300 text-daisy-500 focus:ring-daisy-400"
                checked={checked[affirmation.id]}
                onChange={() => toggleAffirmation(affirmation.id)}
                disabled={submitting}
              />
              <span>{affirmation.text}</span>
            </label>
          ))}
        </div>
        <div className="rounded-3xl border border-daisy-50 bg-white/90 p-4">
          <label className="flex items-center justify-between text-sm font-semibold text-gray-800">
            Intensivität
            <span className="text-xs uppercase tracking-[0.3em] text-daisy-500">
              {intensity}/10
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            className="mt-3 w-full accent-daisy-500"
            disabled={submitting}
          />
        </div>
        <p className="text-xs text-gray-500">
          Fortschritt: {completedCount}/{AFFIRMATIONS.length} Karten abgehakt.
        </p>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <Button
          type="button"
          onClick={() => void handleComplete()}
          disabled={submitting}
          className="w-full"
        >
          Incantations abschließen & XP buchen
        </Button>
      </section>
    </div>
  );
}
