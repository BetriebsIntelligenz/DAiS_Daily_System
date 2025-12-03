"use client";

import type { ProgramDefinition } from "@/lib/types";
import { ProgramForm } from "./program-form";
import { ProgramRunner } from "./program-runner";
import { VisualizationTrainingProgram } from "./mind/visualization-training";
import { SmartGoalsProgram } from "./mind/smart-goals-program";
import { BrainTrainingProgram } from "./mind/brain-training-program";
import { HigherThinkingProgram } from "./mind/higher-thinking-program";
import { EmotionTrainingProgram } from "./mind/emotion-training-program";

type CustomRenderer = (program: ProgramDefinition) => JSX.Element;

const customMindRenderers: Record<string, CustomRenderer> = {
  visualisierungstraining: (program) => (
    <VisualizationTrainingProgram program={program} />
  ),
  "ziele-smart": (program) => <SmartGoalsProgram program={program} />,
  "brain-training": (program) => <BrainTrainingProgram program={program} />,
  "higher-thinking": (program) => <HigherThinkingProgram program={program} />,
  "emotion-training": (program) => <EmotionTrainingProgram program={program} />
};

export function ProgramContent({ program }: { program: ProgramDefinition }) {
  const render = customMindRenderers[program.slug];
  if (render) {
    return render(program);
  }
  if (program.blueprint?.ritual?.length) {
    return <ProgramRunner program={program} />;
  }
  return <ProgramForm program={program} />;
}
