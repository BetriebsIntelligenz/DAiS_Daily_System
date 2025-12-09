"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { programDefinitions, rewardDefinitions } from "@/lib/data";
import { ProgramWizard } from "./program-wizard";
import type {
  BrainExerciseWithState,
  EmotionPracticeWithLogs,
  LearningPathWithProgress,
  MindGoalWithProgress,
  MindVisualizationAsset,
  ProgramDefinition,
  ProgramStackDefinition
} from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";


export function AdminPanels() {
  const [programName, setProgramName] = useState("");
  const [category, setCategory] = useState("mind");
  const [programs, setPrograms] = useState<ProgramDefinition[]>(programDefinitions);
  const [rewardName, setRewardName] = useState("");
  const [rewardCost, setRewardCost] = useState(1000);

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
  const [editingStack, setEditingStack] = useState<ProgramStackDefinition | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editPrograms, setEditPrograms] = useState<string[]>([]);
  const [editSelection, setEditSelection] = useState(
    programDefinitions[0]?.slug ?? ""
  );

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
  const [programXpDrafts, setProgramXpDrafts] = useState<Record<string, string>>({});
  const [savingProgramId, setSavingProgramId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "program-builder": true
  });

  const mindStats = useMemo(
    () => ({
      visuals: visualAssets.length,
      goals: goals.length,
      brainExercises: brainExercises.length,
      learningPaths: learningPaths.length,
      emotionPractices: emotionPractices.length
    }),
    [visualAssets, goals, brainExercises, learningPaths, emotionPractices]
  );
  const sortedPrograms = useMemo(
    () => programs.slice().sort((left, right) => left.code.localeCompare(right.code)),
    [programs]
  );
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
    content: ReactNode
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
              {subtitle}
            </p>
            <p className="text-xl font-semibold text-gray-900">{title}</p>
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
      stackPayload,
      programPayload
    ] = await Promise.all([
      loadJson("/api/mind/visuals"),
      loadJson("/api/mind/goals"),
      loadJson("/api/mind/brain-exercises"),
      loadJson("/api/mind/learning-paths"),
      loadJson("/api/mind/emotions"),
      loadJson("/api/program-stacks"),
      loadJson("/api/programs")
    ]);
    setVisualAssets(Array.isArray(visuals) ? visuals : []);
    setGoals(Array.isArray(goalsPayload) ? goalsPayload : []);
    setBrainExercises(Array.isArray(brainPayload) ? brainPayload : []);
    setLearningPaths(Array.isArray(pathsPayload) ? pathsPayload : []);
    setEmotionPractices(Array.isArray(emotionPayload) ? emotionPayload : []);
    setProgramStacks(Array.isArray(stackPayload) ? stackPayload : []);
    setPrograms(
      Array.isArray(programPayload) && programPayload.length > 0
        ? (programPayload as ProgramDefinition[])
        : programDefinitions
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
    alert("Belohnung gespeichert.");
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
        programSlugs: stackPrograms
      })
    });
    setStackTitle("");
    setStackSummary("");
    setStackPrograms([]);
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
        programSlugs: editPrograms
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


  return (
    <div className="space-y-6">
      {renderAccordionSection(
        "program-builder",
        "Program Builder",
        "Blueprint & Wizard",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Programm Blueprint</h2>
            <p className="text-sm text-gray-500">
              Erstelle neue Programme inklusive Rituale, XP und Scheduling.
            </p>
          </header>
          <div className="mt-4">
            <ProgramWizard onCreated={refreshMindData} />
          </div>
        </>
      )}

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
                    </p>
                  </div>
                  <Button type="button" variant="ghost" onClick={() => openEditStack(stack)}>
                    Bearbeiten
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {renderAccordionSection(
        "rewards",
        "Belohnungen",
        "Reward Verwaltung",
        <>
          <header className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold">Belohnungen verwalten</h2>
            <p className="text-sm text-gray-500">
              Aktive Rewards: {rewardDefinitions.filter((r) => r.active).length}
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
        </>
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
          </div>
        </>
      )}
      {renderAccordionSection(
        "xp-center",
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
        </>
      )}

      {editingStack && (
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
      )}

      {editingGoal && (
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
      )}

      {logsModalGoal && (
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
      )}
    </div>
  );
}
