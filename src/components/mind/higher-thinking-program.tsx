"use client";

import { useCallback, useEffect, useState } from "react";

import type { LearningPathWithProgress, ProgramDefinition } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/auth-gate";
import { useProgramCompletion } from "@/hooks/use-program-completion";

export function HigherThinkingProgram({ program }: { program: ProgramDefinition }) {
  const [paths, setPaths] = useState<LearningPathWithProgress[]>([]);
  const [toggledMilestones, setToggledMilestones] = useState<string[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const { user } = useAuth();
  const { completeProgram, submitting } = useProgramCompletion(program);

  const loadPaths = useCallback(async () => {
    const params = new URLSearchParams();
    if (user?.email) params.set("userEmail", user.email);
    if (user?.name) params.set("userName", user.name);
    const response = await fetch(
      `/api/mind/learning-paths${params.toString() ? `?${params.toString()}` : ""}`
    );
    if (!response.ok) return;
    const data: LearningPathWithProgress[] = await response.json();
    setPaths(data ?? []);
  }, [user?.email, user?.name]);

  useEffect(() => {
    void loadPaths();
  }, [loadPaths]);

  const handleToggle = async (
    pathId: string,
    milestoneId: string,
    completed: boolean
  ) => {
    setToggling(milestoneId);
    const response = await fetch(
      `/api/mind/learning-paths/${pathId}/milestones/${milestoneId}/toggle`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed,
          userEmail: user?.email,
          userName: user?.name
        })
      }
    );
    if (response.ok) {
      const updatedPath: LearningPathWithProgress = await response.json();
      setPaths((prev) => prev.map((path) => (path.id === pathId ? updatedPath : path)));
      setToggledMilestones((prev) =>
        prev.includes(milestoneId) ? prev : [...prev, milestoneId]
      );
    }
    setToggling(null);
  };

  const handleComplete = async () => {
    if (toggledMilestones.length === 0) {
      alert("Bitte mindestens einen Milestone abhaken.");
      return;
    }
    await completeProgram({
      type: "higher-thinking",
      milestones: toggledMilestones
    });
    setToggledMilestones([]);
  };

  return (
    <div className="space-y-6">
      {paths.map((path) => (
        <article
          key={path.id}
          className="space-y-4 rounded-3xl border border-daisy-100 bg-white/90 p-5 shadow-sm"
        >
          <header className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-daisy-400">
                  {path.theme}
                </p>
                <h3 className="text-lg font-semibold text-gray-900">{path.title}</h3>
              </div>
              <Badge>{path.progressPercent}%</Badge>
            </div>
            <p className="text-sm text-gray-600">{path.description}</p>
            <div className="h-2 w-full rounded-full bg-daisy-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-daisy-200 to-daisy-500"
                style={{ width: `${path.progressPercent}%` }}
              />
            </div>
          </header>

          <div className="space-y-3">
            {path.milestones.map((milestone) => (
              <label
                key={milestone.id}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                  milestone.completed ? "border-daisy-400 bg-daisy-50" : "border-daisy-100 bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-daisy-500"
                  checked={milestone.completed}
                  disabled={toggling === milestone.id}
                  onChange={(event) =>
                    void handleToggle(path.id, milestone.id, event.target.checked)
                  }
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{milestone.title}</p>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
              </label>
            ))}
          </div>
        </article>
      ))}

      <Button onClick={handleComplete} disabled={submitting}>
        Higher Thinking Session abschließen
      </Button>
    </div>
  );
}
