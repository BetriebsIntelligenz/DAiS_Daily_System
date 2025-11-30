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

export interface ProgramStackDefinition {
  id: string;
  slug: string;
  title: string;
  summary: string;
  programSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MindVisualizationAsset {
  id: string;
  title: string;
  imageData: string;
   order: number;
  createdAt: string;
}

export interface MindGoal {
  id: string;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  metricName?: string | null;
  targetValue?: number | null;
  unit?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MindGoalCheckin {
  id: string;
  goalId: string;
  progressPercent: number;
  selfAssessment?: string | null;
  readThrough: boolean;
  createdAt: string;
}

export interface MindGoalWithProgress extends MindGoal {
  latestProgress?: number;
  checkedToday: boolean;
  lastAssessment?: string | null;
  lastCheckinAt?: string | null;
  logs?: MindGoalCheckin[];
}

export interface BrainExerciseDefinition {
  id: string;
  title: string;
  focusArea: string;
  description: string;
  difficulty: number;
  durationMinutes: number;
  rating?: number | null;
  createdAt: string;
}

export interface BrainExerciseWithState extends BrainExerciseDefinition {
  doneToday: boolean;
  lastCompletedAt?: string | null;
}

export interface LearningMilestoneDefinition {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface LearningMilestoneWithState extends LearningMilestoneDefinition {
  completed: boolean;
  updatedAt?: string | null;
}

export interface LearningPathDefinition {
  id: string;
  title: string;
  theme: string;
  description: string;
  createdAt: string;
  milestones: LearningMilestoneDefinition[];
}

export interface LearningPathWithProgress extends LearningPathDefinition {
  milestones: LearningMilestoneWithState[];
  progressPercent: number;
}

export interface EmotionPracticeDefinition {
  id: string;
  emotion: string;
  summary: string;
  regulationSteps: string[];
  groundingPrompt?: string | null;
  createdAt: string;
}

export interface EmotionPracticeWithLogs extends EmotionPracticeDefinition {
  recentLogs: EmotionLogEntry[];
}

export interface EmotionLogEntry {
  id: string;
  emotionLabel: string;
  intensity: number;
  note?: string | null;
  createdAt: string;
}
