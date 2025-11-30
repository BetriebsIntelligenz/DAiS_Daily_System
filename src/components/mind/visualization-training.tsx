"use client";

import { useCallback, useEffect, useState } from "react";

import type { MindVisualizationAsset, ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useProgramCompletion } from "@/hooks/use-program-completion";

export function VisualizationTrainingProgram({ program }: { program: ProgramDefinition }) {
  const [assets, setAssets] = useState<MindVisualizationAsset[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reflectionScore, setReflectionScore] = useState(5);
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadAssets = useCallback(async () => {
    const response = await fetch("/api/mind/visuals");
    if (!response.ok) return;
    const data = await response.json();
    setAssets(data ?? []);
  }, []);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const toggleAsset = (assetId: string) => {
    setSelectedIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleComplete = async () => {
    if (selectedIds.length === 0) {
      alert("Wähle mindestens eine Visualisierung aus.");
      return;
    }
    await completeProgram({
      type: "visualization-training",
      selectedVisuals: selectedIds,
      reflectionScore
    });
    setSelectedIds([]);
    setReflectionScore(5);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Lade neue Bilder im Admin-Bereich hoch und hake jene ab, die du heute vivid visualisiert
        hast. Links die Visuals, rechts ein Flow-Pfad, der die Reihenfolge markiert.
      </p>
      <div className="relative">
        <div className="absolute right-10 top-0 bottom-0 w-px bg-daisy-200" aria-hidden />
        <div className="space-y-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="grid grid-cols-[minmax(0,1fr),80px] items-center gap-4"
            >
              <label
                className={`flex flex-col gap-3 rounded-3xl border px-4 py-4 shadow-sm ${
                  selectedIds.includes(asset.id)
                    ? "border-daisy-400 bg-daisy-50"
                    : "border-daisy-100 bg-white"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                  <span className="truncate">{asset.title}</span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-daisy-500"
                    checked={selectedIds.includes(asset.id)}
                    onChange={() => toggleAsset(asset.id)}
                  />
                </div>
                <div className="overflow-hidden rounded-2xl bg-black/10">
                  {asset.imageData ? (
                    <>
                      {/* Base64 Uploads: Next/Image would re-encode, hence native img */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.imageData}
                        alt={asset.title}
                        className="h-auto w-full object-contain"
                        style={{ maxHeight: "30rem" }}
                      />
                    </>
                  ) : (
                    <div className="flex h-40 items-center justify-center text-xs text-gray-500">
                      Kein Bild verfügbar
                    </div>
                  )}
                </div>
              </label>
              <div className="relative flex h-full items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-daisy-500 ring-4 ring-daisy-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-3xl border border-daisy-200 bg-white p-4 text-sm font-semibold text-gray-700">
        <div className="flex items-center justify-between">
          <span>States & Gefühle nach dem Visualisieren</span>
          <span className="text-base font-bold text-daisy-600">{reflectionScore}/10</span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={reflectionScore}
          onChange={(event) => setReflectionScore(Number(event.target.value))}
          className="accent-daisy-500"
        />
      </div>
      <Button onClick={handleComplete} disabled={submitting}>
        Visuals bestätigt & XP buchen
      </Button>
    </div>
  );
}
