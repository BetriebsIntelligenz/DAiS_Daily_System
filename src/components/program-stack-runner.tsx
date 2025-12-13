"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";

import type {
  ProgramDefinition,
  ProgramStackDefinition
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ProgramContent } from "@/components/program-content";
import { ProgramCompletionProvider } from "@/contexts/program-completion-context";

export function ProgramStackRunner({
  stack,
  programs
}: {
  stack: ProgramStackDefinition;
  programs: ProgramDefinition[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedProgramIds, setCompletedProgramIds] = useState<string[]>([]);
  const [flowFinished, setFlowFinished] = useState(false);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [autoSubmitReady, setAutoSubmitReady] = useState(false);
  const autoSubmitRef = useRef<(() => Promise<void>) | null>(null);

  const currentProgram = programs[currentIndex];
  const currentCompleted = completedProgramIds.includes(currentProgram.id);
  const total = programs.length;

  const handleProgramCompleted = useCallback(
    async (program: ProgramDefinition) => {
      setCompletedProgramIds((prev) =>
        prev.includes(program.id) ? prev : [...prev, program.id]
      );
      setFlowFinished(false);
    },
    []
  );

  const registerAutoSubmit = useCallback((handler: (() => Promise<void>) | null) => {
    autoSubmitRef.current = handler;
    setAutoSubmitReady(Boolean(handler));
  }, []);

  const attemptAutoSubmit = useCallback(async () => {
    const handler = autoSubmitRef.current;
    if (!handler) {
      console.warn("Kein Auto-Submit Handler registriert", currentProgram.id);
      return false;
    }
    setAutoSubmitting(true);
    try {
      await handler();
      return true;
    } catch (error) {
      console.error("Programm konnte nicht automatisch abgeschlossen werden", error);
      return false;
    } finally {
      setAutoSubmitting(false);
    }
  }, [currentProgram.id]);

  const goNext = useCallback(async () => {
    if (flowFinished || autoSubmitting) return;
    if (!currentCompleted) {
      const success = await attemptAutoSubmit();
      if (!success) return;
    }
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setFlowFinished(false);
    } else {
      setFlowFinished(true);
    }
  }, [attemptAutoSubmit, autoSubmitting, currentCompleted, currentIndex, flowFinished, total]);

  const goPrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setFlowFinished(false);
  };

  const stackProgress = useMemo(
    () => ((completedProgramIds.length / total) * 100).toFixed(0),
    [completedProgramIds.length, total]
  );

  const completionContextValue = useMemo(
    () => ({
      onProgramCompleted: handleProgramCompleted,
      redirectTo: null,
      autoSubmitEnabled: true,
      registerAutoSubmit
    }),
    [handleProgramCompleted, registerAutoSubmit]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm font-semibold text-daisy-800">
        Programm Modus: {stack.title}
      </div>
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        <span>
          Schritt {currentIndex + 1} von {total} · Fortschritt {stackProgress}%
        </span>
        <span className="text-xs text-gray-500">{stack.summary}</span>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {programs.map((program, index) => {
          const done = completedProgramIds.includes(program.id);
          const isActive = index === currentIndex;
          return (
            <li
              key={program.id}
              className={`rounded-full border px-3 py-1 ${
                done
                  ? "border-daisy-500 bg-daisy-100 text-daisy-800"
                  : isActive
                    ? "border-daisy-400 bg-white text-daisy-700"
                    : "border-daisy-100 bg-white"
              }`}
            >
              {program.code}
            </li>
          );
        })}
      </ol>
      <ProgramCompletionProvider value={completionContextValue}>
        <ProgramContent program={currentProgram} />
      </ProgramCompletionProvider>
      {flowFinished && (
        <div className="rounded-2xl border border-daisy-200 bg-daisy-50 px-4 py-3 text-sm text-daisy-800">
          Programm abgeschlossen! Wähle eine Folgeaktion.
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0}>
          Zurück
        </Button>
        <Button
          onClick={() => void goNext()}
          disabled={
            flowFinished ||
            autoSubmitting ||
            (!currentCompleted && !autoSubmitReady)
          }
        >
          {autoSubmitting
            ? "Speichert…"
            : currentIndex === total - 1
              ? "Programm abschließen"
              : "Weiter"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Zum Hauptmenü</Link>
        </Button>
      </div>
    </div>
  );
}
