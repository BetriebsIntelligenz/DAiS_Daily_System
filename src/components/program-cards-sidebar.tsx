"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HOUSEHOLD_WEEKDAYS, formatWeekday } from "@/lib/household";
import type {
  BrainExerciseWithState,
  EmotionPracticeWithLogs,
  HouseholdCardDefinition,
  HouseholdTaskDefinition,
  LearningPathWithProgress,
  MindGoalWithProgress,
  MindMeditationFlow,
  MindReadingBook,
  MindVisualizationAsset,
  PerformanceChecklistItem,
  ProgramDefinition,
  ProgramExercise
} from "@/lib/types";

export type ProgramCardsSection =
  | "visuals"
  | "performance"
  | "reading"
  | "household"
  | "goals"
  | "brain"
  | "learning"
  | "emotion"
  | "meditation"
  | "program_settings";

interface ProgramCardsSidebarProps {
  open: boolean;
  onClose: () => void;
  sections: ProgramCardsSection[];
  program?: ProgramDefinition;
  title?: string;
}

export function ProgramCardsSidebar({
  open,
  onClose,
  sections,
  program,
  title = "Cards Einstellungen"
}: ProgramCardsSidebarProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Sidebar schließen"
        onClick={onClose}
        className="absolute inset-0 bg-[#050a1f]/60 backdrop-blur"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-hidden rounded-l-[36px] border-l-4 border-white/60 bg-gradient-to-b from-[#131f47]/95 via-[#2c3f9a]/90 to-[#6d5ce0]/90 text-white shadow-arcade">
        <header className="flex items-center justify-between border-b border-white/15 px-6 py-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#ffd879]">
              Edit
            </p>
            <h2 className="text-2xl font-semibold uppercase tracking-[0.2em]">
              {title}
            </h2>
          </div>
          <Button variant="outline" type="button" onClick={onClose}>
            <X className="h-4 w-4" />
            Schließen
          </Button>
        </header>
        <div className="h-full overflow-y-auto px-6 pb-10 pt-6">
          <CardsSettingsPanel sections={sections} program={program} />
        </div>
      </aside>
    </div>
  );
}

type SidebarFieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "toggle"
  | "scale"
  | "multiselect"
  | "select"
  | "date";

interface SidebarExerciseDraft {
  id?: string;
  label: string;
  description: string;
  fieldType: SidebarFieldType;
  xpValue: number;
  placeholder: string;
  optionsText: string;
  scaleMin: number;
  scaleMax: number;
}

interface SidebarUnitDraft {
  id?: string;
  title: string;
  order: number;
  exercises: SidebarExerciseDraft[];
}

interface SidebarProgramDraft {
  id: string;
  name: string;
  slug: string;
  code: string;
  summary: string;
  category: ProgramDefinition["category"];
  frequency: ProgramDefinition["frequency"];
  mode: ProgramDefinition["mode"];
  durationMinutes: number;
  xpReward: number;
  units: SidebarUnitDraft[];
}

const CATEGORY_OPTIONS: ProgramDefinition["category"][] = [
  "mind",
  "body",
  "human",
  "environment",
  "business"
];
const FREQUENCY_OPTIONS: ProgramDefinition["frequency"][] = [
  "daily",
  "weekly",
  "monthly",
  "adhoc",
  "block_only"
];
const MODE_OPTIONS: ProgramDefinition["mode"][] = ["single", "flow"];

function normalizeProgramSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function createEmptySidebarExercise(): SidebarExerciseDraft {
  return {
    label: "",
    description: "",
    fieldType: "text",
    xpValue: 100,
    placeholder: "",
    optionsText: "",
    scaleMin: 1,
    scaleMax: 5
  };
}

function createEmptySidebarUnit(order: number): SidebarUnitDraft {
  return {
    title: `Unit ${order}`,
    order,
    exercises: [createEmptySidebarExercise()]
  };
}

function inferSidebarFieldType(exercise: ProgramExercise): SidebarFieldType {
  const variant = exercise.config?.inputVariant;
  if (exercise.type === "checkbox") {
    return variant === "toggle" ? "toggle" : "checkbox";
  }
  if (exercise.type === "multiselect") {
    return exercise.config?.singleSelect ? "select" : "multiselect";
  }
  if (exercise.type === "scale") {
    return "scale";
  }
  if (exercise.type === "number") {
    return "number";
  }
  if (exercise.type === "html") {
    return "textarea";
  }
  if (exercise.type === "text") {
    if (variant === "date") {
      return "date";
    }
    if (variant === "text") {
      return "text";
    }
    return "textarea";
  }

  return "text";
}

function programToSidebarDraft(program: ProgramDefinition): SidebarProgramDraft {
  return {
    id: program.id,
    name: program.name,
    slug: program.slug,
    code: program.code,
    summary: program.summary,
    category: program.category,
    frequency: program.frequency,
    mode: program.mode,
    durationMinutes: program.durationMinutes,
    xpReward: program.xpReward,
    units:
      program.units.length > 0
        ? program.units
            .slice()
            .sort((left, right) => left.order - right.order)
            .map((unit, unitIndex) => ({
              id: unit.id,
              title: unit.title,
              order: unit.order || unitIndex + 1,
              exercises:
                unit.exercises.length > 0
                  ? unit.exercises.map((exercise) => ({
                      id: exercise.id,
                      label: exercise.label,
                      description: exercise.description ?? "",
                      fieldType: inferSidebarFieldType(exercise),
                      xpValue: exercise.xpValue,
                      placeholder: exercise.config?.placeholder ?? "",
                      optionsText: Array.isArray(exercise.config?.options)
                        ? exercise.config.options.join("\n")
                        : "",
                      scaleMin: Number(exercise.config?.scaleMin ?? 1),
                      scaleMax: Number(exercise.config?.scaleMax ?? 5)
                    }))
                  : [createEmptySidebarExercise()]
            }))
        : [createEmptySidebarUnit(1)]
  };
}

function sidebarExerciseToPayload(exercise: SidebarExerciseDraft) {
  const options = exercise.optionsText
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const basePayload = {
    label: exercise.label.trim(),
    description: exercise.description.trim() || undefined,
    xpValue: Math.max(0, Math.round(Number(exercise.xpValue) || 0))
  };

  switch (exercise.fieldType) {
    case "textarea":
      return {
        ...basePayload,
        type: "html" as const,
        config: {
          inputVariant: "textarea",
          placeholder: exercise.placeholder.trim() || undefined
        }
      };
    case "number":
      return {
        ...basePayload,
        type: "number" as const,
        config: {
          placeholder: exercise.placeholder.trim() || undefined
        }
      };
    case "checkbox":
      return { ...basePayload, type: "checkbox" as const, config: {} };
    case "toggle":
      return {
        ...basePayload,
        type: "checkbox" as const,
        config: { inputVariant: "toggle" }
      };
    case "scale":
      return {
        ...basePayload,
        type: "scale" as const,
        config: {
          scaleMin: Math.round(Number(exercise.scaleMin) || 1),
          scaleMax: Math.round(Number(exercise.scaleMax) || 5)
        }
      };
    case "multiselect":
      return {
        ...basePayload,
        type: "multiselect" as const,
        config: {
          options,
          singleSelect: false
        }
      };
    case "select":
      return {
        ...basePayload,
        type: "multiselect" as const,
        config: {
          options,
          singleSelect: true
        }
      };
    case "date":
      return {
        ...basePayload,
        type: "text" as const,
        config: { inputVariant: "date" }
      };
    case "text":
    default:
      return {
        ...basePayload,
        type: "text" as const,
        config: {
          inputVariant: "text",
          placeholder: exercise.placeholder.trim() || undefined
        }
      };
  }
}

function CardsSettingsPanel({
  sections,
  program
}: {
  sections: ProgramCardsSection[];
  program?: ProgramDefinition;
}) {
  const sectionSet = useMemo(() => new Set(sections), [sections]);
  const hasSection = (section: ProgramCardsSection) => sectionSet.has(section);

  const [visualAssets, setVisualAssets] = useState<MindVisualizationAsset[]>([]);
  const [visualTitle, setVisualTitle] = useState("");
  const [visualDataUrl, setVisualDataUrl] = useState<string | null>(null);

  const [performanceItems, setPerformanceItems] = useState<PerformanceChecklistItem[]>(
    []
  );
  const [performanceForm, setPerformanceForm] = useState({ label: "", summary: "" });
  const [editingPerformanceItem, setEditingPerformanceItem] =
    useState<PerformanceChecklistItem | null>(null);

  const [readingBooks, setReadingBooks] = useState<MindReadingBook[]>([]);
  const [readingBookForm, setReadingBookForm] = useState({ title: "", author: "" });
  const [editingReadingBook, setEditingReadingBook] = useState<MindReadingBook | null>(
    null
  );
  const [readingBookError, setReadingBookError] = useState<string | null>(null);
  const [goals, setGoals] = useState<MindGoalWithProgress[]>([]);
  const [goalForm, setGoalForm] = useState({
    title: "",
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    timeBound: "",
    metricName: "",
    targetValue: "",
    unit: "",
    targetDate: ""
  });
  const [editingGoal, setEditingGoal] = useState<MindGoalWithProgress | null>(null);
  const [goalProgress, setGoalProgress] = useState(50);
  const [goalLogText, setGoalLogText] = useState("");
  const [logsModalGoal, setLogsModalGoal] = useState<MindGoalWithProgress | null>(null);
  const [brainExercises, setBrainExercises] = useState<BrainExerciseWithState[]>([]);
  const [brainForm, setBrainForm] = useState({
    title: "",
    focusArea: "",
    description: "",
    difficulty: 3,
    durationMinutes: 5,
    rating: 4
  });
  const [learningPaths, setLearningPaths] = useState<LearningPathWithProgress[]>([]);
  const [pathForm, setPathForm] = useState({
    title: "",
    theme: "",
    description: "",
    milestones: ""
  });
  const [emotionPractices, setEmotionPractices] = useState<EmotionPracticeWithLogs[]>([]);
  const [emotionForm, setEmotionForm] = useState({
    emotion: "",
    summary: "",
    regulationSteps: "",
    groundingPrompt: ""
  });
  const [meditations, setMeditations] = useState<MindMeditationFlow[]>([]);
  const [meditationForm, setMeditationForm] = useState({
    title: "",
    subtitle: "",
    summary: ""
  });
  const [editingMeditation, setEditingMeditation] = useState<MindMeditationFlow | null>(
    null
  );
  const [meditationEditForm, setMeditationEditForm] = useState({
    title: "",
    subtitle: "",
    summary: ""
  });
  const [stepDrafts, setStepDrafts] = useState<
    Record<string, { title: string; description: string }>
  >({});

  const [householdTasks, setHouseholdTasks] = useState<HouseholdTaskDefinition[]>([]);
  const [householdCards, setHouseholdCards] = useState<HouseholdCardDefinition[]>([]);
  const [householdTaskLabel, setHouseholdTaskLabel] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [householdCardForm, setHouseholdCardForm] = useState({
    title: "",
    summary: "",
    weekday: 1,
    taskIds: [] as string[]
  });
  const [editingHouseholdCard, setEditingHouseholdCard] =
    useState<HouseholdCardDefinition | null>(null);
  const [householdAdminError, setHouseholdAdminError] = useState<string | null>(
    null
  );
  const [programDraft, setProgramDraft] = useState<SidebarProgramDraft | null>(
    program ? programToSidebarDraft(program) : null
  );
  const [programSaveLoading, setProgramSaveLoading] = useState(false);
  const [programSaveError, setProgramSaveError] = useState<string | null>(null);
  const [programSaveSuccess, setProgramSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!program) {
      setProgramDraft(null);
      return;
    }
    setProgramDraft(programToSidebarDraft(program));
  }, [program]);

  const refreshCardsData = async () => {
    const loadJson = async (path: string) => {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          console.error(`Request to ${path} failed`, response.status);
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error(`Request to ${path} failed`, error);
        return [];
      }
    };

    const [
      visuals,
      goalsPayload,
      brainPayload,
      pathsPayload,
      emotionPayload,
      meditationPayload,
      readingBooksPayload,
      performanceChecklistPayload,
      householdPayload
    ] = await Promise.all([
      loadJson("/api/mind/visuals"),
      loadJson("/api/mind/goals"),
      loadJson("/api/mind/brain-exercises"),
      loadJson("/api/mind/learning-paths"),
      loadJson("/api/mind/emotions"),
      loadJson("/api/mind/meditations"),
      loadJson("/api/mind/reading/books"),
      loadJson("/api/mind/performance-checklist"),
      loadJson("/api/environment/household/cards")
    ]);

    setVisualAssets(Array.isArray(visuals) ? visuals : []);
    setGoals(Array.isArray(goalsPayload) ? goalsPayload : []);
    setBrainExercises(Array.isArray(brainPayload) ? brainPayload : []);
    setLearningPaths(Array.isArray(pathsPayload) ? pathsPayload : []);
    setEmotionPractices(Array.isArray(emotionPayload) ? emotionPayload : []);
    setMeditations(Array.isArray(meditationPayload) ? meditationPayload : []);
    if (Array.isArray(meditationPayload)) {
      setStepDrafts((prev) => {
        const next: Record<string, { title: string; description: string }> = {};
        meditationPayload.forEach((flow: MindMeditationFlow) => {
          next[flow.id] = prev[flow.id] ?? { title: "", description: "" };
        });
        return next;
      });
    }

    if (readingBooksPayload && typeof readingBooksPayload === "object") {
      const payload = readingBooksPayload as { books?: unknown };
      setReadingBooks(
        Array.isArray(payload.books) ? (payload.books as MindReadingBook[]) : []
      );
    } else if (Array.isArray(readingBooksPayload)) {
      setReadingBooks(readingBooksPayload as MindReadingBook[]);
    } else {
      setReadingBooks([]);
    }

    setPerformanceItems(
      Array.isArray(performanceChecklistPayload)
        ? (performanceChecklistPayload as PerformanceChecklistItem[])
        : []
    );

    if (householdPayload && typeof householdPayload === "object") {
      const payload = householdPayload as { cards?: unknown; tasks?: unknown };
      setHouseholdCards(
        Array.isArray(payload.cards)
          ? (payload.cards as HouseholdCardDefinition[])
          : []
      );
      setHouseholdTasks(
        Array.isArray(payload.tasks)
          ? (payload.tasks as HouseholdTaskDefinition[])
          : []
      );
    }
  };

  useEffect(() => {
    void refreshCardsData();
  }, []);

  const meditationStepCount = useMemo(
    () => meditations.reduce((sum, flow) => sum + flow.steps.length, 0),
    [meditations]
  );
  const orderedMeditations = useMemo(
    () => [...meditations].sort((a, b) => a.order - b.order),
    [meditations]
  );

  const handleVisualUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!visualTitle || !visualDataUrl) {
      alert("Bitte Titel und Bild wählen.");
      return;
    }
    await fetch("/api/mind/visuals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: visualTitle, imageData: visualDataUrl })
    });
    setVisualTitle("");
    setVisualDataUrl(null);
    await refreshCardsData();
  };

  const handleVisualDelete = async (id: string) => {
    await fetch("/api/mind/visuals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    await refreshCardsData();
  };

  const saveVisualOrder = async (assets: MindVisualizationAsset[]) => {
    setVisualAssets(assets);
    await fetch("/api/mind/visuals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: assets.map((asset) => asset.id) })
    });
    await refreshCardsData();
  };

  const moveVisual = (id: string, direction: "up" | "down") => {
    setVisualAssets((prev) => {
      const index = prev.findIndex((asset) => asset.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      void saveVisualOrder(next);
      return next;
    });
  };

  const resetPerformanceForm = () => {
    setPerformanceForm({ label: "", summary: "" });
    setEditingPerformanceItem(null);
  };

  const handlePerformanceSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!performanceForm.label.trim()) {
      alert("Bitte Label setzen.");
      return;
    }
    const endpoint = "/api/mind/performance-checklist";
    const method = editingPerformanceItem ? "PUT" : "POST";
    const payload = editingPerformanceItem
      ? { id: editingPerformanceItem.id, ...performanceForm }
      : performanceForm;
    await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    resetPerformanceForm();
    await refreshCardsData();
  };

  const handlePerformanceDelete = async (id: string) => {
    if (!window.confirm("Eintrag wirklich löschen?")) return;
    await fetch("/api/mind/performance-checklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    await refreshCardsData();
  };

  const savePerformanceOrder = async (items: PerformanceChecklistItem[]) => {
    await fetch("/api/mind/performance-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: items.map((item) => item.id) })
    });
    await refreshCardsData();
  };

  const movePerformanceItem = (id: string, direction: "up" | "down") => {
    setPerformanceItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      void savePerformanceOrder(next);
      return next;
    });
  };

  const handleGoalSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch("/api/mind/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...goalForm,
        targetValue: goalForm.targetValue ? Number(goalForm.targetValue) : undefined
      })
    });
    setGoalForm({
      title: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",
      metricName: "",
      targetValue: "",
      unit: "",
      targetDate: ""
    });
    await refreshCardsData();
  };

  const openGoalEdit = (goal: MindGoalWithProgress) => {
    setEditingGoal(goal);
    setGoalForm({
      title: goal.title,
      specific: goal.specific,
      measurable: goal.measurable,
      achievable: goal.achievable,
      relevant: goal.relevant,
      timeBound: goal.timeBound,
      metricName: goal.metricName ?? "",
      targetValue: goal.targetValue?.toString() ?? "",
      unit: goal.unit ?? "",
      targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : ""
    });
    setGoalProgress(goal.latestProgress ?? 50);
    setGoalLogText("");
  };

  const handleGoalUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingGoal) return;

    await fetch("/api/mind/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingGoal.id,
        ...goalForm,
        targetValue: goalForm.targetValue ? Number(goalForm.targetValue) : null,
        latestProgress: goalProgress,
        selfAssessment: goalLogText
      })
    });
    setEditingGoal(null);
    setGoalForm({
      title: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",
      metricName: "",
      targetValue: "",
      unit: "",
      targetDate: ""
    });
    setGoalProgress(50);
    setGoalLogText("");
    await refreshCardsData();
  };

  const handleBrainSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch("/api/mind/brain-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...brainForm,
        difficulty: Number(brainForm.difficulty),
        durationMinutes: Number(brainForm.durationMinutes),
        rating: Number(brainForm.rating)
      })
    });
    setBrainForm({
      title: "",
      focusArea: "",
      description: "",
      difficulty: 3,
      durationMinutes: 5,
      rating: 4
    });
    await refreshCardsData();
  };

  const handlePathSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch("/api/mind/learning-paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pathForm)
    });
    setPathForm({
      title: "",
      theme: "",
      description: "",
      milestones: ""
    });
    await refreshCardsData();
  };

  const handleEmotionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetch("/api/mind/emotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emotionForm)
    });
    setEmotionForm({
      emotion: "",
      summary: "",
      regulationSteps: "",
      groundingPrompt: ""
    });
    await refreshCardsData();
  };

  const handleMeditationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!meditationForm.title.trim()) {
      alert("Bitte einen Meditationstitel angeben.");
      return;
    }
    await fetch("/api/mind/meditations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meditationForm)
    });
    setMeditationForm({ title: "", subtitle: "", summary: "" });
    await refreshCardsData();
  };

  const openMeditationEdit = (flow: MindMeditationFlow) => {
    setEditingMeditation(flow);
    setMeditationEditForm({
      title: flow.title,
      subtitle: flow.subtitle ?? "",
      summary: flow.summary ?? ""
    });
  };

  const handleMeditationUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingMeditation) return;
    await fetch("/api/mind/meditations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingMeditation.id,
        ...meditationEditForm
      })
    });
    setEditingMeditation(null);
    setMeditationEditForm({ title: "", subtitle: "", summary: "" });
    await refreshCardsData();
  };

  const cancelMeditationEdit = () => {
    setEditingMeditation(null);
    setMeditationEditForm({ title: "", subtitle: "", summary: "" });
  };

  const handleMeditationDelete = async (flowId: string) => {
    if (!window.confirm("Meditation wirklich löschen?")) return;
    await fetch("/api/mind/meditations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: flowId })
    });
    await refreshCardsData();
  };

  const saveMeditationOrder = async (flowsList: MindMeditationFlow[]) => {
    await fetch("/api/mind/meditations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: flowsList.map((flow) => flow.id) })
    });
    await refreshCardsData();
  };

  const moveMeditation = (flowId: string, direction: "up" | "down") => {
    setMeditations((prev) => {
      const index = prev.findIndex((flow) => flow.id === flowId);
      if (index === -1) return prev;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      void saveMeditationOrder(next);
      return next;
    });
  };

  const updateStepDraft = (
    flowId: string,
    partial: { title?: string; description?: string }
  ) => {
    setStepDrafts((prev) => ({
      ...prev,
      [flowId]: {
        title: partial.title ?? prev[flowId]?.title ?? "",
        description: partial.description ?? prev[flowId]?.description ?? ""
      }
    }));
  };

  const handleStepSubmit =
    (flowId: string) => async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const draft = stepDrafts[flowId];
      const title = draft?.title?.trim();
      if (!title) {
        alert("Step Titel eintragen.");
        return;
      }
      await fetch(`/api/mind/meditations/${flowId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: draft?.description ?? ""
        })
      });
      setStepDrafts((prev) => ({
        ...prev,
        [flowId]: { title: "", description: "" }
      }));
      await refreshCardsData();
    };

  const handleStepDelete = async (flowId: string, stepId: string) => {
    if (!window.confirm("Step entfernen?")) return;
    await fetch(`/api/mind/meditations/${flowId}/steps/${stepId}`, {
      method: "DELETE"
    });
    await refreshCardsData();
  };

  const persistStepOrder = async (
    flowId: string,
    steps: MindMeditationFlow["steps"]
  ) => {
    await fetch(`/api/mind/meditations/${flowId}/steps/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: steps.map((step) => step.id) })
    });
    await refreshCardsData();
  };

  const moveMeditationStep = (
    flowId: string,
    stepId: string,
    direction: "up" | "down"
  ) => {
    setMeditations((prev) => {
      const flowIndex = prev.findIndex((flow) => flow.id === flowId);
      if (flowIndex === -1) return prev;
      const flow = prev[flowIndex];
      const stepIndex = flow.steps.findIndex((step) => step.id === stepId);
      if (stepIndex === -1) return prev;
      const target = direction === "up" ? stepIndex - 1 : stepIndex + 1;
      if (target < 0 || target >= flow.steps.length) return prev;
      const updatedSteps = [...flow.steps];
      const [item] = updatedSteps.splice(stepIndex, 1);
      updatedSteps.splice(target, 0, item);
      const next = [...prev];
      next[flowIndex] = { ...flow, steps: updatedSteps };
      void persistStepOrder(flowId, updatedSteps);
      return next;
    });
  };

  const resetReadingBookForm = () => {
    setReadingBookForm({ title: "", author: "" });
    setEditingReadingBook(null);
    setReadingBookError(null);
  };

  const handleReadingBookSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const title = readingBookForm.title.trim();
    const author = readingBookForm.author.trim();
    if (!title) {
      setReadingBookError("Bitte einen Buchtitel eintragen.");
      return;
    }
    setReadingBookError(null);
    const method = editingReadingBook ? "PUT" : "POST";
    const payload = editingReadingBook
      ? { id: editingReadingBook.id, title, author }
      : { title, author };
    try {
      const response = await fetch("/api/mind/reading/books", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Buch konnte nicht gespeichert werden.");
      }
      resetReadingBookForm();
      await refreshCardsData();
    } catch (requestError) {
      console.error("Failed to save reading book", requestError);
      setReadingBookError(
        requestError instanceof Error
          ? requestError.message
          : "Buch konnte nicht gespeichert werden."
      );
    }
  };

  const handleReadingBookDelete = async (bookId: string) => {
    if (!window.confirm("Buch wirklich löschen?")) return;
    try {
      const response = await fetch("/api/mind/reading/books", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bookId })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Buch konnte nicht gelöscht werden.");
      }
      if (editingReadingBook?.id === bookId) {
        resetReadingBookForm();
      }
      await refreshCardsData();
    } catch (requestError) {
      console.error("Failed to delete reading book", requestError);
      setReadingBookError(
        requestError instanceof Error
          ? requestError.message
          : "Buch konnte nicht gelöscht werden."
      );
    }
  };

  const parseHouseholdErrorResponse = async (response: Response) => {
    try {
      const payload = await response.json();
      if (payload && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      // ignore
    }
    return `${response.status} ${response.statusText}`.trim();
  };

  const handleHouseholdMutationError = (error: unknown, fallbackMessage: string) => {
    console.error(fallbackMessage, error);
    const message =
      error instanceof Error ? error.message || fallbackMessage : fallbackMessage;
    setHouseholdAdminError(message);
  };

  const resetHouseholdTaskForm = () => {
    setHouseholdTaskLabel("");
    setEditingTaskId(null);
  };

  const handleHouseholdTaskSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const label = householdTaskLabel.trim();
    if (!label) {
      alert("Bitte Task Label eingeben.");
      return;
    }
    const endpoint = "/api/environment/household/tasks";
    const payload =
      editingTaskId === null
        ? { label }
        : {
            id: editingTaskId,
            label
          };
    try {
      const response = await fetch(endpoint, {
        method: editingTaskId === null ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await parseHouseholdErrorResponse(response);
        throw new Error(message);
      }
      resetHouseholdTaskForm();
      setHouseholdAdminError(null);
      await refreshCardsData();
    } catch (error) {
      handleHouseholdMutationError(
        error,
        "Haushalts-Task konnte nicht gespeichert werden."
      );
    }
  };

  const persistHouseholdTaskOrder = async (tasks: HouseholdTaskDefinition[]) => {
    try {
      const response = await fetch("/api/environment/household/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: tasks.map((task) => task.id) })
      });
      if (!response.ok) {
        const message = await parseHouseholdErrorResponse(response);
        throw new Error(message);
      }
      setHouseholdAdminError(null);
      await refreshCardsData();
    } catch (error) {
      handleHouseholdMutationError(
        error,
        "Aufgaben-Reihenfolge konnte nicht gespeichert werden."
      );
    }
  };

  const moveHouseholdTask = (taskId: string, direction: "up" | "down") => {
    setHouseholdTasks((prev) => {
      const index = prev.findIndex((task) => task.id === taskId);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      void persistHouseholdTaskOrder(next);
      return next;
    });
  };

  const deleteHouseholdTask = async (taskId: string) => {
    if (!window.confirm("Task wirklich löschen? Zuweisungen werden entfernt.")) return;
    try {
      const response = await fetch("/api/environment/household/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId })
      });
      if (!response.ok) {
        const message = await parseHouseholdErrorResponse(response);
        throw new Error(message);
      }
      setHouseholdAdminError(null);
      await refreshCardsData();
    } catch (error) {
      handleHouseholdMutationError(error, "Task konnte nicht gelöscht werden.");
    }
  };

  const resetHouseholdCardForm = () => {
    setEditingHouseholdCard(null);
    setHouseholdCardForm({ title: "", summary: "", weekday: 1, taskIds: [] });
  };

  const startEditHouseholdCard = (card: HouseholdCardDefinition) => {
    setEditingHouseholdCard(card);
    setHouseholdCardForm({
      title: card.title,
      summary: card.summary ?? "",
      weekday: card.weekday,
      taskIds: card.tasks.map((assignment) => assignment.taskId)
    });
  };

  const toggleHouseholdCardTask = (taskId: string) => {
    setHouseholdCardForm((prev) => {
      const exists = prev.taskIds.includes(taskId);
      return {
        ...prev,
        taskIds: exists
          ? prev.taskIds.filter((entry) => entry !== taskId)
          : [...prev.taskIds, taskId]
      };
    });
  };

  const handleHouseholdCardSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!householdCardForm.title.trim()) {
      alert("Bitte Kartentitel ausfüllen.");
      return;
    }
    const payload = {
      title: householdCardForm.title.trim(),
      summary: householdCardForm.summary.trim(),
      weekday: householdCardForm.weekday,
      taskIds: householdCardForm.taskIds
    };
    try {
      const response = await fetch("/api/environment/household/cards", {
        method: editingHouseholdCard ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingHouseholdCard ? { id: editingHouseholdCard.id, ...payload } : payload
        )
      });
      if (!response.ok) {
        const message = await parseHouseholdErrorResponse(response);
        throw new Error(message);
      }
      resetHouseholdCardForm();
      setHouseholdAdminError(null);
      await refreshCardsData();
    } catch (error) {
      handleHouseholdMutationError(
        error,
        "Haushaltskarte konnte nicht gespeichert werden."
      );
    }
  };

  const deleteHouseholdCard = async (cardId: string) => {
    if (!window.confirm("Karte wirklich löschen?")) return;
    try {
      const response = await fetch("/api/environment/household/cards", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId })
      });
      if (!response.ok) {
        const message = await parseHouseholdErrorResponse(response);
        throw new Error(message);
      }
      if (editingHouseholdCard?.id === cardId) {
        resetHouseholdCardForm();
      }
      setHouseholdAdminError(null);
      await refreshCardsData();
    } catch (error) {
      handleHouseholdMutationError(error, "Haushaltskarte konnte nicht gelöscht werden.");
    }
  };

  const updateProgramUnit = (
    unitIndex: number,
    updater: (unit: SidebarUnitDraft) => SidebarUnitDraft
  ) => {
    setProgramDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        units: prev.units.map((unit, index) =>
          index === unitIndex ? updater(unit) : unit
        )
      };
    });
  };

  const validateProgramDraft = (draft: SidebarProgramDraft) => {
    if (!draft.name.trim()) {
      return "Programmtitel ist erforderlich.";
    }
    if (draft.units.length === 0) {
      return "Mindestens eine Unit ist erforderlich.";
    }
    for (const unit of draft.units) {
      if (!unit.title.trim()) {
        return "Jede Unit benötigt einen Titel.";
      }
      if (unit.exercises.length === 0) {
        return `Unit \"${unit.title}\" benötigt mindestens ein Feld.`;
      }
      for (const exercise of unit.exercises) {
        if (!exercise.label.trim()) {
          return `Jedes Feld in Unit \"${unit.title}\" benötigt ein Label.`;
        }
        if (
          (exercise.fieldType === "select" || exercise.fieldType === "multiselect") &&
          exercise.optionsText
            .split("\n")
            .map((entry) => entry.trim())
            .filter(Boolean).length === 0
        ) {
          return `Feld \"${exercise.label}\" benötigt mindestens eine Option.`;
        }
      }
    }

    return null;
  };

  const saveProgramSettings = async () => {
    if (!programDraft) {
      return;
    }

    const validationError = validateProgramDraft(programDraft);
    if (validationError) {
      setProgramSaveError(validationError);
      setProgramSaveSuccess(null);
      return;
    }

    const payload = {
      id: programDraft.id,
      name: programDraft.name.trim(),
      slug: normalizeProgramSlug(programDraft.slug.trim() || programDraft.name),
      code: (programDraft.code.trim() || programDraft.name.slice(0, 3)).toUpperCase(),
      summary: programDraft.summary.trim(),
      category: programDraft.category,
      frequency: programDraft.frequency,
      mode: programDraft.mode,
      durationMinutes: Math.max(1, Math.round(Number(programDraft.durationMinutes) || 1)),
      xpReward: Math.max(0, Math.round(Number(programDraft.xpReward) || 0)),
      units: programDraft.units.map((unit, unitIndex) => ({
        id: unit.id,
        title: unit.title.trim(),
        order: unitIndex + 1,
        exercises: unit.exercises.map((exercise) => sidebarExerciseToPayload(exercise))
      }))
    };

    setProgramSaveLoading(true);
    setProgramSaveError(null);
    setProgramSaveSuccess(null);
    try {
      const response = await fetch("/api/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Card-Einstellungen konnten nicht gespeichert werden.");
      }

      const updatedProgram = (await response.json()) as ProgramDefinition;
      setProgramDraft(programToSidebarDraft(updatedProgram));
      setProgramSaveSuccess("Card-Einstellungen gespeichert.");
    } catch (error) {
      console.error("Failed to save program settings", error);
      setProgramSaveError(
        error instanceof Error
          ? error.message
          : "Card-Einstellungen konnten nicht gespeichert werden."
      );
    } finally {
      setProgramSaveLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {hasSection("program_settings") && (
        <article
          id="cards-program-settings"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Programm Card
            </p>
            <h3 className="text-xl font-semibold">
              {programDraft?.name ?? program?.name ?? "Card Einstellungen"}
            </h3>
            <p className="text-sm text-gray-500">
              Bearbeite die gleichen Kern-Card-Einstellungen direkt aus der Einzelansicht.
            </p>
            {programSaveError && (
              <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {programSaveError}
              </p>
            )}
            {programSaveSuccess && (
              <p className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                {programSaveSuccess}
              </p>
            )}
          </header>

          {programDraft ? (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={programDraft.name}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev ? { ...prev, name: event.target.value } : prev
                    )
                  }
                  placeholder="Programmtitel"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={programDraft.code}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev ? { ...prev, code: event.target.value.toUpperCase() } : prev
                    )
                  }
                  placeholder="Code (z.B. BU1)"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={programDraft.slug}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev ? { ...prev, slug: normalizeProgramSlug(event.target.value) } : prev
                    )
                  }
                  placeholder="Slug"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <select
                  value={programDraft.category}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            category: event.target.value as ProgramDefinition["category"]
                          }
                        : prev
                    )
                  }
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={programDraft.frequency}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            frequency: event.target.value as ProgramDefinition["frequency"]
                          }
                        : prev
                    )
                  }
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                >
                  {FREQUENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  value={programDraft.mode}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev
                        ? { ...prev, mode: event.target.value as ProgramDefinition["mode"] }
                        : prev
                    )
                  }
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                >
                  {MODE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={programDraft.durationMinutes}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            durationMinutes: Math.max(1, Number(event.target.value) || 1)
                          }
                        : prev
                    )
                  }
                  placeholder="Dauer (Minuten)"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  type="number"
                  value={programDraft.xpReward}
                  onChange={(event) =>
                    setProgramDraft((prev) =>
                      prev
                        ? { ...prev, xpReward: Math.max(0, Number(event.target.value) || 0) }
                        : prev
                    )
                  }
                  placeholder="XP Reward"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </div>

              <textarea
                value={programDraft.summary}
                onChange={(event) =>
                  setProgramDraft((prev) =>
                    prev ? { ...prev, summary: event.target.value } : prev
                  )
                }
                placeholder="Beschreibung"
                className="min-h-[120px] w-full rounded-2xl border border-daisy-200 px-4 py-3"
              />

              <div className="space-y-3">
                {programDraft.units.map((unit, unitIndex) => (
                  <section
                    key={`${unit.id ?? "new"}-${unitIndex}`}
                    className="rounded-2xl border border-daisy-100 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={unit.title}
                        onChange={(event) =>
                          updateProgramUnit(unitIndex, (current) => ({
                            ...current,
                            title: event.target.value
                          }))
                        }
                        placeholder="Unit Titel"
                        className="min-w-[220px] flex-1 rounded-xl border border-daisy-200 px-3 py-2"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={programDraft.units.length <= 1}
                        onClick={() =>
                          setProgramDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  units: prev.units.filter((_, index) => index !== unitIndex)
                                }
                              : prev
                          )
                        }
                      >
                        Unit löschen
                      </Button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {unit.exercises.map((exercise, exerciseIndex) => (
                        <div
                          key={`${exercise.id ?? "new"}-${exerciseIndex}`}
                          className="rounded-2xl border border-daisy-100 bg-daisy-50/40 p-3"
                        >
                          <div className="grid gap-2 md:grid-cols-2">
                            <input
                              value={exercise.label}
                              onChange={(event) =>
                                updateProgramUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? { ...entry, label: event.target.value }
                                      : entry
                                  )
                                }))
                              }
                              placeholder="Feldlabel"
                              className="rounded-xl border border-daisy-200 px-3 py-2"
                            />
                            <select
                              value={exercise.fieldType}
                              onChange={(event) =>
                                updateProgramUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? {
                                          ...entry,
                                          fieldType: event.target.value as SidebarFieldType
                                        }
                                      : entry
                                  )
                                }))
                              }
                              className="rounded-xl border border-daisy-200 px-3 py-2"
                            >
                              <option value="text">Text</option>
                              <option value="textarea">Textarea</option>
                              <option value="number">Number</option>
                              <option value="checkbox">Checkbox</option>
                              <option value="toggle">Toggle</option>
                              <option value="scale">Scale</option>
                              <option value="multiselect">Multi Select</option>
                              <option value="select">Select</option>
                              <option value="date">Date</option>
                            </select>
                            <textarea
                              value={exercise.description}
                              onChange={(event) =>
                                updateProgramUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? { ...entry, description: event.target.value }
                                      : entry
                                  )
                                }))
                              }
                              placeholder="Beschreibung"
                              className="rounded-xl border border-daisy-200 px-3 py-2 md:col-span-2"
                            />
                            {(exercise.fieldType === "text" ||
                              exercise.fieldType === "textarea" ||
                              exercise.fieldType === "number") && (
                              <input
                                value={exercise.placeholder}
                                onChange={(event) =>
                                  updateProgramUnit(unitIndex, (current) => ({
                                    ...current,
                                    exercises: current.exercises.map((entry, index) =>
                                      index === exerciseIndex
                                        ? { ...entry, placeholder: event.target.value }
                                        : entry
                                    )
                                  }))
                                }
                                placeholder="Placeholder"
                                className="rounded-xl border border-daisy-200 px-3 py-2 md:col-span-2"
                              />
                            )}
                            {(exercise.fieldType === "select" ||
                              exercise.fieldType === "multiselect") && (
                              <textarea
                                value={exercise.optionsText}
                                onChange={(event) =>
                                  updateProgramUnit(unitIndex, (current) => ({
                                    ...current,
                                    exercises: current.exercises.map((entry, index) =>
                                      index === exerciseIndex
                                        ? { ...entry, optionsText: event.target.value }
                                        : entry
                                    )
                                  }))
                                }
                                placeholder="Optionen (jede Zeile eine Option)"
                                className="rounded-xl border border-daisy-200 px-3 py-2 md:col-span-2"
                              />
                            )}
                            {exercise.fieldType === "scale" && (
                              <div className="grid gap-2 md:col-span-2 md:grid-cols-2">
                                <input
                                  type="number"
                                  value={exercise.scaleMin}
                                  onChange={(event) =>
                                    updateProgramUnit(unitIndex, (current) => ({
                                      ...current,
                                      exercises: current.exercises.map((entry, index) =>
                                        index === exerciseIndex
                                          ? {
                                              ...entry,
                                              scaleMin: Number(event.target.value) || 1
                                            }
                                          : entry
                                      )
                                    }))
                                  }
                                  placeholder="Scale Min"
                                  className="rounded-xl border border-daisy-200 px-3 py-2"
                                />
                                <input
                                  type="number"
                                  value={exercise.scaleMax}
                                  onChange={(event) =>
                                    updateProgramUnit(unitIndex, (current) => ({
                                      ...current,
                                      exercises: current.exercises.map((entry, index) =>
                                        index === exerciseIndex
                                          ? {
                                              ...entry,
                                              scaleMax: Number(event.target.value) || 5
                                            }
                                          : entry
                                      )
                                    }))
                                  }
                                  placeholder="Scale Max"
                                  className="rounded-xl border border-daisy-200 px-3 py-2"
                                />
                              </div>
                            )}
                            <input
                              type="number"
                              value={exercise.xpValue}
                              onChange={(event) =>
                                updateProgramUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.map((entry, index) =>
                                    index === exerciseIndex
                                      ? {
                                          ...entry,
                                          xpValue: Math.max(0, Number(event.target.value) || 0)
                                        }
                                      : entry
                                  )
                                }))
                              }
                              placeholder="XP"
                              className="rounded-xl border border-daisy-200 px-3 py-2 md:col-span-2"
                            />
                          </div>
                          <div className="mt-2 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              disabled={unit.exercises.length <= 1}
                              onClick={() =>
                                updateProgramUnit(unitIndex, (current) => ({
                                  ...current,
                                  exercises: current.exercises.filter(
                                    (_, index) => index !== exerciseIndex
                                  )
                                }))
                              }
                            >
                              Feld löschen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={() =>
                        updateProgramUnit(unitIndex, (current) => ({
                          ...current,
                          exercises: [...current.exercises, createEmptySidebarExercise()]
                        }))
                      }
                    >
                      Feld hinzufügen
                    </Button>
                  </section>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setProgramDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            units: [...prev.units, createEmptySidebarUnit(prev.units.length + 1)]
                          }
                        : prev
                    )
                  }
                >
                  Unit hinzufügen
                </Button>
                <Button
                  type="button"
                  onClick={saveProgramSettings}
                  disabled={programSaveLoading}
                >
                  {programSaveLoading ? "Speichern..." : "Card speichern"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Für diese Card sind keine Einstellungen verfügbar.
            </p>
          )}
        </article>
      )}

      {hasSection("visuals") && (
        <article
          id="cards-visuals"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Visualisierungstraining Card
            </p>
            <h3 className="text-xl font-semibold">Visualisierungstraining Assets</h3>
            <p className="text-sm text-gray-500">
              {visualAssets.length} aktive Visual Cards – Checkbox-Galerie im Mind Programm.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleVisualUpload}>
            <input
              value={visualTitle}
              onChange={(event) => setVisualTitle(event.target.value)}
              placeholder="Titel / Szene"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  setVisualDataUrl(
                    typeof reader.result === "string" ? reader.result : null
                  );
                };
                reader.readAsDataURL(file);
              }}
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button type="submit">Visual hochladen</Button>
          </form>
          {visualAssets.length > 0 && (
            <ul className="mt-4 grid gap-2 text-sm text-gray-600">
              {visualAssets.map((asset, index) => (
                <li
                  key={asset.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-daisy-100 px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => moveVisual(asset.id, "up")}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={index === visualAssets.length - 1}
                      onClick={() => moveVisual(asset.id, "down")}
                    >
                      ↓
                    </Button>
                    <span className="truncate">{asset.title}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleVisualDelete(asset.id)}
                  >
                    Löschen
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      {hasSection("performance") && (
        <article
          id="cards-performance-checklist"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Performance Checklist Card
            </p>
            <h3 className="text-xl font-semibold">Performance Checklist</h3>
            <p className="text-sm text-gray-500">
              {performanceItems.length} Bereiche mit 5er-Rating (State, Haltung, etc.).
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handlePerformanceSubmit}>
            <input
              value={performanceForm.label}
              onChange={(event) =>
                setPerformanceForm((prev) => ({
                  ...prev,
                  label: event.target.value
                }))
              }
              placeholder="Bereich (z.B. State)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={performanceForm.summary}
              onChange={(event) =>
                setPerformanceForm((prev) => ({
                  ...prev,
                  summary: event.target.value
                }))
              }
              placeholder="Kurzbeschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                {editingPerformanceItem ? "Eintrag aktualisieren" : "Eintrag speichern"}
              </Button>
              {editingPerformanceItem && (
                <Button type="button" variant="ghost" onClick={resetPerformanceForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
          {performanceItems.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {performanceItems
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item, index, list) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-2xl border border-daisy-100 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.label}</p>
                      {item.summary && (
                        <p className="text-xs text-gray-500">{item.summary}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => movePerformanceItem(item.id, "up")}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={index === list.length - 1}
                        onClick={() => movePerformanceItem(item.id, "down")}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditingPerformanceItem(item);
                          setPerformanceForm({
                            label: item.label,
                            summary: item.summary ?? ""
                          });
                        }}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handlePerformanceDelete(item.id)}
                      >
                        Entfernen
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </article>
      )}

      {hasSection("reading") && (
        <article
          id="cards-reading"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Mind Lesen
            </p>
            <h3 className="text-xl font-semibold">Lesen · Bücherliste</h3>
            <p className="text-sm text-gray-500">
              {readingBooks.length} Bücher stehen im Leselog Dropdown zur Auswahl.
            </p>
            {readingBookError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {readingBookError}
              </p>
            )}
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleReadingBookSubmit}>
            <input
              value={readingBookForm.title}
              onChange={(event) =>
                setReadingBookForm((prev) => ({
                  ...prev,
                  title: event.target.value
                }))
              }
              placeholder="Buchtitel (z.B. Atomic Habits)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              value={readingBookForm.author}
              onChange={(event) =>
                setReadingBookForm((prev) => ({
                  ...prev,
                  author: event.target.value
                }))
              }
              placeholder="Autor:in (optional)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                {editingReadingBook ? "Buch aktualisieren" : "Buch speichern"}
              </Button>
              {editingReadingBook && (
                <Button type="button" variant="ghost" onClick={resetReadingBookForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
          {readingBooks.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Noch kein Buch hinterlegt. Füge oben ein Buch hinzu, um die Karte freizuschalten.
            </p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {readingBooks.map((book) => (
                <li
                  key={book.id}
                  className="flex flex-col gap-2 rounded-2xl border border-daisy-100 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{book.title}</p>
                    {book.author && <p className="text-xs text-gray-500">{book.author}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingReadingBook(book);
                        setReadingBookForm({
                          title: book.title,
                          author: book.author ?? ""
                        });
                      }}
                    >
                      Bearbeiten
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleReadingBookDelete(book.id)}
                    >
                      Entfernen
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      {hasSection("goals") && (
        <article
          id="cards-goals"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: SMART Ziele Card
            </p>
            <h3 className="text-xl font-semibold">SMART Ziele</h3>
            <p className="text-sm text-gray-500">
              {goals.length} Ziele mit täglichem Check-in und Progress Balken.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleGoalSubmit}>
            {(
              ["title", "specific", "measurable", "achievable", "relevant", "timeBound"] as const
            ).map((field) => (
              <textarea
                key={field}
                value={goalForm[field]}
                onChange={(event) =>
                  setGoalForm((prev) => ({ ...prev, [field]: event.target.value }))
                }
                placeholder={field.toUpperCase()}
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
            ))}
            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={goalForm.metricName}
                onChange={(event) =>
                  setGoalForm((prev) => ({ ...prev, metricName: event.target.value }))
                }
                placeholder="Metrik"
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
              <input
                value={goalForm.targetValue}
                onChange={(event) =>
                  setGoalForm((prev) => ({ ...prev, targetValue: event.target.value }))
                }
                placeholder="Zielwert"
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
              <input
                value={goalForm.unit}
                onChange={(event) =>
                  setGoalForm((prev) => ({ ...prev, unit: event.target.value }))
                }
                placeholder="Einheit"
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </div>
            <input
              type="date"
              value={goalForm.targetDate}
              onChange={(event) =>
                setGoalForm((prev) => ({ ...prev, targetDate: event.target.value }))
              }
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button type="submit">Ziel speichern</Button>
          </form>
          {goals.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {goals.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-center justify-between rounded-2xl border border-daisy-100 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{goal.title}</p>
                    <p className="text-xs text-gray-500">{goal.latestProgress ?? 0}% erreicht</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" type="button" onClick={() => setLogsModalGoal(goal)}>
                      Logs
                    </Button>
                    <Button variant="ghost" type="button" onClick={() => openGoalEdit(goal)}>
                      Bearbeiten
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      {hasSection("brain") && (
        <article
          id="cards-brain"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Brain Training Gym Card
            </p>
            <h3 className="text-xl font-semibold">Brain Training Übungen</h3>
            <p className="text-sm text-gray-500">
              {brainExercises.length} Brain Gym Items mit Bewertung.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleBrainSubmit}>
            <input
              value={brainForm.title}
              onChange={(event) =>
                setBrainForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Titel"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              value={brainForm.focusArea}
              onChange={(event) =>
                setBrainForm((prev) => ({ ...prev, focusArea: event.target.value }))
              }
              placeholder="Fokusbereich"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={brainForm.description}
              onChange={(event) =>
                setBrainForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Beschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">
                Difficulty ({brainForm.difficulty})
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={brainForm.difficulty}
                  onChange={(event) =>
                    setBrainForm((prev) => ({
                      ...prev,
                      difficulty: Number(event.target.value)
                    }))
                  }
                  className="mt-2 w-full"
                />
              </label>
              <input
                type="number"
                value={brainForm.durationMinutes}
                onChange={(event) =>
                  setBrainForm((prev) => ({
                    ...prev,
                    durationMinutes: Number(event.target.value)
                  }))
                }
                placeholder="Minuten"
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
              <input
                type="number"
                value={brainForm.rating}
                onChange={(event) =>
                  setBrainForm((prev) => ({ ...prev, rating: Number(event.target.value) }))
                }
                placeholder="Rating"
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />
            </div>
            <Button type="submit">Übung hinzufügen</Button>
          </form>
        </article>
      )}

      {hasSection("learning") && (
        <article
          id="cards-learning"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Higher Thinking Card
            </p>
            <h3 className="text-xl font-semibold">Higher Thinking Pfade</h3>
            <p className="text-sm text-gray-500">
              {learningPaths.length} Lernpfade &{" "}
              {learningPaths.reduce((sum, path) => sum + path.milestones.length, 0)} Milestones.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handlePathSubmit}>
            <input
              value={pathForm.title}
              onChange={(event) =>
                setPathForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Titel"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              value={pathForm.theme}
              onChange={(event) =>
                setPathForm((prev) => ({ ...prev, theme: event.target.value }))
              }
              placeholder="Thema"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={pathForm.description}
              onChange={(event) =>
                setPathForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Beschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={pathForm.milestones}
              onChange={(event) =>
                setPathForm((prev) => ({ ...prev, milestones: event.target.value }))
              }
              placeholder="Milestones (jede Zeile = Meilenstein)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button type="submit">Lernpfad speichern</Button>
          </form>
        </article>
      )}

      {hasSection("emotion") && (
        <article
          id="cards-emotion"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Emotion Training Card
            </p>
            <h3 className="text-xl font-semibold">Emotion Training</h3>
            <p className="text-sm text-gray-500">
              {emotionPractices.length} Regulation Guides inkl. Grounding-Prompt.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleEmotionSubmit}>
            <input
              value={emotionForm.emotion}
              onChange={(event) =>
                setEmotionForm((prev) => ({ ...prev, emotion: event.target.value }))
              }
              placeholder="Emotion"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={emotionForm.summary}
              onChange={(event) =>
                setEmotionForm((prev) => ({ ...prev, summary: event.target.value }))
              }
              placeholder="Kurze Beschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={emotionForm.regulationSteps}
              onChange={(event) =>
                setEmotionForm((prev) => ({ ...prev, regulationSteps: event.target.value }))
              }
              placeholder="Regulation Steps (pro Zeile ein Step)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={emotionForm.groundingPrompt}
              onChange={(event) =>
                setEmotionForm((prev) => ({ ...prev, groundingPrompt: event.target.value }))
              }
              placeholder="Grounding Prompt"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button type="submit">Emotion Guide erstellen</Button>
          </form>
        </article>
      )}

      {hasSection("meditation") && (
        <article
          id="cards-meditation"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: MED Meditation Card
            </p>
            <h3 className="text-xl font-semibold">MED Meditation</h3>
            <p className="text-sm text-gray-500">
              {meditations.length} Meditationen · {meditationStepCount} Steps im Dropdown Flow.
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleMeditationSubmit}>
            <input
              value={meditationForm.title}
              onChange={(event) =>
                setMeditationForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Titel (z.B. Sayajin Meditation)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              value={meditationForm.subtitle}
              onChange={(event) =>
                setMeditationForm((prev) => ({ ...prev, subtitle: event.target.value }))
              }
              placeholder="Untertitel"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={meditationForm.summary}
              onChange={(event) =>
                setMeditationForm((prev) => ({ ...prev, summary: event.target.value }))
              }
              placeholder="Kurzbeschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button type="submit">Meditation hinzufügen</Button>
          </form>

          {meditations.length > 0 && (
            <div className="mt-5 space-y-4">
              {orderedMeditations.map((flow, index) => {
                const stepDraft = stepDrafts[flow.id] ?? { title: "", description: "" };
                const isEditing = editingMeditation?.id === flow.id;
                const isFirstFlow = index === 0;
                const isLastFlow = index === orderedMeditations.length - 1;
                return (
                  <div
                    key={flow.id}
                    className="space-y-3 rounded-2xl border border-daisy-100 bg-white/90 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-daisy-400">
                          {flow.subtitle ?? "Meditation"}
                        </p>
                        <h4 className="text-lg font-semibold text-gray-900">{flow.title}</h4>
                        {flow.summary && <p className="text-sm text-gray-600">{flow.summary}</p>}
                        <p className="text-xs text-gray-500">
                          {flow.steps.length} Steps · Position {index + 1}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isFirstFlow}
                          onClick={() => moveMeditation(flow.id, "up")}
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={isLastFlow}
                          onClick={() => moveMeditation(flow.id, "down")}
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => openMeditationEdit(flow)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleMeditationDelete(flow.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </div>

                    {isEditing && (
                      <form
                        className="space-y-2 rounded-2xl border border-daisy-100 bg-white/80 p-3"
                        onSubmit={handleMeditationUpdate}
                      >
                        <input
                          value={meditationEditForm.title}
                          onChange={(event) =>
                            setMeditationEditForm((prev) => ({
                              ...prev,
                              title: event.target.value
                            }))
                          }
                          placeholder="Titel"
                          className="rounded-2xl border border-daisy-200 px-4 py-3"
                        />
                        <input
                          value={meditationEditForm.subtitle}
                          onChange={(event) =>
                            setMeditationEditForm((prev) => ({
                              ...prev,
                              subtitle: event.target.value
                            }))
                          }
                          placeholder="Untertitel"
                          className="rounded-2xl border border-daisy-200 px-4 py-3"
                        />
                        <textarea
                          value={meditationEditForm.summary}
                          onChange={(event) =>
                            setMeditationEditForm((prev) => ({
                              ...prev,
                              summary: event.target.value
                            }))
                          }
                          placeholder="Beschreibung"
                          className="rounded-2xl border border-daisy-200 px-4 py-3"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit">Speichern</Button>
                          <Button type="button" variant="ghost" onClick={cancelMeditationEdit}>
                            Abbrechen
                          </Button>
                        </div>
                      </form>
                    )}

                    {flow.steps.length > 0 && (
                      <ul className="space-y-2 rounded-2xl border border-daisy-100 bg-white/60 p-3 text-sm text-gray-700">
                        {flow.steps
                          .slice()
                          .sort((a, b) => a.order - b.order)
                          .map((step, stepIndex, stepList) => (
                            <li
                              key={step.id}
                              className="flex flex-col gap-2 rounded-2xl border border-daisy-50 bg-white/80 p-3 md:flex-row md:items-center md:justify-between"
                            >
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {stepIndex + 1}. {step.title}
                                </p>
                                {step.description && (
                                  <p className="text-sm text-gray-600">{step.description}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={stepIndex === 0}
                                  onClick={() => moveMeditationStep(flow.id, step.id, "up")}
                                >
                                  ↑
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  disabled={stepIndex === stepList.length - 1}
                                  onClick={() => moveMeditationStep(flow.id, step.id, "down")}
                                >
                                  ↓
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => handleStepDelete(flow.id, step.id)}
                                >
                                  Entfernen
                                </Button>
                              </div>
                            </li>
                          ))}
                      </ul>
                    )}

                    <form
                      className="grid gap-2 rounded-2xl border border-daisy-100 bg-white/80 p-3"
                      onSubmit={handleStepSubmit(flow.id)}
                    >
                      <input
                        value={stepDraft.title}
                        onChange={(event) =>
                          updateStepDraft(flow.id, { title: event.target.value })
                        }
                        placeholder="Neuer Step Titel"
                        className="rounded-2xl border border-daisy-200 px-4 py-3"
                      />
                      <textarea
                        value={stepDraft.description}
                        onChange={(event) =>
                          updateStepDraft(flow.id, { description: event.target.value })
                        }
                        placeholder="Beschreibung (optional)"
                        className="rounded-2xl border border-daisy-200 px-4 py-3"
                      />
                      <Button type="submit">Step hinzufügen</Button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      )}

      {hasSection("household") && (
        <article
          id="cards-household"
          className="rounded-3xl border border-white/20 bg-white/90 p-6 text-gray-900 shadow-sm"
        >
          <header className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Ändert: Haushalt Environment Cards
            </p>
            <h3 className="text-xl font-semibold">Haushalts Karten</h3>
            <p className="text-sm text-gray-500">
              {householdCards.length} aktive Karten · Wochentage + Aufgaben definieren.
            </p>
            {householdAdminError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {householdAdminError}
              </p>
            )}
          </header>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-daisy-100 bg-white/70 p-4">
              <h4 className="text-sm font-semibold text-gray-900">Aufgaben verwalten</h4>
              <form className="mt-3 space-y-3" onSubmit={handleHouseholdTaskSubmit}>
                <input
                  value={householdTaskLabel}
                  onChange={(event) => setHouseholdTaskLabel(event.target.value)}
                  placeholder="Task Label (z.B. Aufgeräumt)"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">
                    {editingTaskId ? "Task aktualisieren" : "Task hinzufügen"}
                  </Button>
                  {editingTaskId && (
                    <Button type="button" variant="ghost" onClick={resetHouseholdTaskForm}>
                      Abbrechen
                    </Button>
                  )}
                </div>
              </form>
              {householdTasks.length === 0 ? (
                <p className="mt-4 text-xs text-gray-500">Noch keine Aufgaben definiert.</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {householdTasks
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((task, index, list) => (
                      <li
                        key={task.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-daisy-100 bg-white/90 px-3 py-2"
                      >
                        <div>
                          <p className="font-semibold">{task.label}</p>
                          {!task.active && (
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              Deaktiviert
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={index === 0}
                            onClick={() => moveHouseholdTask(task.id, "up")}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={index === list.length - 1}
                            onClick={() => moveHouseholdTask(task.id, "down")}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setHouseholdTaskLabel(task.label);
                            }}
                          >
                            Bearb.
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => deleteHouseholdTask(task.id)}
                          >
                            Löschen
                          </Button>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-daisy-100 bg-white/70 p-4">
              <h4 className="text-sm font-semibold text-gray-900">
                {editingHouseholdCard ? "Karte bearbeiten" : "Neue Karte"}
              </h4>
              <form className="mt-3 space-y-3" onSubmit={handleHouseholdCardSubmit}>
                <input
                  value={householdCardForm.title}
                  onChange={(event) =>
                    setHouseholdCardForm((prev) => ({
                      ...prev,
                      title: event.target.value
                    }))
                  }
                  placeholder="Titel (z.B. Montag Reset)"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
                />
                <textarea
                  value={householdCardForm.summary}
                  onChange={(event) =>
                    setHouseholdCardForm((prev) => ({
                      ...prev,
                      summary: event.target.value
                    }))
                  }
                  placeholder="Kurzbeschreibung"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
                />
                <select
                  value={householdCardForm.weekday}
                  onChange={(event) =>
                    setHouseholdCardForm((prev) => ({
                      ...prev,
                      weekday: Number(event.target.value)
                    }))
                  }
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
                >
                  {HOUSEHOLD_WEEKDAYS.map((weekday) => (
                    <option key={weekday.value} value={weekday.value}>
                      {weekday.label}
                    </option>
                  ))}
                </select>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Aufgaben
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {householdTasks.length === 0 && (
                      <p className="text-xs text-gray-500">
                        Lege zuerst Tasks an, bevor du Karten erstellst.
                      </p>
                    )}
                    {householdTasks.map((task) => (
                      <label
                        key={task.id}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                          householdCardForm.taskIds.includes(task.id)
                            ? "border-daisy-400 bg-daisy-50 text-daisy-900"
                            : "border-daisy-100 bg-white text-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-daisy-500"
                          checked={householdCardForm.taskIds.includes(task.id)}
                          onChange={() => toggleHouseholdCardTask(task.id)}
                        />
                        {task.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">
                    {editingHouseholdCard ? "Karte aktualisieren" : "Karte speichern"}
                  </Button>
                  {editingHouseholdCard && (
                    <Button type="button" variant="ghost" onClick={resetHouseholdCardForm}>
                      Abbrechen
                    </Button>
                  )}
                </div>
              </form>
              {householdCards.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-gray-700">
                  {householdCards.map((card) => (
                    <li
                      key={card.id}
                      className="flex flex-col gap-2 rounded-2xl border border-daisy-100 bg-white/90 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{card.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatWeekday(card.weekday)} · {card.tasks.length} Aufgaben
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => startEditHouseholdCard(card)}>
                          Bearbeiten
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => deleteHouseholdCard(card.id)}>
                          Entfernen
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </article>
      )}

      {editingGoal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ziel bearbeiten
                </p>
                <h3 className="text-xl font-semibold">{editingGoal.title}</h3>
              </div>
              <Button variant="ghost" type="button" onClick={() => setEditingGoal(null)}>
                Schließen
              </Button>
            </header>

            <form className="mt-4 space-y-3" onSubmit={handleGoalUpdate}>
              {(
                ["title", "specific", "measurable", "achievable", "relevant", "timeBound"] as const
              ).map((field) => (
                <textarea
                  key={field}
                  value={goalForm[field]}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                  placeholder={field.toUpperCase()}
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              ))}
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  value={goalForm.metricName}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, metricName: event.target.value }))
                  }
                  placeholder="Metrik"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={goalForm.targetValue}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, targetValue: event.target.value }))
                  }
                  placeholder="Zielwert"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={goalForm.unit}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, unit: event.target.value }))
                  }
                  placeholder="Einheit"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </div>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={(event) =>
                  setGoalForm((prev) => ({ ...prev, targetDate: event.target.value }))
                }
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              />

              <div className="flex flex-col gap-2 rounded-2xl border border-daisy-200 bg-white p-4 text-sm font-semibold text-gray-700">
                <div className="flex items-center justify-between">
                  <span>Aktuelle Erreichung</span>
                  <span className="text-base font-bold text-daisy-600">{goalProgress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={goalProgress}
                  onChange={(event) => setGoalProgress(Number(event.target.value))}
                  className="accent-daisy-500"
                />
              </div>

              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                Erfolgslog
                <textarea
                  value={goalLogText}
                  onChange={(event) => setGoalLogText(event.target.value)}
                  placeholder="Was lief besonders gut?"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
              </label>

              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setEditingGoal(null)}>
                  Abbrechen
                </Button>
                <Button type="submit">Änderungen speichern</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {logsModalGoal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Erfolgslog</p>
                <h3 className="text-xl font-semibold">{logsModalGoal.title}</h3>
              </div>
              <Button variant="ghost" type="button" onClick={() => setLogsModalGoal(null)}>
                Schließen
              </Button>
            </header>
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto text-sm text-gray-700">
              {logsModalGoal.logs && logsModalGoal.logs.length > 0 ? (
                logsModalGoal.logs.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-daisy-100 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                      <span className="font-semibold text-daisy-600">
                        {entry.progressPercent}%
                      </span>
                    </div>
                    {entry.selfAssessment && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                        {entry.selfAssessment}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Noch keine Einträge.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
