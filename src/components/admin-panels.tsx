"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, GaugeCircle, Gift, Layers, LayoutGrid, Users } from "lucide-react";

import { programDefinitions } from "@/lib/data";
import type {
  BrainExerciseWithState,
  EmotionPracticeWithLogs,
  LearningPathWithProgress,
  MindGoalWithProgress,
  MindVisualizationAsset,
  MindMeditationFlow,
  MindReadingBook,
  PerformanceChecklistItem,
  HouseholdCardDefinition,
  HouseholdTaskDefinition,
  ProgramDefinition,
  ProgramStackDefinition,
  HumanContactPersonDefinition,
  HumanContactStatsEntry,
  HumanContactActivity,
  HumanContactCadence,
  HumanContactRelation,
  RewardDefinition
} from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { HOUSEHOLD_WEEKDAYS, formatWeekday, formatWeekdays } from "@/lib/household";
import {
  HUMAN_ACTIVITY_OPTIONS,
  HUMAN_CADENCE_OPTIONS,
  HUMAN_RELATION_OPTIONS,
  getHumanActivityLabel,
  getHumanRelationLabel
} from "@/lib/human";

const PERFORMANCE_CHECKLIST_PROGRAM_ID = "performance-checklist";
const HUMAN_DEFAULT_RELATION = HUMAN_RELATION_OPTIONS[0]?.value ?? "family";


export function AdminPanels() {
  const [programName, setProgramName] = useState("");
  const [category, setCategory] = useState("mind");
  const [programs, setPrograms] = useState<ProgramDefinition[]>(programDefinitions);
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState(1000);
  const [rewards, setRewards] = useState<RewardDefinition[]>([]);

  const [visualAssets, setVisualAssets] = useState<MindVisualizationAsset[]>([]);
  const [visualTitle, setVisualTitle] = useState("");
  const [visualDataUrl, setVisualDataUrl] = useState<string | null>(null);

  const [programStacks, setProgramStacks] = useState<ProgramStackDefinition[]>([]);
  const [stackTitle, setStackTitle] = useState("");
  const [stackSummary, setStackSummary] = useState("");
  const [stackPrograms, setStackPrograms] = useState<string[]>([]);
  const [stackSelection, setStackSelection] = useState(
    programDefinitions[0]?.slug ?? ""
  );
  const [stackWeekdays, setStackWeekdays] = useState<number[]>([]);

  const [stackDuration, setStackDuration] = useState<number | null>(null);
  const [stackStartTime, setStackStartTime] = useState<string>("");
  const [stackStartTimes, setStackStartTimes] = useState<Record<string, string>>({});
  const [editingStack, setEditingStack] = useState<ProgramStackDefinition | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editPrograms, setEditPrograms] = useState<string[]>([]);
  const [editSelection, setEditSelection] = useState(
    programDefinitions[0]?.slug ?? ""
  );
  const [editWeekdays, setEditWeekdays] = useState<number[]>([]);
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editStartTimes, setEditStartTimes] = useState<Record<string, string>>({});

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
  const [editingMeditation, setEditingMeditation] = useState<MindMeditationFlow | null>(null);
  const [meditationEditForm, setMeditationEditForm] = useState({
    title: "",
    subtitle: "",
    summary: ""
  });
  const [stepDrafts, setStepDrafts] = useState<Record<string, { title: string; description: string }>>({});
  const [readingBooks, setReadingBooks] = useState<MindReadingBook[]>([]);
  const [readingBookForm, setReadingBookForm] = useState({ title: "", author: "" });
  const [editingReadingBook, setEditingReadingBook] = useState<MindReadingBook | null>(null);
  const [readingBookError, setReadingBookError] = useState<string | null>(null);
  const [performanceItems, setPerformanceItems] = useState<PerformanceChecklistItem[]>([]);
  const [performanceForm, setPerformanceForm] = useState({ label: "", summary: "" });
  const [editingPerformanceItem, setEditingPerformanceItem] = useState<PerformanceChecklistItem | null>(null);
  const [programXpDrafts, setProgramXpDrafts] = useState<Record<string, string>>({});
  const [savingProgramId, setSavingProgramId] = useState<string | null>(null);
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
  const [editingHouseholdCard, setEditingHouseholdCard] = useState<HouseholdCardDefinition | null>(null);
  const [householdAdminError, setHouseholdAdminError] = useState<string | null>(null);
  const [humanContacts, setHumanContacts] = useState<HumanContactPersonDefinition[]>([]);
  const [humanContactStats, setHumanContactStats] = useState<HumanContactStatsEntry[]>([]);
  const [humanContactForm, setHumanContactForm] = useState<{
    name: string;
    relation: HumanContactRelation;
    note: string;
  }>({
    name: "",
    relation: HUMAN_DEFAULT_RELATION as HumanContactRelation,
    note: ""
  });
  const [editingHumanContact, setEditingHumanContact] = useState<HumanContactPersonDefinition | null>(null);
  const [humanContactError, setHumanContactError] = useState<string | null>(null);
  const [humanContactSaving, setHumanContactSaving] = useState(false);
  const [humanAssignmentBusyKey, setHumanAssignmentBusyKey] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "program-builder": true,
    "human-connections": true
  });

  const mindStats = useMemo(
    () => ({
      visuals: visualAssets.length,
      goals: goals.length,
      brainExercises: brainExercises.length,
      learningPaths: learningPaths.length,
      emotionPractices: emotionPractices.length,
      meditations: meditations.length,
      performanceItems: performanceItems.length,
      householdCards: householdCards.length,
      readingBooks: readingBooks.length
    }),
    [
      visualAssets,
      goals,
      brainExercises,
      learningPaths,
      emotionPractices,
      meditations,
      performanceItems,
      householdCards,
      readingBooks
    ]
  );
  const meditationStepCount = useMemo(
    () => meditations.reduce((sum, flow) => sum + flow.steps.length, 0),
    [meditations]
  );
  const orderedMeditations = useMemo(
    () => [...meditations].sort((a, b) => a.order - b.order),
    [meditations]
  );
  const sortedPrograms = useMemo(
    () => programs.slice().sort((left, right) => left.code.localeCompare(right.code)),
    [programs]
  );
  const performanceProgram = useMemo(
    () => programs.find((entry) => entry.id === PERFORMANCE_CHECKLIST_PROGRAM_ID) ?? null,
    [programs]
  );
  const householdProgram = useMemo(
    () => programs.find((entry) => entry.id === "environment-household-cards") ?? null,
    [programs]
  );
  const readingProgram = useMemo(
    () => programs.find((entry) => entry.id === "mind-reading-tracker") ?? null,
    [programs]
  );
  const sortedHumanContacts = useMemo(
    () => humanContacts.slice().sort((left, right) => left.name.localeCompare(right.name)),
    [humanContacts]
  );
  const humanStatsById = useMemo(
    () =>
      humanContactStats.reduce<Record<string, HumanContactStatsEntry>>((acc, entry) => {
        acc[entry.personId] = entry;
        return acc;
      }, {}),
    [humanContactStats]
  );

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
      error instanceof Error ? (error.message || fallbackMessage) : fallbackMessage;
    setHouseholdAdminError(message);
  };
  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderAccordionSection = (
    sectionId: string,
    title: string,
    subtitle: string,
    content: ReactNode,
    icon?: ReactNode
  ) => {
    const isOpen = openSections[sectionId] ?? false;
    return (
      <section key={sectionId} id={sectionId} className="rounded-3xl bg-white/80 shadow-sm">
        <button
          type="button"
          onClick={() => toggleSection(sectionId)}
          className={cn(
            "flex w-full items-center justify-between gap-4 rounded-3xl border px-6 py-4 text-left transition",
            isOpen
              ? "border-daisy-100 bg-white text-gray-900 shadow-sm"
              : "border-transparent bg-gradient-to-r from-daisy-100 to-daisy-200 text-gray-800 shadow-md"
          )}
          aria-expanded={isOpen}
          aria-controls={`${sectionId}-content`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/60 text-daisy-700 shadow">
                {icon}
              </span>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                {subtitle}
              </p>
              <p className="text-xl font-semibold text-gray-900">{title}</p>
            </div>
          </div>
          <ChevronDown
            className={cn(
              "h-6 w-6 text-gray-500 transition-transform",
              isOpen ? "rotate-180" : ""
            )}
            aria-hidden="true"
          />
        </button>
        <div
          id={`${sectionId}-content`}
          className={cn(
            "border-t border-daisy-100 bg-white transition-all duration-200",
            isOpen ? "block" : "hidden"
          )}
        >
          <div className="px-6 pb-6 pt-4">{content}</div>
        </div>
      </section>
    );
  };

  useEffect(() => {
    setOpenSections({});
    void refreshMindData();
  }, []);

  useEffect(() => {
    if (programs.length === 0) return;
    const firstSlug = programs[0]?.slug ?? "";
    setStackSelection((current) => current || firstSlug);
    setEditSelection((current) => current || firstSlug);
  }, [programs]);

  const refreshMindData = async () => {
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
      stackPayload,
      programPayload,
      householdPayload,
      humanContactsPayload,
      rewardsPayload
    ] = await Promise.all([
      loadJson("/api/mind/visuals"),
      loadJson("/api/mind/goals"),
      loadJson("/api/mind/brain-exercises"),
      loadJson("/api/mind/learning-paths"),
      loadJson("/api/mind/emotions"),
      loadJson("/api/mind/meditations"),
      loadJson("/api/mind/reading/books"),
      loadJson("/api/mind/performance-checklist"),
      loadJson("/api/program-stacks"),
      loadJson("/api/programs"),
      loadJson("/api/environment/household/cards"),
      loadJson("/api/human/contacts"),
      loadJson("/api/rewards")
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
    setProgramStacks(Array.isArray(stackPayload) ? stackPayload : []);
    setPrograms(
      Array.isArray(programPayload) && programPayload.length > 0
        ? (programPayload as ProgramDefinition[])
        : programDefinitions
    );
    if (householdPayload && typeof householdPayload === "object") {
      const payload = householdPayload as { cards?: unknown; tasks?: unknown };
      setHouseholdCards(
        Array.isArray(payload.cards) ? (payload.cards as HouseholdCardDefinition[]) : []
      );
      setHouseholdTasks(
        Array.isArray(payload.tasks) ? (payload.tasks as HouseholdTaskDefinition[]) : []
      );
    }
    if (humanContactsPayload && typeof humanContactsPayload === "object") {
      const payload = humanContactsPayload as { persons?: unknown; stats?: unknown };
      setHumanContacts(
        Array.isArray(payload.persons)
          ? (payload.persons as HumanContactPersonDefinition[])
          : []
      );
      setHumanContactStats(
        Array.isArray(payload.stats)
          ? (payload.stats as HumanContactStatsEntry[])
          : []
      );
    } else {
      setHumanContacts([]);
      setHumanContactStats([]);
    }
    setRewards(
      (rewardsPayload as any)?.rewards || []
    );
  };

  const createProgram = async () => {
    await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: programName, category })
    });
    setProgramName("");
    await refreshMindData();
    alert("Programm stub angelegt – erweitere anschließend Units & Exercises.");
  };

  const createReward = async () => {
    await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rewardName, cost: rewardCost })
    });
    setRewardName("");
    setRewardCost(1000);
    setRewardName("");
    setRewardCost(1000);
    await refreshMindData();
    alert("Belohnung gespeichert.");
  };

  const deleteReward = async (id: string) => {
    if (!window.confirm("Reward löschen?")) return;
    await fetch("/api/rewards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    await refreshMindData();
  };

  const toggleRewardActive = async (id: string, currentActive: boolean) => {
    await fetch("/api/rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !currentActive })
    });
    await refreshMindData();
  };

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
    await refreshMindData();
  };

  const handleVisualDelete = async (id: string) => {
    await fetch("/api/mind/visuals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    await refreshMindData();
  };

  const saveVisualOrder = async (assets: MindVisualizationAsset[]) => {
    setVisualAssets(assets);
    await fetch("/api/mind/visuals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: assets.map((asset) => asset.id) })
    });
    await refreshMindData();
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

  const handleStackSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stackTitle || stackPrograms.length === 0) {
      alert("Bitte Titel und mindestens ein Programm wählen.");
      return;
    }
    await fetch("/api/program-stacks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: stackTitle,
        summary: stackSummary,
        programSlugs: stackPrograms,
        weekdays: stackWeekdays,
        durationMinutes: stackDuration,
        startTime: stackStartTime || null,
        startTimes: stackStartTimes
      })
    });
    setStackTitle("");
    setStackSummary("");
    setStackPrograms([]);
    setStackWeekdays([]);
    setStackDuration(null);
    setStackStartTime("");
    setStackStartTimes({});
    await refreshMindData();
  };

  const addStackProgram = () => {
    if (!stackSelection) return;
    setStackPrograms((prev) =>
      prev.includes(stackSelection) ? prev : [...prev, stackSelection]
    );
  };

  const removeStackProgram = (slug: string) => {
    setStackPrograms((prev) => prev.filter((entry) => entry !== slug));
  };

  const openEditStack = (stack: ProgramStackDefinition) => {
    setEditingStack(stack);
    setEditTitle(stack.title);
    setEditSummary(stack.summary);
    setEditPrograms(stack.programSlugs);
    setEditSelection(stack.programSlugs[0] ?? programs[0]?.slug ?? "");
    setEditWeekdays(stack.weekdays ?? []);
    setEditWeekdays(stack.weekdays ?? []);
    setEditDuration(stack.durationMinutes ?? null);
    setEditWeekdays(stack.weekdays ?? []);
    setEditDuration(stack.durationMinutes ?? null);
    setEditStartTime(stack.startTime ?? "");
    setEditStartTimes(stack.startTimes ?? {});
  };

  const addEditProgram = () => {
    if (!editSelection) return;
    setEditPrograms((prev) =>
      prev.includes(editSelection) ? prev : [...prev, editSelection]
    );
  };

  const removeEditProgram = (slug: string) => {
    setEditPrograms((prev) => prev.filter((entry) => entry !== slug));
  };

  const handleStackUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingStack || !editTitle || editPrograms.length === 0) return;

    await fetch("/api/program-stacks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingStack.id,
        title: editTitle,
        summary: editSummary,
        programSlugs: editPrograms,
        weekdays: editWeekdays,
        durationMinutes: editDuration,

        startTime: editStartTime || null,
        startTimes: editStartTimes
      })
    });

    setEditingStack(null);
    await refreshMindData();
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
    await refreshMindData();
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
        latestProgress: goalProgress
        ,
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
    await refreshMindData();
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
    await refreshMindData();
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
    await refreshMindData();
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
    await refreshMindData();
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
    await refreshMindData();
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
    await refreshMindData();
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
    await refreshMindData();
  };

  const saveMeditationOrder = async (flowsList: MindMeditationFlow[]) => {
    await fetch("/api/mind/meditations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: flowsList.map((flow) => flow.id) })
    });
    await refreshMindData();
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

  const handleStepSubmit = (flowId: string) => async (event: React.FormEvent<HTMLFormElement>) => {
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
    await refreshMindData();
  };

  const handleStepDelete = async (flowId: string, stepId: string) => {
    if (!window.confirm("Step entfernen?")) return;
    await fetch(`/api/mind/meditations/${flowId}/steps/${stepId}`, {
      method: "DELETE"
    });
    await refreshMindData();
  };

  const persistStepOrder = async (flowId: string, steps: MindMeditationFlow["steps"]) => {
    await fetch(`/api/mind/meditations/${flowId}/steps/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: steps.map((step) => step.id) })
    });
    await refreshMindData();
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

  const resetPerformanceForm = () => {
    setPerformanceForm({ label: "", summary: "" });
    setEditingPerformanceItem(null);
  };

  const handlePerformanceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    await refreshMindData();
  };

  const handlePerformanceDelete = async (id: string) => {
    if (!window.confirm("Eintrag wirklich löschen?")) return;
    await fetch("/api/mind/performance-checklist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    await refreshMindData();
  };

  const savePerformanceOrder = async (items: PerformanceChecklistItem[]) => {
    await fetch("/api/mind/performance-checklist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: items.map((item) => item.id) })
    });
    await refreshMindData();
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

  const resetReadingBookForm = () => {
    setReadingBookForm({ title: "", author: "" });
    setEditingReadingBook(null);
    setReadingBookError(null);
  };

  const handleReadingBookSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      await refreshMindData();
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
      await refreshMindData();
    } catch (requestError) {
      console.error("Failed to delete reading book", requestError);
      setReadingBookError(
        requestError instanceof Error
          ? requestError.message
          : "Buch konnte nicht gelöscht werden."
      );
    }
  };

  const updateProgramXpDraft = (programId: string, value: string, baseline: number) => {
    setProgramXpDrafts((prev) => {
      if (value === String(baseline)) {
        const next = { ...prev };
        delete next[programId];
        return next;
      }
      return { ...prev, [programId]: value };
    });
  };

  const persistProgramXp = async (program: ProgramDefinition) => {
    const rawValue = programXpDrafts[program.id] ?? String(program.xpReward);
    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      alert("Bitte gültige XP eintragen.");
      return;
    }
    const xpValue = Math.max(0, Math.round(parsedValue));
    setSavingProgramId(program.id);
    try {
      const response = await fetch("/api/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: program.id, xpReward: xpValue })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Programm konnte nicht aktualisiert werden.");
      }
      setProgramXpDrafts((prev) => {
        const next = { ...prev };
        delete next[program.id];
        return next;
      });
      await refreshMindData();
    } catch (error) {
      console.error("XP Update fehlgeschlagen", error);
      alert("XP konnten nicht gespeichert werden.");
    } finally {
      setSavingProgramId(null);
    }
  };

  const resetHouseholdTaskForm = () => {
    setHouseholdTaskLabel("");
    setEditingTaskId(null);
  };

  const handleHouseholdTaskSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      await refreshMindData();
    } catch (error) {
      handleHouseholdMutationError(error, "Haushalts-Task konnte nicht gespeichert werden.");
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
      await refreshMindData();
    } catch (error) {
      handleHouseholdMutationError(error, "Aufgaben-Reihenfolge konnte nicht gespeichert werden.");
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
      await refreshMindData();
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
        taskIds: exists ? prev.taskIds.filter((entry) => entry !== taskId) : [...prev.taskIds, taskId]
      };
    });
  };

  const handleHouseholdCardSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      await refreshMindData();
    } catch (error) {
      handleHouseholdMutationError(error, "Haushaltskarte konnte nicht gespeichert werden.");
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
      await refreshMindData();
    } catch (error) {
      handleHouseholdMutationError(error, "Haushaltskarte konnte nicht gelöscht werden.");
    }
  };

  const parseHumanAdminError = async (response: Response) => {
    try {
      const payload = await response.json();
      if (payload && typeof payload.error === "string") {
        return payload.error;
      }
    } catch {
      // ignore parsing errors
    }
    return null;
  };

  const resetHumanContactForm = () => {
    setEditingHumanContact(null);
    setHumanContactForm({ name: "", relation: HUMAN_DEFAULT_RELATION, note: "" });
  };

  const startEditHumanContact = (person: HumanContactPersonDefinition) => {
    setEditingHumanContact(person);
    setHumanContactForm({
      name: person.name,
      relation: person.relation,
      note: person.note ?? ""
    });
    setHumanContactError(null);
  };

  const handleHumanContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!humanContactForm.name.trim()) {
      setHumanContactError("Name erforderlich.");
      return;
    }
    setHumanContactSaving(true);
    setHumanContactError(null);
    try {
      const payload = editingHumanContact
        ? { id: editingHumanContact.id, ...humanContactForm }
        : humanContactForm;
      const response = await fetch("/api/human/contacts", {
        method: editingHumanContact ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await parseHumanAdminError(response);
        throw new Error(message ?? "Kontakt konnte nicht gespeichert werden.");
      }
      resetHumanContactForm();
      await refreshMindData();
    } catch (error) {
      console.error("Human contact submit failed", error);
      setHumanContactError(
        error instanceof Error ? error.message : "Kontakt konnte nicht gespeichert werden."
      );
    } finally {
      setHumanContactSaving(false);
    }
  };

  const deleteHumanContact = async (personId: string) => {
    if (!window.confirm("Kontakt wirklich löschen? Aktivitäten bleiben bestehen.")) {
      return;
    }
    setHumanContactError(null);
    try {
      const response = await fetch("/api/human/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: personId })
      });
      if (!response.ok) {
        const message = await parseHumanAdminError(response);
        throw new Error(message ?? "Kontakt konnte nicht gelöscht werden.");
      }
      if (editingHumanContact?.id === personId) {
        resetHumanContactForm();
      }
      await refreshMindData();
    } catch (error) {
      console.error("Human contact delete failed", error);
      setHumanContactError(
        error instanceof Error ? error.message : "Kontakt konnte nicht gelöscht werden."
      );
    }
  };

  const toggleHumanAssignment = async (
    personId: string,
    cadence: HumanContactCadence,
    activity: HumanContactActivity,
    enabled: boolean
  ) => {
    const busyKey = `${personId}:${cadence}:${activity}`;
    setHumanAssignmentBusyKey(busyKey);
    setHumanContactError(null);
    try {
      const response = await fetch("/api/human/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          cadence,
          activity,
          enabled
        })
      });
      if (!response.ok) {
        const message = await parseHumanAdminError(response);
        throw new Error(message ?? "Aufgaben konnten nicht aktualisiert werden.");
      }
      const payload = await response.json();
      const assignments = Array.isArray(payload.assignments) ? payload.assignments : [];
      setHumanContacts((prev) =>
        prev.map((person) =>
          person.id === personId ? { ...person, assignments } : person
        )
      );
    } catch (error) {
      console.error("Human assignment toggle failed", error);
      setHumanContactError(
        error instanceof Error ? error.message : "Aufgaben konnten nicht aktualisiert werden."
      );
    } finally {
      setHumanAssignmentBusyKey(null);
    }
  };
  return (
    <div className="space-y-6">
      {renderAccordionSection(
        "program-stacks",
        "Stacks",
        "Programmkarten kombinieren",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Programms zusammenstellen</h2>
            <p className="text-sm text-gray-500">
              Verbinde bestehende Einzelprogramme zu einem Flow-Modus (z.B. Morgenroutine).
            </p>
          </header>
          <form className="mt-4 grid gap-3" onSubmit={handleStackSubmit}>
            <input
              value={stackTitle}
              onChange={(event) => setStackTitle(event.target.value)}
              placeholder="Programmtitel"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <textarea
              value={stackSummary}
              onChange={(event) => setStackSummary(event.target.value)}
              placeholder="Beschreibung"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Wochentage</label>
              <div className="flex flex-wrap gap-2">
                {HOUSEHOLD_WEEKDAYS.map((day) => {
                  const isSelected = stackWeekdays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        setStackWeekdays((prev) =>
                          isSelected
                            ? prev.filter((d) => d !== day.value)
                            : [...prev, day.value]
                        );
                        if (isSelected) {
                          const next = { ...stackStartTimes };
                          delete next[day.value];
                          setStackStartTimes(next);
                        }
                      }}
                      className={cn(
                        "h-8 w-8 rounded-full text-xs font-bold transition-all",
                        isSelected
                          ? "bg-daisy-500 text-white shadow-md"
                          : "border border-daisy-200 bg-white text-gray-500 hover:bg-daisy-50"
                      )}
                    >
                      {day.label.slice(0, 2)}
                    </button>
                  );
                })}
              </div>
              {stackWeekdays.length > 0 && (
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-daisy-100 bg-daisy-50/50 p-3">
                  {stackWeekdays
                    .sort((a, b) => a - b)
                    .map((dayValue) => {
                      const dayLabel =
                        HOUSEHOLD_WEEKDAYS.find((d) => d.value === dayValue)?.label ?? "";
                      return (
                        <div key={dayValue} className="flex items-center gap-2">
                          <span className="w-8 text-xs font-medium text-gray-500">
                            {dayLabel.slice(0, 2)}
                          </span>
                          <input
                            type="time"
                            value={stackStartTimes[dayValue] || ""}
                            onChange={(e) =>
                              setStackStartTimes((prev) => ({
                                ...prev,
                                [dayValue]: e.target.value
                              }))
                            }
                            className="flex-1 rounded-lg border border-daisy-200 px-2 py-1 text-sm shadow-sm"
                          />
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            <input
              type="number"
              value={stackDuration ?? ""}
              onChange={(e) => setStackDuration(e.target.value ? Number(e.target.value) : null)}
              placeholder="Dauer (Minuten)"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <div className="flex gap-3">
              <input
                type="time"
                value={stackStartTime}
                onChange={(e) => setStackStartTime(e.target.value)}
                className="flex-1 rounded-2xl border border-daisy-200 px-4 py-3"
              />
              {stackStartTime && stackDuration && (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-daisy-100 bg-daisy-50 text-sm text-daisy-700">
                  Ende:{" "}
                  {(() => {
                    const [h, m] = stackStartTime.split(":").map(Number);
                    const end = new Date();
                    end.setHours(h, m + stackDuration);
                    return end.toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                  })()}
                </div>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-[2fr,auto]">
              <select
                value={stackSelection}
                onChange={(event) => setStackSelection(event.target.value)}
                className="rounded-2xl border border-daisy-200 px-4 py-3"
              >
                <option value="">Programm wählen…</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.slug}>
                    {program.code} — {program.name}
                  </option>
                ))}
              </select>
              <Button type="button" onClick={addStackProgram}>
                Modul hinzufügen
              </Button>
            </div>
            {stackPrograms.length > 0 && (
              <ol className="space-y-2 rounded-2xl border border-daisy-100 bg-white/70 p-4 text-sm text-gray-700">
                {stackPrograms.map((slug, index) => {
                  const program = programs.find((entry) => entry.slug === slug);
                  return (
                    <li key={slug} className="flex items-center justify-between gap-4">
                      <span>
                        {index + 1}. {program?.name ?? slug}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeStackProgram(slug)}
                      >
                        Entfernen
                      </Button>
                    </li>
                  );
                })}
              </ol>
            )}
            <Button type="submit">Programm speichern</Button>
          </form>
          {programStacks.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {programStacks.map((stack) => (
                <li
                  key={stack.id}
                  className="flex items-center justify-between rounded-2xl border border-daisy-100 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{stack.title}</p>
                    <p className="text-xs text-gray-500">
                      {stack.programSlugs.length} Module – {stack.summary}
                      {stack.weekdays && stack.weekdays.length > 0 && ` · ${formatWeekdays(stack.weekdays)}`}
                      {stack.durationMinutes && ` · ${stack.durationMinutes} Min.`}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => openEditStack(stack)}>
                    Bearbeiten
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>,
        <Layers className="h-6 w-6" />
      )}

      {renderAccordionSection(
        "human-connections",
        "Humans",
        "Kontakte & Aktivitäten",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Human Connections</h2>
            <p className="text-sm text-gray-500">
              Personen anlegen, Beziehungen taggen und Daily/Weekly Touchpoints vergeben.
            </p>
          </header>
          <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleHumanContactSubmit}>
            <input
              value={humanContactForm.name}
              onChange={(event) =>
                setHumanContactForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Personenname"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <select
              value={humanContactForm.relation}
              onChange={(event) =>
                setHumanContactForm((prev) => ({
                  ...prev,
                  relation: event.target.value as HumanContactRelation
                }))
              }
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            >
              {HUMAN_RELATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <textarea
              value={humanContactForm.note}
              onChange={(event) =>
                setHumanContactForm((prev) => ({ ...prev, note: event.target.value }))
              }
              placeholder="Notiz / Kontext"
              className="rounded-2xl border border-daisy-200 px-4 py-3 md:col-span-2"
            />
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={humanContactSaving}>
                {humanContactSaving
                  ? "Speichert…"
                  : editingHumanContact
                    ? "Kontakt aktualisieren"
                    : "Kontakt speichern"}
              </Button>
              {editingHumanContact && (
                <Button type="button" variant="ghost" onClick={resetHumanContactForm}>
                  Abbrechen
                </Button>
              )}
            </div>
          </form>
          {humanContactError && (
            <p className="mt-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
              {humanContactError}
            </p>
          )}
          <div className="mt-6 space-y-4">
            {sortedHumanContacts.length === 0 ? (
              <p className="rounded-3xl border border-daisy-100 bg-white/80 px-4 py-6 text-sm text-gray-500">
                Noch keine Kontakte erfasst. Nutze das Formular, um Familie, Partner oder Business
                Partner anzulegen.
              </p>
            ) : (
              sortedHumanContacts.map((person) => {
                const assignmentSet = new Set(
                  person.assignments.map(
                    (assignment) => `${assignment.cadence}:${assignment.activity}`
                  )
                );
                const stats = humanStatsById[person.id];
                return (
                  <article
                    key={person.id}
                    className="rounded-3xl border border-daisy-100 bg-white/80 p-5 shadow-sm"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-gray-400">
                          {getHumanRelationLabel(person.relation)}
                        </p>
                        <h4 className="text-lg font-semibold text-gray-900">{person.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => startEditHumanContact(person)}
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => deleteHumanContact(person.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </header>
                    {person.note && (
                      <p className="mt-2 text-sm text-gray-600">{person.note}</p>
                    )}
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {HUMAN_CADENCE_OPTIONS.map((cadence) => (
                        <div key={cadence.value} className="rounded-2xl border border-daisy-100 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                            {cadence.label}
                          </p>
                          <div className="mt-2 space-y-2">
                            {HUMAN_ACTIVITY_OPTIONS.map((activity) => {
                              const assignmentKey = `${cadence.value}:${activity.value}`;
                              const checked = assignmentSet.has(assignmentKey);
                              const busy =
                                humanAssignmentBusyKey ===
                                `${person.id}:${cadence.value}:${activity.value}`;
                              return (
                                <label
                                  key={assignmentKey}
                                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                                >
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-daisy-500 focus:ring-daisy-500"
                                    checked={checked}
                                    disabled={busy}
                                    onChange={() =>
                                      toggleHumanAssignment(
                                        person.id,
                                        cadence.value,
                                        activity.value,
                                        !checked
                                      )
                                    }
                                  />
                                  <span>{activity.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-2xl border border-daisy-100 bg-white/90 p-3">
                      {stats && stats.total > 0 ? (
                        <>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                            Kontaktverteilung (30 Tage)
                          </p>
                          <div className="mt-2 space-y-2">
                            {stats.distribution.map((entry) => {
                              const width =
                                entry.percentage > 0
                                  ? entry.percentage
                                  : entry.count > 0
                                    ? 6
                                    : 0;
                              return (
                                <div key={entry.activity} className="flex items-center gap-3 text-xs">
                                  <span className="w-28 text-gray-500">
                                    {getHumanActivityLabel(entry.activity)}
                                  </span>
                                  <div className="relative h-2 flex-1 rounded-full bg-daisy-100">
                                    <div
                                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-daisy-400 to-daisy-600"
                                      style={{ width: `${width}%` }}
                                    />
                                  </div>
                                  <span className="w-6 text-right font-semibold text-gray-700">
                                    {entry.count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Noch keine Aktivitäten protokolliert.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>,
        <Users className="h-6 w-6" />
      )}

      {renderAccordionSection(
        "rewards",
        "Belohnungen",
        "Reward Verwaltung",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Belohnungen verwalten</h2>
            <p className="text-sm text-gray-500">
              Aktive Rewards: {rewards.filter((r) => r.active).length}
            </p>
          </header>

          <div className="mt-4 grid gap-3">
            <input
              value={rewardName}
              onChange={(event) => setRewardName(event.target.value)}
              placeholder="Belohnungsname"
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <input
              type="number"
              value={rewardCost}
              onChange={(event) => setRewardCost(Number(event.target.value))}
              className="rounded-2xl border border-daisy-200 px-4 py-3"
            />
            <Button onClick={createReward}>Belohnung speichern</Button>
          </div>

          <div className="mt-8 space-y-4">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-2xl border border-daisy-100 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{reward.name}</p>
                    {!reward.active && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        Inaktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{reward.cost} XP</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => toggleRewardActive(reward.id, reward.active)}
                  >
                    {reward.active ? "Deaktivieren" : "Aktivieren"}
                  </Button>
                  <Button
                    className="bg-red-500 text-white hover:bg-red-600"
                    onClick={() => deleteReward(reward.id)}
                  >
                    Löschen
                  </Button>
                </div>
              </div>
            ))}
            {rewards.length === 0 && (
              <p className="text-center text-sm text-gray-400">
                Keine Belohnungen angelegt.
              </p>
            )}
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
              <p className="font-bold">DEBUG DATA ({rewards.length}):</p>
              <pre>{JSON.stringify(rewards, null, 2)}</pre>
            </div>
          </div>
        </>,
        <Gift className="h-6 w-6" />
      )}

      {renderAccordionSection(
        "xp-center",
        "XP Center",
        "Experience & Leveling",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">XP Center</h2>
            <p className="text-sm text-gray-500">
              Konfiguriere XP-Regeln und Multiplikatoren für das System.
            </p>
          </header>
          <div className="mt-6 space-y-6">
            <div className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Tages-Bonus</h3>
              <p className="text-sm text-gray-500 mb-4">Bonus-XP für das Abschließen aller Tages-Stacks.</p>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  defaultValue={500}
                  className="rounded-2xl border border-daisy-200 px-4 py-3 w-32"
                />
                <span className="text-sm font-bold text-daisy-600">XP</span>
                <Button onClick={() => alert("XP Bonus gespeichert (Stub)")}>Update</Button>
              </div>
            </div>
          </div>
        </>,
        <GaugeCircle className="h-6 w-6" />
      )}

      {renderAccordionSection(
        "cards",
        "Cards",
        "Mind Module & Assets",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Cards verwalten</h2>
            <p className="text-sm text-gray-500">
              Sammle hier alle Änderungen für die Mind Program Cards.
            </p>
          </header>

          <div className="mt-6 space-y-8">
            <article
              id="cards-visuals"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Visualisierungstraining Card
                </p>
                <h3 className="text-xl font-semibold">Visualisierungstraining Assets</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.visuals} aktive Visual Cards – Checkbox-Galerie im Mind Programm.
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
                      setVisualDataUrl(typeof reader.result === "string" ? reader.result : null);
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

            <article
              id="cards-performance-checklist"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Performance Checklist Card
                </p>
                <h3 className="text-xl font-semibold">Performance Checklist</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.performanceItems} Bereiche mit 5er-Rating (State, Haltung, etc.).
                </p>
              </header>
              <form className="mt-4 grid gap-3" onSubmit={handlePerformanceSubmit}>
                <input
                  value={performanceForm.label}
                  onChange={(event) =>
                    setPerformanceForm((prev) => ({ ...prev, label: event.target.value }))
                  }
                  placeholder="Bereich (z.B. State)"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <textarea
                  value={performanceForm.summary}
                  onChange={(event) =>
                    setPerformanceForm((prev) => ({ ...prev, summary: event.target.value }))
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

            <article
              id="cards-reading"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Mind Lesen
                </p>
                <h3 className="text-xl font-semibold">Lesen · Bücherliste</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.readingBooks} Bücher stehen im Leselog Dropdown zur Auswahl.
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
                    setReadingBookForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Buchtitel (z.B. Atomic Habits)"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={readingBookForm.author}
                  onChange={(event) =>
                    setReadingBookForm((prev) => ({ ...prev, author: event.target.value }))
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
                        {book.author && (
                          <p className="text-xs text-gray-500">{book.author}</p>
                        )}
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



            {/* DAY VIEW CARD */}
            <article
              id="cards-day-view"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Tagesansicht
                </p>
                <h3 className="text-xl font-semibold">Tagesansicht Konfiguration</h3>
                <p className="text-sm text-gray-500">
                  Einstellungen für die Day-View (z.B. Startzeiten, Standard-Zoom).
                </p>
              </header>
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Standard Start-Zeit der Timeline:</p>
                <input
                  type="time"
                  defaultValue="06:00"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <Button className="ml-4" onClick={() => alert("Einstellung gespeichert (Stub)")}>Speichern</Button>
              </div>
            </article>

            <article
              id="cards-household"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Haushalt Environment Cards
                </p>
                <h3 className="text-xl font-semibold">Haushalts Karten</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.householdCards} aktive Karten · Wochentage + Aufgaben definieren.
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
                    <p className="mt-4 text-xs text-gray-500">
                      Noch keine Aufgaben definiert.
                    </p>
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
                        setHouseholdCardForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Titel (z.B. Montag Reset)"
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3 text-sm"
                    />
                    <textarea
                      value={householdCardForm.summary}
                      onChange={(event) =>
                        setHouseholdCardForm((prev) => ({ ...prev, summary: event.target.value }))
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
                            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${householdCardForm.taskIds.includes(task.id)
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

            <article
              id="cards-goals"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: SMART Ziele Card
                </p>
                <h3 className="text-xl font-semibold">SMART Ziele</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.goals} Ziele mit täglichem Check-in und Progress Balken.
                </p>
              </header>
              <form className="mt-4 grid gap-3" onSubmit={handleGoalSubmit}>
                {(["title", "specific", "measurable", "achievable", "relevant", "timeBound"] as const).map(
                  (field) => (
                    <textarea
                      key={field}
                      value={goalForm[field]}
                      onChange={(event) =>
                        setGoalForm((prev) => ({ ...prev, [field]: event.target.value }))
                      }
                      placeholder={field.toUpperCase()}
                      className="rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  )
                )}
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
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, unit: event.target.value }))}
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
                        <p className="text-xs text-gray-500">
                          {goal.latestProgress ?? 0}% erreicht
                        </p>
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

            <article
              id="cards-brain"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Brain Training Gym Card
                </p>
                <h3 className="text-xl font-semibold">Brain Training Übungen</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.brainExercises} Brain Gym Items mit Bewertung.
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

            <article
              id="cards-learning"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Higher Thinking Card
                </p>
                <h3 className="text-xl font-semibold">Higher Thinking Pfade</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.learningPaths} Lernpfade & {learningPaths.reduce((sum, path) => sum + path.milestones.length, 0)} Milestones.
                </p>
              </header>
              <form className="mt-4 grid gap-3" onSubmit={handlePathSubmit}>
                <input
                  value={pathForm.title}
                  onChange={(event) => setPathForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Titel"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <input
                  value={pathForm.theme}
                  onChange={(event) => setPathForm((prev) => ({ ...prev, theme: event.target.value }))}
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

            <article
              id="cards-emotion"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: Emotion Training Card
                </p>
                <h3 className="text-xl font-semibold">Emotion Training</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.emotionPractices} Regulation Guides inkl. Grounding-Prompt.
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

            <article
              id="cards-meditation"
              className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm"
            >
              <header className="flex flex-col gap-1">
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Ändert: MED Meditation Card
                </p>
                <h3 className="text-xl font-semibold">MED Meditation</h3>
                <p className="text-sm text-gray-500">
                  {mindStats.meditations} Meditationen · {meditationStepCount} Steps im Dropdown Flow.
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
                            {flow.summary && (
                              <p className="text-sm text-gray-600">{flow.summary}</p>
                            )}
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
                          <form className="space-y-2 rounded-2xl border border-daisy-100 bg-white/80 p-3" onSubmit={handleMeditationUpdate}>
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

                        <form className="grid gap-2 rounded-2xl border border-daisy-100 bg-white/80 p-3" onSubmit={handleStepSubmit(flow.id)}>
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
          </div >
        </>,
        <LayoutGrid className="h-6 w-6" />
      )
      }
      {
        renderAccordionSection(
          "xp-control-center",
          "XP Center",
          "XP Verwaltung",
          <>
            <header className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">XP Control Center</h2>
              <p className="text-sm text-gray-500">
                Passe die XP Vergabe je Programmkarte (z.B. MG1 — SMART Ziele) an. Änderungen wirken
                sofort für neue Runs und damit auch auf das Score Dashboard.
              </p>
            </header>

            <div className="mt-6 space-y-8">
              {performanceProgram && (
                <article className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
                  <header className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      XP · Performance Checklist
                    </p>
                    <h3 className="text-xl font-semibold">PC1 — {performanceProgram.name}</h3>
                    <p className="text-sm text-gray-500">
                      Direkter Zugriff auf die neue Checklist XP (aktuell +{performanceProgram.xpReward} XP).
                    </p>
                  </header>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      type="number"
                      min={0}
                      value={
                        programXpDrafts[performanceProgram.id] ?? String(performanceProgram.xpReward)
                      }
                      onChange={(event) =>
                        updateProgramXpDraft(
                          performanceProgram.id,
                          event.target.value,
                          performanceProgram.xpReward
                        )
                      }
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                    <Button
                      type="button"
                      onClick={() => persistProgramXp(performanceProgram)}
                      disabled={savingProgramId === performanceProgram.id}
                    >
                      {savingProgramId === performanceProgram.id ? "Speichert…" : "XP speichern"}
                    </Button>
                  </div>
                </article>
              )}
              {householdProgram && (
                <article className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
                  <header className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      XP · Haushalt
                    </p>
                    <h3 className="text-xl font-semibold">EN2 — {householdProgram.name}</h3>
                    <p className="text-sm text-gray-500">
                      Steuert die XP pro gespeicherter Haushaltskarte (+{householdProgram.xpReward} XP).
                    </p>
                  </header>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      type="number"
                      min={0}
                      value={programXpDrafts[householdProgram.id] ?? String(householdProgram.xpReward)}
                      onChange={(event) =>
                        updateProgramXpDraft(
                          householdProgram.id,
                          event.target.value,
                          householdProgram.xpReward
                        )
                      }
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                    <Button
                      type="button"
                      onClick={() => persistProgramXp(householdProgram)}
                      disabled={savingProgramId === householdProgram.id}
                    >
                      {savingProgramId === householdProgram.id ? "Speichert…" : "XP speichern"}
                    </Button>
                  </div>
                </article>
              )}
              {readingProgram && (
                <article className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
                  <header className="flex flex-col gap-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                      XP · Lesen
                    </p>
                    <h3 className="text-xl font-semibold">MR1 — {readingProgram.name}</h3>
                    <p className="text-sm text-gray-500">
                      Bestimmt die XP pro Leselog (+{readingProgram.xpReward} XP).
                    </p>
                  </header>
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <input
                      type="number"
                      min={0}
                      value={programXpDrafts[readingProgram.id] ?? String(readingProgram.xpReward)}
                      onChange={(event) =>
                        updateProgramXpDraft(
                          readingProgram.id,
                          event.target.value,
                          readingProgram.xpReward
                        )
                      }
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                    <Button
                      type="button"
                      onClick={() => persistProgramXp(readingProgram)}
                      disabled={savingProgramId === readingProgram.id}
                    >
                      {savingProgramId === readingProgram.id ? "Speichert…" : "XP speichern"}
                    </Button>
                  </div>
                </article>
              )}
              <article className="rounded-3xl border border-daisy-100 bg-white/80 p-6 shadow-sm">
                <header className="flex flex-col gap-1">
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    XP · Programm Karten
                  </p>
                  <h3 className="text-xl font-semibold">XP je Karte steuern</h3>
                  <p className="text-sm text-gray-500">
                    Wird beim nächsten Programm Run verwendet und verteilt sich automatisch auf die XP
                    Kategorien.
                  </p>
                </header>
                {sortedPrograms.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">Noch keine Programme vorhanden.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {sortedPrograms.map((program) => {
                      const value = programXpDrafts[program.id] ?? String(program.xpReward);
                      const isSaving = savingProgramId === program.id;
                      return (
                        <div
                          key={program.id}
                          className="flex flex-col gap-3 rounded-2xl border border-daisy-100 bg-white/90 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {program.code} — {program.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Aktuell +{program.xpReward} XP · {program.category}
                              </p>
                            </div>
                            <span className="rounded-full bg-daisy-50 px-3 py-1 text-xs font-semibold text-daisy-700">
                              {program.mode === "flow" ? "Flow" : "Single"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <input
                              type="number"
                              min={0}
                              value={value}
                              onChange={(event) =>
                                updateProgramXpDraft(program.id, event.target.value, program.xpReward)
                              }
                              className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                            />
                            <Button
                              type="button"
                              onClick={() => persistProgramXp(program)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Speichern…" : "XP aktualisieren"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>
          </>,
          <GaugeCircle className="h-6 w-6" />
        )
      }

      {
        editingStack && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Programm bearbeiten
                  </p>
                  <h3 className="text-xl font-semibold">{editingStack.title}</h3>
                </div>
                <Button variant="ghost" type="button" onClick={() => setEditingStack(null)}>
                  Schließen
                </Button>
              </header>

              <form className="mt-4 space-y-3" onSubmit={handleStackUpdate}>
                <input
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Titel"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <textarea
                  value={editSummary}
                  onChange={(event) => setEditSummary(event.target.value)}
                  placeholder="Beschreibung"
                  className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700">Wochentage</label>
                  <div className="flex flex-wrap gap-2">
                    {HOUSEHOLD_WEEKDAYS.map((day) => {
                      const isSelected = editWeekdays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            setEditWeekdays((prev) =>
                              isSelected
                                ? prev.filter((d) => d !== day.value)
                                : [...prev, day.value]
                            );
                            if (isSelected) {
                              const next = { ...editStartTimes };
                              delete next[day.value];
                              setEditStartTimes(next);
                            }
                          }}
                          className={cn(
                            "h-8 w-8 rounded-full text-xs font-bold transition-all",
                            isSelected
                              ? "bg-daisy-500 text-white shadow-md"
                              : "border border-daisy-200 bg-white text-gray-500 hover:bg-daisy-50"
                          )}
                        >
                          {day.label.slice(0, 2)}
                        </button>
                      );
                    })}
                  </div>
                  {editWeekdays.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-daisy-100 bg-daisy-50/50 p-3">
                      {editWeekdays
                        .sort((a, b) => a - b)
                        .map((dayValue) => {
                          const dayLabel =
                            HOUSEHOLD_WEEKDAYS.find((d) => d.value === dayValue)?.label ?? "";
                          return (
                            <div key={dayValue} className="flex items-center gap-2">
                              <span className="w-8 text-xs font-medium text-gray-500">
                                {dayLabel.slice(0, 2)}
                              </span>
                              <input
                                type="time"
                                value={editStartTimes[dayValue] || ""}
                                onChange={(e) =>
                                  setEditStartTimes((prev) => ({
                                    ...prev,
                                    [dayValue]: e.target.value
                                  }))
                                }
                                className="flex-1 rounded-lg border border-daisy-200 px-2 py-1 text-sm shadow-sm"
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={editDuration ?? ""}
                  onChange={(e) => setEditDuration(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Dauer (Minuten)"
                  className="rounded-2xl border border-daisy-200 px-4 py-3"
                />
                <div className="flex gap-3">
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="flex-1 rounded-2xl border border-daisy-200 px-4 py-3"
                  />
                  {editStartTime && editDuration && (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-daisy-100 bg-daisy-50 text-sm text-daisy-700">
                      Ende:{" "}
                      {(() => {
                        const [h, m] = editStartTime.split(":").map(Number);
                        const end = new Date();
                        end.setHours(h, m + editDuration);
                        return end.toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                      })()}
                    </div>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-[2fr,auto]">
                  <select
                    value={editSelection}
                    onChange={(event) => setEditSelection(event.target.value)}
                    className="rounded-2xl border border-daisy-200 px-4 py-3"
                  >
                    <option value="">Programm wählen…</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.slug}>
                        {program.code} — {program.name}
                      </option>
                    ))}
                  </select>
                  <Button type="button" onClick={addEditProgram}>
                    Modul hinzufügen
                  </Button>
                </div>
                {editPrograms.length > 0 && (
                  <ol className="space-y-2 rounded-2xl border border-daisy-100 bg-white/70 p-4 text-sm text-gray-700">
                    {editPrograms.map((slug, index) => {
                      const program = programs.find((entry) => entry.slug === slug);
                      return (
                        <li key={slug} className="flex items-center justify-between gap-4">
                          <span>
                            {index + 1}. {program?.name ?? slug}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => removeEditProgram(slug)}
                          >
                            Entfernen
                          </Button>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <div className="flex justify-end gap-3">
                  <Button variant="ghost" type="button" onClick={() => setEditingStack(null)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">Änderungen speichern</Button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        editingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
              <header className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Ziel bearbeiten</p>
                  <h3 className="text-xl font-semibold">{editingGoal.title}</h3>
                </div>
                <Button variant="ghost" type="button" onClick={() => setEditingGoal(null)}>
                  Schließen
                </Button>
              </header>

              <form className="mt-4 space-y-3" onSubmit={handleGoalUpdate}>
                {(["title", "specific", "measurable", "achievable", "relevant", "timeBound"] as const).map(
                  (field) => (
                    <textarea
                      key={field}
                      value={goalForm[field]}
                      onChange={(event) =>
                        setGoalForm((prev) => ({ ...prev, [field]: event.target.value }))
                      }
                      placeholder={field.toUpperCase()}
                      className="w-full rounded-2xl border border-daisy-200 px-4 py-3"
                    />
                  )
                )}
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
                    onChange={(event) => setGoalForm((prev) => ({ ...prev, unit: event.target.value }))}
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
        )
      }

      {
        logsModalGoal && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
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
              <div className="mt-4 max-h-[360px] overflow-y-auto space-y-3 text-sm text-gray-700">
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
        )
      }
    </div >
  );
}
