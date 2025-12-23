"use client";

import type { ProgramDefinition } from "@/lib/types";
import { ProgramForm } from "./program-form";
import { ProgramRunner } from "./program-runner";
import { VisualizationTrainingProgram } from "./mind/visualization-training";
import { SmartGoalsProgram } from "./mind/smart-goals-program";
import { BrainTrainingProgram } from "./mind/brain-training-program";
import { HigherThinkingProgram } from "./mind/higher-thinking-program";
import { EmotionTrainingProgram } from "./mind/emotion-training-program";
import { IncantationsProgram } from "./mind/incantations-program";
import { MeditationProgram } from "./mind/meditation-program";
import { DayPlanningProgram } from "./mind/day-planning-program";
import { WakeUpProgram } from "./mind/wake-up-program";
import { PerformanceChecklistProgram } from "./mind/performance-checklist-program";
import { HouseholdCardsProgram } from "./environment/household-cards-program";
import { DailyHumanChecklist } from "./human/daily-human-checklist";
import { ReadingProgram } from "./mind/reading-program";

type CustomRenderer = (program: ProgramDefinition) => JSX.Element;

const customMindRenderers: Record<string, CustomRenderer> = {
  visualisierungstraining: (program) => (
    <VisualizationTrainingProgram program={program} />
  ),
  "ziele-smart": (program) => <SmartGoalsProgram program={program} />,
  "brain-training": (program) => <BrainTrainingProgram program={program} />,
  "higher-thinking": (program) => <HigherThinkingProgram program={program} />,
  "emotion-training": (program) => <EmotionTrainingProgram program={program} />,
  lesen: (program) => <ReadingProgram program={program} />,
  "mm1-incantations": (program) => <IncantationsProgram program={program} />,
  meditation: (program) => <MeditationProgram program={program} />,
  "mm5-day-planning": (program) => <DayPlanningProgram program={program} />,
  "wake-up-program": (program) => <WakeUpProgram program={program} />,
  "performance-checklist": (program) => <PerformanceChecklistProgram program={program} />,
  "household-cards": (program) => <HouseholdCardsProgram program={program} />,
  "daily-checklist-human": (program) => <DailyHumanChecklist program={program} />
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
