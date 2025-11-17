export type ProgramCategoryName =
  | "mind"
  | "body"
  | "human"
  | "environment"
  | "business";

export type ExerciseType =
  | "checkbox"
  | "scale"
  | "multiselect"
  | "text"
  | "number"
  | "html";

export interface ExerciseConfig {
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: string[];
  options?: string[];
  placeholder?: string;
  richText?: boolean;
}

export interface ProgramExercise {
  id: string;
  label: string;
  description?: string;
  type: ExerciseType;
  config?: ExerciseConfig;
  xpValue: number;
}

export interface ProgramUnit {
  id: string;
  title: string;
  order: number;
  exercises: ProgramExercise[];
}

export interface ProgramDefinition {
  id: string;
  slug: string;
  code: string;
  name: string;
  summary: string;
  category: ProgramCategoryName;
  frequency: "daily" | "weekly" | "monthly" | "adhoc";
  durationMinutes: number;
  xpReward: number;
  mode: "single" | "flow";
  units: ProgramUnit[];
}

export interface RewardDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  active: boolean;
}

export interface JournalDefinition {
  id: string;
  name: string;
  type: "learn" | "success" | "gratitude";
  description: string;
}
