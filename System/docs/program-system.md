# Program Management Specification

## Overview
The Program system defines how Programs are described, created in the admin, scheduled into blocks, executed in a guided run-mode, and evaluated afterwards. This document extends the previous Program model so admins can capture rich metadata, goals, state/role mappings, rituals, quality checks, XP logic, and scheduling constraints without leaving the DAiS dashboard.

## 1. Program Data Model
Each Program persists as a domain aggregate spanning metadata, goals, ritual steps, measurement, XP rules, and scheduling information.

### 1.1 Metadata
| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | string | e.g. "Morning Mind Program". Unique per tenant. |
| `area` | enum[`Mind`,`Body`,`Human`,`Environment`,`Business`] | Drives Program menus and XP split. |
| `programType` | enum[`routine`,`training`,`healing`,`social`,`business`,`spiritual`,`brain`, …] | Controls iconography + runner defaults. |
| `frequency` | enum[`daily`,`weekly`,`adhoc`,`block-only`] | Determines scheduling hints and block assignments. |
| `estimatedDurationMinutes` | integer | Sum of ritual steps, editable while authoring. |
| `priority` | enum[`core`,`optional`] | Used by backlog sorting and analytics.

### 1.2 Goals
- `linkedGoalIds`: array referencing Goal entities (weight target, revenue goal, relationship target, …).
- `expectedOutcome`: long text explaining the intended change over time.

### 1.3 State & Role
| Field | Type | Notes |
| ----- | ---- | ----- |
| `desiredState` | enum/emotion taxonomy (Love, Happiness, Pride, Power, …) |
| `roleTags` | array[`hero`,`leader`,`business_man`,`family_man`,`innovator`, …] |
| `stateCheckBefore` / `stateCheckAfter` | optional scale 1–10 capture instructions the runner should surface before/after completion.

### 1.4 Ritual Steps
Ritual is an ordered list of steps executed by the runner.
- `index`: ordering, editable via drag & drop.
- `title`, `description`, `durationMinutes`.
- `stepType`: enum (`read`, `write`, `meditate`, `move`, `speak`, `plan`, `timer`, `check`, `rating`, `question`).
- `inputSchema`: optional config for text fields, checkbox groups, sliders, dropdowns, timers.

### 1.5 Quality / Measurement
- `qualityCriteria`: array of strings ("Mind >= 70% focus", "Program completed end-to-end").
- `ratings`: `focusScore`, `depthScore`, `satisfactionScore` (1–10). Additional checks may be derived from runner telemetry.
- `executionFeasibilityCheck`: boolean flag storing whether the planned time was realistic.

### 1.6 Result / Reflection
- `resultQuestions`: structured prompts ("What did I achieve?", "What changed in my state/behaviour?", "Key takeaway?").
- `learningTags`: optional chips/labels saved with the run for later filtering.

### 1.7 XP Rules
| Field | Type | Notes |
| ----- | ---- | ----- |
| `xpBaseValue` | integer | e.g. 50 or 100 XP per completion. |
| `xpConditions` | boolean flags referencing `isComplete`, `minQualityMet`, `customRulePassed`. |
| `xpDistribution` | object with percentages across Areas (must total 100). |

### 1.8 Technical Fields & Scheduling
- `status`: enum (`active`,`archived`,`experimental`). Archived Programs disappear from menus but remain reportable.
- `defaultTimeWindow`: e.g. "Morning Block", reused by scheduler.
- `version`: semantic version automatically incremented when authors publish edits.
- `blockAssignments`: relations to `DayBlock`/`WeekBlock`/`QuarterBlock` (90-Day plans).
- `menuLogicRules`: declarative conditions ("Morning menu", "Business block", "Family block" etc.) used when building dynamic menus.

## 2. Admin Authoring Flow
The admin modal follows a guided wizard inside a popover. Each card collects the required data to keep the author focused.
1. **Infos Card** – capture Metadata (name, area, type, frequency, duration, priority, status, default time window).
2. **Goals Card** – select linked goals, define expected outcomes.
3. **State & Role Card** – define desired state, role tags, optional state-check toggles.
4. **Ritual Card** – build ordered steps with drag & drop, configure per-step inputs.
5. **Quality Card** – specify quality criteria and rating sliders.
6. **Result Card** – define reflection questions and learning tags.
7. **XP Card** – set XP base value, conditions, and distribution.
The wizard enforces required fields (name, area, duration, at least one ritual step) and keeps autosave drafts; navigation shows overall progress ("Step 3 of 7").

## 3. Program Runner (Execution Mode)
- Launched via a clear "Program starten" button from menu or schedule entry.
- Renders full-screen with a sticky progress indicator ("3/7 Steps erledigt"), per-step timer controls (Start/Pause/Stop), and upcoming step preview.
- Each step displays title, description, optional media/notes, and interactive controls (checkboxes, text, ratings) as defined in `inputSchema`.
- Runner can pause/resume; partial state persists locally (IndexedDB/localStorage fallback) and server-side via `/api/program-runs/:id/draft`.
- Completion screen summarises ritual status, collects quality ratings, result questions, and shows XP earned + distribution.

### Resume Mode
- **Resume** re-enters a paused run, rehydrates timers, and updates progress.

## 4. Scheduling & Embedding
- Programs can be pinned into Morning/Midday/Evening menus or thematic blocks (Business, Family, Body).
- Additional relations allow weekly or 90-day assignments; scheduler UI shows eligible slots filtered by frequency.
- Recurrence rules (daily, weekly, selected weekdays) create upcoming instances stored as `ProgramSchedule` rows which the runner references when logging completions.

## 5. Quality, Result, XP & Analytics
- Post-run data writes to `ProgramRun` with `qualityScores`, `resultAnswers`, and `xpAwarded` (including breakdown per area).
- Quality guardrails evaluate `qualityCriteria` and block XP if thresholds fail.
- Analytics surfaces: run count, last execution timestamp, average quality, XP contribution, comparisons across Programs within the same area, and block coverage (e.g. % of Morning block filled with core Programs).

## 6. Functional Requirements
1. **Program CRUD** – create, edit, duplicate, archive/delete Programs with versioning.
2. **Templates** – DAiS-provided templates plus ability to save a Program as a template.
3. **Ritual Builder** – drag & drop ordering, per-step types, timers, and configurable inputs.
4. **Scheduling** – assign Programs to blocks (Morning, Business, Family, etc.) and recurrence definitions.
5. **Run Mode** – stepwise runner with timer, check functionality, interruption handling, quick mode, and progress indicator.
6. **Quality & Result Capture** – rating sliders/scales, result notes, optional feasibility check toggle.
7. **XP Logic** – configurable base XP, conditional awarding, area distribution.
8. **Analytics** – statistics dashboards for runs, XP contribution, quality averages, comparisons, and schedule visualisations.
9. **Goal & Journal Links** – attach Programs to goals and optionally push reflections into Journals.
10. **90-Day Plan Integration** – display Programs within quarterly planning views with completion signals.

## 7. Non-Functional Requirements
- **Usability** – Mobile-first wizard + runner; minimal input friction; inline validations with helpful defaults.
- **Performance** – No lag between steps; prefetch assets on step `n+1`; offline-friendly local cache for drafts.
- **Reliability** – Autosave during both authoring and running, resume flows must guard against data loss.
- **Consistency** – Maintain audit trails of Program versions and run history.
- **Extensibility** – Field schema stored as JSON schemas to support future step types or wearable integrations (e.g. pulse/sleep metrics for Body programs).

## 8. Implementation Notes
- Prisma: extend `Program` model with JSON columns for `ritual`, `quality`, `result`, `xpRules`, plus linking tables for goals and block assignments.
- API: update `/api/programs` to accept the new sections, enforce validation, and expose templates.
- Runner UI: reuse `ProgramStackRunner` controls but enhance with timers, progress indicator, quick/resume logic, and result capture surfaces.
- Scheduling: introduce `/api/program-schedule` endpoints plus hooks on dashboard tiles for Morning/Business block views.
- Analytics: add aggregations to `/api/programs/:id/stats` and include Program coverage metrics in `/api/xp/summary` or a new `/api/program-analytics` route.

This specification should be used to drive upcoming schema migrations, admin UI updates, and runner enhancements to deliver the full Program authoring and execution experience described in prompt_04.
