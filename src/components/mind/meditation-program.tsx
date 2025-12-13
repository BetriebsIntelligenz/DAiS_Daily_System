"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import type { MindMeditationFlow, ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useProgramCompletion } from "@/hooks/use-program-completion";
import { useAutoProgramSubmit } from "@/hooks/use-auto-program-submit";

export function MeditationProgram({ program }: { program: ProgramDefinition }) {
  const [flows, setFlows] = useState<MindMeditationFlow[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [flowCompletion, setFlowCompletion] = useState<Record<string, boolean>>({});
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadFlows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mind/meditations");
      if (!response.ok) {
        console.error("Meditationen konnten nicht geladen werden", response.status);
        return;
      }
      const payload: MindMeditationFlow[] = await response.json();
      const safePayload = Array.isArray(payload) ? payload : [];
      setFlows(safePayload);
      setFlowCompletion((prev) => {
        const next: Record<string, boolean> = {};
        for (const flow of safePayload) {
          next[flow.id] = prev[flow.id] ?? false;
        }
        return next;
      });
      setSelectedFlowId((prev) => prev ?? payload?.[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlows();
  }, [loadFlows]);

  const selectedFlow = useMemo(
    () => flows.find((flow) => flow.id === selectedFlowId) ?? null,
    [flows, selectedFlowId]
  );

  const toggleFlow = (flowId: string) => {
    setSelectedFlowId((prev) => (prev === flowId ? null : flowId));
  };

  const toggleFlowCompletion = (flowId: string) => {
    setFlowCompletion((prev) => ({
      ...prev,
      [flowId]: !prev[flowId]
    }));
  };

  const handleComplete = async () => {
    const fallbackFlow = selectedFlow ?? flows[0] ?? null;
    await completeProgram({
      type: "meditation-flow",
      flowId: fallbackFlow?.id ?? null,
      flowTitle: fallbackFlow?.title ?? program.name,
      stepCount: fallbackFlow?.steps.length ?? 0,
      checklistConfirmed: fallbackFlow ? Boolean(flowCompletion[fallbackFlow.id]) : false
    });

    if (fallbackFlow) {
      setFlowCompletion((prev) => ({
        ...prev,
        [fallbackFlow.id]: false
      }));
    }
    setSelectedFlowId(null);
  };
  const autoSubmitEnabled = useAutoProgramSubmit(handleComplete);

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-400">
            Mind · MED Bereich
          </p>
          <h2 className="text-xl font-semibold text-gray-900">Meditations-Dropdowns</h2>
          <p className="text-sm text-gray-600">
            Wähle Sayajin oder Earth Love Meditation. Beim Öffnen siehst du den horizontalen Ablauf der Schritte.
          </p>
        </header>

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl border border-daisy-100 bg-white/80 px-4 py-3 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lädt Meditationen…
          </div>
        )}

        <div className="space-y-4">
          {flows.map((flow) => {
            const isOpen = selectedFlowId === flow.id;
            return (
              <article
                key={flow.id}
                className="rounded-3xl border border-daisy-100 bg-gradient-to-br from-white to-daisy-50/60 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleFlow(flow.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-3xl px-5 py-4 text-left"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-500">
                      {flow.subtitle ?? "Meditation"}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900">{flow.title}</h3>
                    {flow.summary && (
                      <p className="text-sm text-gray-600">{flow.summary}</p>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-daisy-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-daisy-100 bg-white/80 px-5 pb-5 pt-4">
                    <div className="flex w-full snap-x gap-4 overflow-x-auto pb-2">
                      {flow.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex min-w-[220px] flex-col gap-2 rounded-2xl border border-daisy-100 bg-white/90 p-4 shadow-sm"
                        >
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-daisy-200 to-daisy-500 text-sm font-semibold text-white">
                            {index + 1}
                          </span>
                          <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                          {step.description && (
                            <p className="text-sm text-gray-600">{step.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    <label className="mt-4 flex items-center gap-3 rounded-2xl border border-daisy-100 bg-white/90 px-4 py-3 text-sm font-semibold text-gray-800">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-daisy-500"
                        checked={Boolean(flowCompletion[flow.id])}
                        onChange={() => toggleFlowCompletion(flow.id)}
                      />
                      Heute durchgeführt
                    </label>
                  </div>
                )}
              </article>
            );
          })}
          {!loading && flows.length === 0 && (
            <p className="text-sm text-gray-500">Noch keine Meditationen konfiguriert.</p>
          )}
        </div>
      </section>

      {!autoSubmitEnabled && (
        <Button
          type="button"
          className="w-full"
          onClick={() => void handleComplete()}
          disabled={submitting}
        >
          Meditation Session abschließen
        </Button>
      )}
    </div>
  );
}
