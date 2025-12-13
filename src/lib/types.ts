export type ProgramCategoryName =
  | "mind"
  | "body"
  | "human"
  | "environment"
  | "business";

export type ProgramFrequencyName =
  | "daily"
  | "weekly"
  | "monthly"
  | "adhoc"
  | "block_only";

export type ProgramTypeName =
  | "routine"
  | "training"
  | "healing"
  | "social"
  | "business"
  | "spiritual"
  | "brain";

export type ProgramPriorityName = "core" | "optional";

export type ProgramStatusName = "active" | "archived" | "experimental";

export type ProgramStateIntent =
  | "love"
  | "happiness"
  | "pride"
  | "power"
  | "calm"
  | "focus"
  | "gratitude"
  | "energy";

export type ProgramTimeWindow =
  | "morning_block"
  | "midday_block"
  | "evening_block"
  | "business_block"
  | "family_block"
  | "focus_block";

export type ProgramStepType =
  | "read"
  | "write"
  | "meditate"
  | "move"
  | "speak"
  | "plan"
  | "timer"
  | "check"
  | "rating"
  | "question";

export type ProgramStepInputType =
  | "text"
  | "textarea"
  | "checkbox"
  | "slider"
  | "timer"
  | "rating"
  | "options";

export interface ProgramStepInputConfig {
  type: ProgramStepInputType;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  optionsRequireMinutes?: boolean;
  suffix?: string;
}

export interface ProgramRitualStep {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  stepType: ProgramStepType;
  input?: ProgramStepInputConfig;
  optional?: boolean;
}

export interface ProgramMetadata {
  type: ProgramTypeName;
  priority: ProgramPriorityName;
  status: ProgramStatusName;
  defaultTimeWindow?: ProgramTimeWindow;
  version: number;
}

export interface ProgramGoalsConfig {
  linkedGoalIds: string[];
  expectedOutcome?: string;
}

export interface ProgramStateRoleConfig {
  desiredState?: ProgramStateIntent;
  roleTags: string[];
  stateCheckBefore: boolean;
  stateCheckAfter: boolean;
}

export interface ProgramQualityMetric {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface ProgramQualityConfig {
  criteria: string[];
  metrics: ProgramQualityMetric[];
  requireFeasibilityCheck: boolean;
}

export interface ProgramResultQuestion {
  id: string;
  prompt: string;
  type: "text" | "tags";
  placeholder?: string;
}

export interface ProgramResultConfig {
  questions: ProgramResultQuestion[];
  enableLearningTags: boolean;
}

export interface ProgramXpDistribution {
  area: ProgramCategoryName;
  percentage: number;
}

export interface ProgramXpRulesConfig {
  baseValue: number;
  requireCompletion: boolean;
  minQualityScore?: number;
  customRuleLabel?: string;
  distribution: ProgramXpDistribution[];
}

export interface ProgramScheduleRule {
  block: ProgramTimeWindow;
  recurrence: ProgramFrequencyName;
  daysOfWeek?: number[];
}

export interface ProgramSchedulingConfig {
  blocks: ProgramScheduleRule[];
  ninetyDayTags: string[];
}

export interface ProgramRunnerConfig {
  resumeEnabled: boolean;
  showTimers: boolean;
}

export interface ProgramBlueprint {
  metadata: ProgramMetadata;
  goals: ProgramGoalsConfig;
  stateRole: ProgramStateRoleConfig;
  ritual: ProgramRitualStep[];
  quality: ProgramQualityConfig;
  result: ProgramResultConfig;
  xp: ProgramXpRulesConfig;
  scheduling: ProgramSchedulingConfig;
  runner: ProgramRunnerConfig;
}

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
  optionsRequireMinutes?: boolean;
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
  frequency: ProgramFrequencyName;
  durationMinutes: number;
  xpReward: number;
  mode: "single" | "flow";
  units: ProgramUnit[];
  blueprint: ProgramBlueprint;
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

export interface PerformanceChecklistItem {
  id: string;
  label: string;
  summary?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
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

export interface MindMeditationStep {
  id: string;
  flowId: string;
  title: string;
  description?: string | null;
  order: number;
  createdAt: string;
}

export interface MindMeditationFlow {
  id: string;
  title: string;
  subtitle?: string | null;
  summary?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  steps: MindMeditationStep[];
}

export type RequirementStatus = "open" | "in_progress" | "problem" | "done";
export type RequirementArea = "privat" | "finanzen" | "arbeit" | "staat";

export interface RequirementRecord {
  id: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  requester: string;
  cost: number;
  priority: number;
  xp: number;
  area: RequirementArea;
  status: RequirementStatus;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RequirementLogEntry {
  id: string;
  requirementId: string;
  content: string;
  createdAt: string;
  userId?: string | null;
}
