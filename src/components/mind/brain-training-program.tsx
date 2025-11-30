"use client";

import { useCallback, useEffect, useState } from "react";

import type { BrainExerciseWithState, ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletion } from "@/hooks/use-program-completion";

interface BrainSessionState {
  completed: boolean;
  rating: number;
  notes: string;
}

export function BrainTrainingProgram({ program }: { program: ProgramDefinition }) {
  const [exercises, setExercises] = useState<BrainExerciseWithState[]>([]);
  const [sessionState, setSessionState] = useState<Record<string, BrainSessionState>>({});
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadExercises = useCallback(async () => {
    const params = new URLSearchParams();
    if (user?.email) params.set("userEmail", user.email);
    if (user?.name) params.set("userName", user.name);
    const response = await fetch(`/api/mind/brain-exercises${params.toString() ? `?${params.toString()}` : ""}`);
    if (!response.ok) return;
    const data: BrainExerciseWithState[] = await response.json();
    setExercises(data ?? []);
    setSessionState((prev) => {
      const next = { ...prev };
      for (const exercise of data) {
        if (!next[exercise.id]) {
          next[exercise.id] = {
            completed: false,
            rating: exercise.rating ?? 3,
            notes: ""
          };
        }
      }
      return next;
    });
  }, [user?.email, user?.name]);

  useEffect(() => {
    void loadExercises();
  }, [loadExercises]);

  const updateSession = (exerciseId: string, partial: Partial<BrainSessionState>) => {
    setSessionState((prev) => ({
      ...prev,
      [exerciseId]: {
        completed: prev[exerciseId]?.completed ?? false,
        rating: prev[exerciseId]?.rating ?? 3,
        notes: prev[exerciseId]?.notes ?? "",
        ...partial
      }
    }));
  };

  const handleSaveSessions = async () => {
    const payload = Object.entries(sessionState).filter(([, state]) => state.completed);
    if (payload.length === 0) {
      alert("Bitte mindestens eine Übung abhaken.");
      return;
    }
    setSaving(true);
    await Promise.all(
      payload.map(([exerciseId, state]) =>
        fetch(`/api/mind/brain-exercises/${exerciseId}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: state.rating,
            notes: state.notes,
            userEmail: user?.email,
            userName: user?.name
          })
        })
      )
    );

    await completeProgram({
      type: "brain-training",
      completedExercises: payload.map(([exerciseId]) => exerciseId)
    });

    setSessionState({});
    setSaving(false);
    await loadExercises();
  };

  return (
    <div className="space-y-6">
      {exercises.map((exercise) => {
        const state = sessionState[exercise.id] ?? {
          completed: false,
          rating: exercise.rating ?? 3,
          notes: ""
        };
        return (
          <article
            key={exercise.id}
            className="space-y-4 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm"
          >
            <header className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-400">
                    {exercise.focusArea}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900">{exercise.title}</h3>
                </div>
                {exercise.doneToday && <Badge className="bg-daisy-500 text-white">Heute</Badge>}
              </div>
              <p className="text-sm text-gray-600">{exercise.description}</p>
              <p className="text-xs text-gray-500">
                Difficulty {exercise.difficulty}/5 · {exercise.durationMinutes} Min
              </p>
            </header>
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                className="h-5 w-5 accent-daisy-500"
                checked={state.completed}
                onChange={(event) =>
                  updateSession(exercise.id, { completed: event.target.checked })
                }
              />
              Heute absolviert
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Bewertung ({state.rating}/5)
              <input
                type="range"
                min={1}
                max={5}
                value={state.rating}
                onChange={(event) =>
                  updateSession(exercise.id, { rating: Number(event.target.value) })
                }
                className="mt-2 w-full"
              />
            </label>
            <label className="text-sm font-semibold text-gray-700">
              Notiz
              <textarea
                value={state.notes}
                onChange={(event) => updateSession(exercise.id, { notes: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </label>
          </article>
        );
      })}

      <Button onClick={handleSaveSessions} disabled={saving || submitting}>
        Training speichern & XP buchen
      </Button>
    </div>
  );
}
