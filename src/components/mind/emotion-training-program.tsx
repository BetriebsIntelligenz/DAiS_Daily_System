"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  EmotionPracticeWithLogs,
  ProgramDefinition
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletion } from "@/hooks/use-program-completion";

interface EmotionLogForm {
  practiceId: string;
  emotionLabel: string;
  intensity: number;
  note: string;
}

export function EmotionTrainingProgram({ program }: { program: ProgramDefinition }) {
  const [practices, setPractices] = useState<EmotionPracticeWithLogs[]>([]);
  const [logForm, setLogForm] = useState<EmotionLogForm>({
    practiceId: "",
    emotionLabel: "",
    intensity: 5,
    note: ""
  });
  const [hasLogged, setHasLogged] = useState(false);
  const [lastLog, setLastLog] = useState<Partial<EmotionLogForm> | null>(null);
  const { user } = useAuth();
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadPractices = useCallback(async () => {
    const params = new URLSearchParams();
    if (user?.email) params.set("userEmail", user.email);
    if (user?.name) params.set("userName", user.name);
    const response = await fetch(
      `/api/mind/emotions${params.toString() ? `?${params.toString()}` : ""}`
    );
    if (!response.ok) return;
    const data: EmotionPracticeWithLogs[] = await response.json();
    setPractices(data ?? []);
  }, [user?.email, user?.name]);

  useEffect(() => {
    void loadPractices();
  }, [loadPractices]);

  const handleLogSubmit = async () => {
    if (!logForm.emotionLabel) {
      alert("Bitte Emotion oder Label eintragen.");
      return;
    }
    await fetch("/api/mind/emotions/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...logForm,
        userEmail: user?.email,
        userName: user?.name
      })
    });
    setHasLogged(true);
    setLastLog(logForm);
    setLogForm({
      practiceId: "",
      emotionLabel: "",
      intensity: 5,
      note: ""
    });
    await loadPractices();
  };

  const handleComplete = async () => {
    if (!hasLogged || !lastLog) {
      alert("Bitte mindestens einen Emotion Log erstellen.");
      return;
    }
    await completeProgram({
      type: "emotion-training",
      lastLog
    });
    setHasLogged(false);
    setLastLog(null);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm">
        <header>
          <h3 className="text-lg font-semibold text-gray-900">Emotion loggen</h3>
          <p className="text-sm text-gray-600">
            Tracke Intensität, bestimme die passende Regulationstechnik und schreibe eine Mini-Note.
          </p>
        </header>
        <select
          value={logForm.practiceId}
          onChange={(event) => setLogForm((prev) => ({ ...prev, practiceId: event.target.value }))}
          className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
        >
          <option value="">Regulation auswählen (optional)</option>
          {practices.map((practice) => (
            <option key={practice.id} value={practice.id}>
              {practice.emotion} — {practice.summary}
            </option>
          ))}
        </select>
        <input
          value={logForm.emotionLabel}
          onChange={(event) =>
            setLogForm((prev) => ({ ...prev, emotionLabel: event.target.value }))
          }
          placeholder="Emotion / Label"
          className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
        <label className="text-sm font-semibold text-gray-700">
          Intensität ({logForm.intensity}/10)
          <input
            type="range"
            min={1}
            max={10}
            value={logForm.intensity}
            onChange={(event) =>
              setLogForm((prev) => ({ ...prev, intensity: Number(event.target.value) }))
            }
            className="mt-2 w-full"
          />
        </label>
        <textarea
          value={logForm.note}
          onChange={(event) => setLogForm((prev) => ({ ...prev, note: event.target.value }))}
          placeholder="Was passiert im Körper / Kopf?"
          className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
        />
        <Button type="button" onClick={() => void handleLogSubmit()}>
          Emotion loggen
        </Button>
      </section>

      <section className="space-y-4">
        {practices.map((practice) => (
          <article
            key={practice.id}
            className="space-y-3 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm"
          >
            <header>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-400">
                {practice.emotion}
              </p>
              <h3 className="text-lg font-semibold text-gray-900">{practice.summary}</h3>
              {practice.groundingPrompt && (
                <p className="text-sm text-daisy-600">Prompt: {practice.groundingPrompt}</p>
              )}
            </header>
            <ul className="grid gap-2 text-sm text-gray-700">
              {practice.regulationSteps.map((step) => (
                <li
                  key={step}
                  className="rounded-2xl border border-daisy-100 bg-white px-4 py-2"
                >
                  {step}
                </li>
              ))}
            </ul>
            {practice.recentLogs.length > 0 && (
              <div className="rounded-2xl border border-daisy-50 bg-daisy-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-500">
                  Letzte Logs
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {practice.recentLogs.map((log) => (
                    <li key={log.id}>
                      {new Date(log.createdAt).toLocaleDateString("de-DE")} — {log.emotionLabel} (
                      {log.intensity}/10){log.note ? ` · ${log.note}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </section>

      <Button onClick={handleComplete} disabled={submitting}>
        Emotion Training abschließen
      </Button>
    </div>
  );
}
