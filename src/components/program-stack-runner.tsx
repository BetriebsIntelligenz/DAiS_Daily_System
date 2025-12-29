"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Square, Timer } from "lucide-react";

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
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const autoSubmitRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  const toggleTimer = () => setTimerActive((prev) => !prev);
  const stopTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

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
      setTimerActive(false); // Auto-stop timer
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
    <div className="space-y-6 text-[#0b1230]">
      <div className="rounded-[28px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold shadow-arcade">
        Programm Modus: {stack.title}
        {stack.durationMinutes && (
          <span className="block text-xs font-normal text-gray-500">
            Geplante Dauer: {stack.durationMinutes} Min.
          </span>
        )}
      </div>

      <div className="flex items-center justify-between rounded-[24px] border border-daisy-200 bg-white/50 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-lg font-bold font-mono text-daisy-900">
          <Timer className="h-5 w-5 text-daisy-500" />
          <span>{formatTime(timerSeconds)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-daisy-600 hover:bg-daisy-100 hover:text-daisy-800"
            onClick={toggleTimer}
          >
            {timerActive ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
            <span className="sr-only">{timerActive ? "Pause" : "Start"}</span>
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-full p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={stopTimer}
          >
            <Square className="h-4 w-4 fill-current" />
            <span className="sr-only">Stop</span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm text-[#4b5685]">
        <span>
          Schritt {currentIndex + 1} von {total} · Fortschritt {stackProgress}%
        </span>
        <span className="text-xs uppercase tracking-[0.3em] text-[#7a83b5]">
          {stack.summary}
        </span>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#6f78aa]">
        {programs.map((program, index) => {
          const done = completedProgramIds.includes(program.id);
          const isActive = index === currentIndex;
          return (
            <li
              key={program.id}
              className={`rounded-full border-2 px-3 py-1 ${done
                ? "border-white/90 bg-[#ffe5f9] text-[#821650]"
                : isActive
                  ? "border-white/70 bg-white text-[#0b1230] shadow-arcade"
                  : "border-white/40 bg-white/60 text-[#4f5a87]"
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
        <div className="rounded-[26px] border-4 border-white/70 bg-white/90 px-4 py-3 text-sm text-[#0b1230] shadow-arcade">
          Programm abgeschlossen! Wähle eine Folgeaktion.
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" onClick={goPrev} disabled={currentIndex === 0}>
          Zurück
        </Button>
        <Button
          variant="lagoon"
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
        <Button asChild variant="outline">
          <Link href="/">Zum Hauptmenü</Link>
        </Button>
      </div>
    </div>
  );
}
