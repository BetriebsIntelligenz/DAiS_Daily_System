# DAiS Applikation – Technische Dokumentation

## Überblick

Die DAiS App ist eine mobile-first Next.js 14 Anwendung für das Management von Coaching-Programmen inkl. XP-System, Rewards, Journals sowie spezialisierten Mind-Flows. Sie bündelt:

- ein kategorisiertes Programm-Menü (Mind/Body/Human/Environment/Business) mit Flow-Stacks,
- dynamische Formulare für Programme, Units und Exercises,
- Gamification-Funktionalitäten (Scoreboard, XP-Transaktionen, Reward-Einlösung),
- Journale sowie Mind-spezifische Module (Visualisierung, SMART-Ziele, Emotionstraining),
- ein Admin-Dashboard zur Pflege von Programmen, Rewards und Mind-Daten.

Der Code befindet sich unter `src/`, Prisma und Seeds unter `prisma/` bzw. `src/lib`. Für lokale Tests siehe zusätzlich `docs/LOCAL_TESTING.md`.

## Architektur im Überblick

| Ebene               | Technologie / Pfad                                   | Beschreibung |
| ------------------- | ---------------------------------------------------- | ------------ |
| UI / Rendering      | `src/app` (App Router), `src/components`             | React 18 mit Server Components, TailwindCSS und hoch wiederverwendbaren UI-Bausteinen (`ui/button`, `ui/card`, `MobileShell`). |
| State & Auth        | `src/components/auth-gate.tsx`, `src/contexts/*`     | Lightweight Auth-Gate mit LocalStorage (Passwörter `Testingit100!` bzw. `dais2025`) sowie Contexts für Program-Completion. |
| Backend / APIs      | `src/app/api/**`                                     | Next.js Route-Handler implementieren CRUD- und Workflow-Endpunkte (Programme, Runs, Rewards, Journale, Mind-Domänen, XP-Summary). |
| Domain Layer        | `src/lib/*`, `src/server/*`                          | Typsichere Definitionen (`types.ts`), Seed-Daten (`data.ts`, `mind-data.ts`) und serverseitige Services (z. B. `program-run-service.ts`). |
| Persistenz          | PostgreSQL via Prisma Client (`src/lib/prisma.ts`)   | Datenmodell siehe Abschnitt „Persistentes Datenmodell“. Seeds werden über `prisma/seed.ts` eingespielt. |

### Frontend-Patterns

- **MobileShell** kapselt das Branding-Layout und die Navigation (Home, Score, Timeline, Rewards, Journale, Admin).
- **ProgramContent** entscheidet, ob ein Programm über Standardformular (`ProgramForm`) oder über einen spezialisierten Mind-Renderer (z. B. SMART Goals) ausgespielt wird.
- **ProgramStackRunner** orchestriert mehrstufige Flows, merkt sich Fortschritt und schaltet den Continue-Button nur frei, wenn das aktuelle Modul abgeschlossen ist.
- Client-seitige Hooks (`useProgramCompletion`, `useAuth`) kapseln wiederkehrende UX-Logik.

### Backend-Komponenten

- **Program Run Service** (`src/server/program-run-service.ts`) sorgt dafür, dass Program Definitionen aus dem Seed nachträglich persistiert werden, wenn sie noch nicht in Postgres existieren, und bucht XP inklusive `XpTransaction`.
- **XP & Timeline**: `/api/xp/summary` aggregiert Earn/Spend pro Kategorie. `/api/timeline` sammelt Program Runs, Journal Entries und Reward Redemptions zu einer Activity Feed Response.
- **Mind-Domänen**: Für Visualizations, SMART Goals, Brain Exercises, Learning Paths und Emotion Practices existieren jeweils READ/WRITE-Endpunkte sowie spezialisierte Aktionen (z. B. Goal Check-ins, Brain Exercise Completion, Milestone Toggle, Emotion Logs).

## Verzeichnisstruktur (Auszug)

| Pfad                         | Zweck |
| --------------------------- | ----- |
| `src/app/`                  | App-Router Pages wie `/`, `/score`, `/timeline`, `/rewards`, `/journals`, `/admin` samt `api/` Routes. |
| `src/components/`           | Wiederverwendbare UI-Bausteine (Dashboard Cards, Journal Board, Rewards Grid, Admin Panels, Mind-spezifische Views). |
| `src/lib/`                  | Seed-Daten (`data.ts`, `mind-data.ts`), Typdefinitionen, Prisma-Client bootstrap sowie Demo-User Helper. |
| `src/server/`               | Backend-Services für Programmläufe. |
| `prisma/`                   | Migrationen und Seeds (`seed.ts`). Schema liegt unter `src/pages/schema.prisma`. |
| `seed-data/`                | SQL-Snippets für manuelle Datenimporte. |
| `docs/LOCAL_TESTING.md`     | Schritt-für-Schritt-Anleitung für lokalen Betrieb (Docker + Prisma). |
| `System/docs/`              | Technische Dokumente (dieses Dokument). |

## Kernmodule & Flows

1. **Programm-Menü & Stacks (`src/app/page.tsx`, `ProgramStackRunner`)**
   - liest Kategorien und Program-Definitionen (`src/lib/data.ts`),
   - holt verfügbare ProgramStacks via `/api/program-stacks` und zeigt modulare Flow-Optionen,
   - Program Forms persistieren anhand der Server-API `/api/program-runs`.

2. **Score Dashboard (`src/app/score/page.tsx`, `ScoreCards`)**
   - kombiniert `/api/timeline?limit=100` und `/api/xp/summary` um Gesamt-XP, Kategorie-Splits und die letzten Aktivitäten zu rendern.

3. **Activity Timeline (`TimelineFeed`)**
   - polled alle 7 Sekunden `/api/timeline`,
   - Einträge enthalten Normalisierungen (z. B. Formatierung von Checkbox/Scale-Antworten, XP-Signierung).

4. **Rewards & XP Management (`RewardsGrid`)**
   - `GET /api/rewards` liefert Rewards + Redemptions + Balance,
   - `/api/rewards/redeem` bucht XP als `spend` und deaktiviert Rewards,
   - `/api/rewards/relist` setzt Rewards wieder aktiv und markiert Redemptions als abgeschlossen.

5. **Journale (`JournalBoard`)**
   - nutzt `journalDefinitions` als Tabs,
   - `/api/journals` legt per POST WYSIWYG-ähnliche HTML-Inhalte ab, GET liefert die letzten 50 Einträge.

6. **Mind-spezifische Programme (`src/components/mind/*`)**
   - SMART Goals: zieht Ziele + Checkins über `/api/mind/goals` und erstellt Checkins via `/api/mind/goals/checkins`.
   - Brain Training: liest Übungen (`/api/mind/brain-exercises`), erstellt Sessions über `/api/mind/brain-exercises/[exerciseId]/complete`.
   - Higher Thinking: Learning Paths + Milestones von `/api/mind/learning-paths` inkl. Toggle-Route.
   - Emotion Training: Practices + Logs (`/api/mind/emotions`, `/api/mind/emotions/logs`).
   - Visualization Training: nutzt Assets (`/api/mind/visuals`) für die Mind-Gallerie.

7. **Admin-Dashboard (`AdminPanels`)**
   - erlaubt das Anlegen einfacher Program-Stubs, Rewards und Program Stacks,
   - pflegt Mind-Assets, SMART Goals, Brain Exercises, Learning Paths und Emotion Practices über die jeweiligen APIs,
   - stellt-Kennzahlen (z. B. Anzahl Visuals/Goals) aggregiert dar.

## API-Überblick

| Methode | Pfad | Zweck |
| ------- | ---- | ----- |
| `GET` / `POST` | `/api/programs` | Programme auflisten bzw. neue Stubs erstellen (inkl. Units/Exercises via Prisma Include). |
| `POST` | `/api/program-runs` | Programm-Run anlegen, XP buchen (delegiert an `createProgramRun`). |
| `GET` | `/api/program-stacks` | Flow-Stacks (Sequenzen aus Programmen) lesen. |
| `POST` | `/api/program-stacks` | Stack mit Slug und Program-Slugs anlegen (validiert gegen Seed-Daten). |
| `GET` | `/api/rewards` | Rewards, Redemptions und Benutzer-XP laden. |
| `POST` | `/api/rewards`, `/api/rewards/redeem`, `/api/rewards/relist` | Reward erstellen, XP-Verbrauch + Redemption starten, Rewards erneut listen. |
| `GET` / `POST` | `/api/journals` | Journal-Einträge laden bzw. speichern (User wird bei Bedarf angelegt). |
| `GET` | `/api/xp/summary` | XP-Summen + Kategorie-Balances für aktuellen Benutzer. |
| `GET` | `/api/timeline` | Aktivitätenfeed aus Program Runs, Journals und Reward Redemptions. |
| `GET` / `POST` | `/api/mind/visuals`, `/api/mind/goals`, `/api/mind/brain-exercises`, `/api/mind/learning-paths`, `/api/mind/emotions` | CRUD für Mind-spezifische Artefakte. |
| `POST` | `/api/mind/goals/checkins`, `/api/mind/brain-exercises/[id]/complete`, `/api/mind/learning-paths/[path]/milestones/[milestone]/toggle`, `/api/mind/emotions/logs` | Workflow-spezifische Aktionen (Checkins, Sessions, Milestone-Status, Emotion Logs). |

Alle Endpunkte nutzen denselben Prisma-Client (`src/lib/prisma.ts`) und – falls keine echte Auth vorhanden – `getOrCreateDemoUser`, sodass Tests ohne vollwertige Auth-Infrastruktur möglich sind.

## Persistentes Datenmodell

Wesentlicher Ausschnitt der Prisma-Modelle (`src/pages/schema.prisma`):

- **User** – zentrale ID für Program Runs, XP-Transaktionen, Rewards, Journals, Mind-Checkins und Emotion Logs.
- **Program & ProgramUnit & Exercise** – strukturieren Programme nach Units/Exercises mit `xpValue` und `config`.
- **ProgramRun** – speichert Mode, XP, Antworten (`Json`) und referenziert `XpTransaction`.
- **ProgramStack** – dynamische Sequenzen (Array `programSlugs`).
- **XpTransaction** – Earn/Spend-Buchungen mit Bezug zu Programmen oder Rewards.
- **Reward & RewardRedemption** – definieren Einlösungen inkl. Status.
- **Journal & JournalEntry** – append-only Logs für Lern-/Erfolgs-/Dankbarkeitseinträge.
- **Mind Visualization/Goal/GoalCheckin/BrainExercise/BrainExerciseSession/LearningPath/LearningMilestone/LearningMilestoneProgress/EmotionPractice/EmotionLog** – decken alle Mind-Features ab und enthalten optionale User-Bezüge.

Seed-Dateien (`src/lib/data.ts`, `src/lib/mind-data.ts`) spiegeln dieses Modell, `prisma/seed.ts` schreibt sie idempotent in die Datenbank.

## Setup & Betrieb

1. **Voraussetzungen:** Node.js 20+, npm 10+, Docker + Docker Compose (für Postgres). Siehe auch `docs/LOCAL_TESTING.md`.
2. **Environment:** `cp .env.example .env.local` (enthält `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`). Keine Secrets commiten; produktive Werte in sicheren Stores pflegen.
3. **Datenbank starten:** `docker compose up -d db`.
4. **Dependencies:** `npm install`.
5. **Schema anwenden:** `npx prisma migrate dev --name init`.
6. **Seeds:** `npx prisma db seed` (legt Demo User, Programme, Rewards, Journale, Mind-Daten an). Optionale SQL-Beispiele: `seed-data/manual-inserts.sql`.
7. **Entwicklung:** `npm run dev` startet Next.js (Port 3001 in `package.json`). App erreichbar via http://localhost:3001 bzw. `NEXTAUTH_URL`.
8. **Build/Prod:** `npm run build` erzeugt Produktions-Bundle; `npm run start` startet es (ebenfalls Port 3001). Vor Deploy `python -m build` ist hier nicht relevant, da eine Node-App – stattdessen Next.js Build/Start Pipeline nutzen.

## Qualitätssicherung

- **Linting:** `npm run lint` (Next.js + ESLint). Vor jedem Commit ausführen.
- **Type Checking:** Bestandteil von `npm run build`; für schnellere Zyklen `tsc --noEmit`.
- **Tests:** Derzeit keine automatisierten Unit-/E2E-Tests vorhanden. Empfohlen: Playwright Flows für Programme/Rewards, React Testing Library für Formularlogik und API-Contract-Tests mit Vitest.
- **Manuelle Smoke-Tests:** Dokumentiert in `docs/LOCAL_TESTING.md` (Login, Datenbankprüfung, Docker psql).

## Erweiterungshinweise

- **Program System Spec:** Siehe `System/docs/program-system.md` für das vollständige Datenmodell der Admin-Programme, Runner-Anforderungen und Scheduling-/XP-Logik.
- **Neue Programme:** Seed in `src/lib/data.ts` ergänzen (inkl. Units/Exercises). `prisma/seed.ts` übernimmt automatische Persistierung. Custom Renderer? – Komponente in `src/components/mind/` erstellen und in `ProgramContent` registrieren.
- **Program Stacks:** Über das Admin-Panel pflegen oder direkt `/api/program-stacks` POST mit `title`, `summary`, `programSlugs`.
- **Mind-Daten:** Gleiches Muster – Seeds anpassen (`src/lib/mind-data.ts`) für Default Assets; Admin-Panel unterstützt laufende Pflege.
- **XP-/Timeline-Regeln:** Änderungen an `createProgramRun`, `/api/xp/summary` und `/api/timeline` vornehmen, damit Aggregationen konsistent bleiben.
- **Auth-Erweiterung:** Aktuell reine Client-Side Gate. Für echte Accounts NextAuth konfigurieren (`NEXTAUTH_*` Variablen), Prisma Adapter ergänzen und API-Routen absichern.

## Betrieb & Troubleshooting

- **Demo User** (`demo@dais.app` / `changeme`) wird automatisch via Seed angelegt; API-Routen erzeugen Benutzer lazy, sobald ein unbekannter `userEmail` auftaucht.
- **Fehlerdiagnose:** Prisma-Client ist auf `error`/`warn` Logging gestellt. Bei Docker-DB-Problemen `docker compose logs db` bzw. `psql` verwenden.
- **Datenbereinigung:** Program Runs, XpTransactions oder Mind-Logs können gefahrlos via `psql` gelöscht werden; Foreign Keys sorgen für Konsistenz. Keine destructive CLI-Kommandos im Repo ausführen (siehe Repository-Guidelines).

Diese Dokumentation bildet die Grundlage für Onboarding, Betrieb sowie Erweiterungen der DAiS Applikation. Ergänzungen (z. B. detaillierte Sequenzdiagramme oder API-Spezifikationen) können unter `System/docs/<topic>.md` hinzugefügt werden.
