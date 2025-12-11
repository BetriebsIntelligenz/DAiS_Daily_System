import type {
  JournalDefinition,
  ProgramBlueprint,
  ProgramDefinition,
  RewardDefinition
} from "./types";
import { createBlueprintFromSource } from "./program-blueprint";

type ProgramSeed = Omit<ProgramDefinition, "blueprint"> & {
  blueprint?: Partial<ProgramBlueprint>;
};

export const categories = [
  { id: "mind", title: "Mind", accent: "from-daisy-200 to-daisy-500" },
  { id: "body", title: "Body", accent: "from-daisy-100 to-daisy-400" },
  { id: "human", title: "Human", accent: "from-daisy-200 to-daisy-600" },
  {
    id: "environment",
    title: "Environment",
    accent: "from-daisy-200 to-daisy-500"
  },
  { id: "business", title: "Business", accent: "from-daisy-100 to-daisy-400" }
] as const;

const programSeeds: ProgramSeed[] = [
  {
    id: "mind-visualisierung",
    slug: "visualisierungstraining",
    code: "MV1",
    name: "Visualisierungstraining",
    summary:
      "Visual Library mit Fotos, Checkboxes und täglicher State-Priming Reflexion.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 10,
    xpReward: 400,
    mode: "flow",
    units: [
      {
        id: "mv1-gallery",
        title: "Visual Cards",
        order: 1,
        exercises: [
          {
            id: "mv1-gallery-check",
            label: "Visual Cards bestätigt",
            type: "checkbox",
            xpValue: 200
          },
          {
            id: "mv1-reflection",
            label: "Gefühl nach dem Priming beschreiben",
            type: "text",
            xpValue: 200
          }
        ]
      }
    ]
  },
  {
    id: "mind-smart-goals",
    slug: "ziele-smart",
    code: "MG1",
    name: "SMART Ziele",
    summary:
      "Alle Mind-Ziele anzeigen, täglich abhaken, Fortschritt aktualisieren und Selbst-Check hinterlegen.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 12,
    xpReward: 500,
    mode: "flow",
    units: [
      {
        id: "mg1-review",
        title: "Ziel Review",
        order: 1,
        exercises: [
          {
            id: "mg1-goal-progress",
            label: "Fortschritt dokumentiert",
            type: "checkbox",
            xpValue: 250
          },
          {
            id: "mg1-self-check",
            label: "Selbsteinschätzung notiert",
            type: "text",
            xpValue: 250
          }
        ]
      }
    ]
  },
  {
    id: "mind-brain-training",
    slug: "brain-training",
    code: "MBT",
    name: "Brain Training Gym",
    summary:
      "Kurze Mind-Gym Übungen, Difficulty Ratings und täglicher Durchführungs-Tracker.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 15,
    xpReward: 450,
    mode: "flow",
    units: [
      {
        id: "mbt-session",
        title: "Cognitive Sprints",
        order: 1,
        exercises: [
          {
            id: "mbt-exercises-done",
            label: "Mind Gym absolviert",
            type: "checkbox",
            xpValue: 200
          },
          {
            id: "mbt-rating",
            label: "Session Rating",
            type: "text",
            xpValue: 250
          }
        ]
      }
    ]
  },
  {
    id: "mind-higher-thinking",
    slug: "higher-thinking",
    code: "MHT",
    name: "Higher Thinking",
    summary:
      "Lernpfade, Philosophie & Konzepte mit Milestones abhaken bis der Pfad abgeschlossen ist.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 20,
    xpReward: 600,
    mode: "flow",
    units: [
      {
        id: "mht-paths",
        title: "Learning Paths",
        order: 1,
        exercises: [
          {
            id: "mht-milestones",
            label: "Milestones aktualisiert",
            type: "checkbox",
            xpValue: 300
          },
          {
            id: "mht-reflection",
            label: "Konzept-Notiz",
            type: "text",
            xpValue: 300
          }
        ]
      }
    ]
  },
  {
    id: "mind-emotion-training",
    slug: "emotion-training",
    code: "MET",
    name: "Emotion Training",
    summary:
      "Emotion loggen, Intensität tracken und passende Regulation Techniken anwenden.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 8,
    xpReward: 420,
    mode: "flow",
    units: [
      {
        id: "met-logs",
        title: "Emotion Logs",
        order: 1,
        exercises: [
          {
            id: "met-log-entry",
            label: "Eintrag erstellt",
            type: "checkbox",
            xpValue: 200
          },
          {
            id: "met-plan",
            label: "Nächste Regulation",
            type: "text",
            xpValue: 220
          }
        ]
      }
    ]
  },
  {
    id: "mm1-incantations",
    slug: "mm1-incantations",
    code: "MM1",
    name: "Incantations",
    summary:
      "State-Boost Ritual aus dem DAiS Morning Mindset inklusive State & Role Tracking.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 12,
    xpReward: 600,
    mode: "flow",
    units: [
      {
        id: "mm1-state",
        title: "Incantations",
        order: 1,
        exercises: [
          {
            id: "mm1-affirmation-wealth",
            label: "Reichtum ist mein natürlicher Zustand",
            type: "checkbox",
            xpValue: 100
          },
          {
            id: "mm1-affirmation-magnet",
            label: "Ich bin ein Magnet für Geld und Erfolg.",
            type: "checkbox",
            xpValue: 100
          },
          {
            id: "mm1-affirmation-energy",
            label: "Ich bin Energie.",
            type: "checkbox",
            xpValue: 100
          },
          {
            id: "mm1-affirmation-health",
            label: "Ich bin gesund.",
            type: "checkbox",
            xpValue: 100
          },
          {
            id: "mm1-affirmation-gratitude",
            label: "Ich bin dankbar für meine Gesundheit.",
            type: "checkbox",
            xpValue: 100
          },
          {
            id: "mm1-intensity",
            label: "Intensivität",
            description: "Skala von 1-10, orientiert an der Body Morgentrainings-Skala.",
            type: "scale",
            xpValue: 100,
            config: {
              scaleMin: 1,
              scaleMax: 10
            }
          }
        ]
      }
    ],
    blueprint: {
      ritual: []
    }
  },
  {
    id: "mind-meditation",
    slug: "meditation",
    code: "MED",
    name: "Meditation",
    summary:
      "Dropdown-Ritual mit Sayajin- und Earth Love-Meditation inkl. horizontalem Flow.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 10,
    xpReward: 380,
    mode: "flow",
    units: [
      {
        id: "meditation-flow",
        title: "Meditationen",
        order: 1,
        exercises: [
          {
            id: "meditation-selection",
            label: "Meditations-Flow gewählt",
            type: "checkbox",
            xpValue: 180
          },
          {
            id: "meditation-note",
            label: "Reflexionsnotiz",
            type: "text",
            xpValue: 200
          }
        ]
      }
    ]
  },
  {
    id: "mm5-day-planning",
    slug: "mm5-day-planning",
    code: "MM5",
    name: "Day Planning",
    summary: "Fokussiertes Planungs-Canvas für das DAiS Day Management.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 15,
    xpReward: 450,
    mode: "single",
    units: [
      {
        id: "mm5-core",
        title: "Fokus",
        order: 1,
        exercises: [
          {
            id: "mm5-why",
            label: "Was ist das Wichtigste heute?",
            type: "text",
            xpValue: 150,
            config: { placeholder: "Fokus Aufgabe..." }
          },
          {
            id: "mm5-emails",
            label: "E-Mails geprüft",
            type: "checkbox",
            xpValue: 80
          },
          {
            id: "mm5-email-note",
            label: "Notiz zu einer E-Mail",
            type: "text",
            xpValue: 70,
            config: {
              placeholder: "Welche Nachricht braucht Follow-up?"
            }
          },
          {
            id: "mm5-important-tasks",
            label: "Wichtige Aufgaben",
            type: "text",
            xpValue: 120,
            config: {
              placeholder: "Aufgabe 1, Aufgabe 2 ..."
            }
          },
          {
            id: "mm5-meetings",
            label: "Termine geprüft",
            type: "checkbox",
            xpValue: 80
          },
          {
            id: "mm5-meeting-prep",
            label: "Vorbereitungen für heutige Termine",
            type: "text",
            xpValue: 70,
            config: {
              placeholder: "Was muss vor dem nächsten Termin passieren?"
            }
          }
        ]
      }
    ]
  },
  {
    id: "state-controll",
    slug: "state-controll",
    code: "SC",
    name: "State Controll",
    summary:
      "LOVE, LIGHT, HERO, LEADER, INNOVATOR, POWER HUMAN, IQ SOURCE Trackings.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 10,
    xpReward: 500,
    mode: "flow",
    units: [
      {
        id: "sc-state",
        title: "State-Level",
        order: 1,
        exercises: [
          {
            id: "sc-love",
            label: "LOVE",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-light",
            label: "LIGHT",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-hero",
            label: "HERO",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-leader",
            label: "LEADER",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-innovator",
            label: "INNOVATOR",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-power",
            label: "POWER HUMAN",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          },
          {
            id: "sc-iq",
            label: "IQ SOURCE",
            type: "scale",
            xpValue: 70,
            config: { scaleMin: 1, scaleMax: 10 }
          }
        ]
      }
    ]
  },
  {
    id: "rules-checklist",
    slug: "rules-checklist",
    code: "RC",
    name: "Rules Checklist",
    summary: "12 Disziplinen als Ja/Nein-Tracker.",
    category: "mind",
    frequency: "daily",
    durationMinutes: 8,
    xpReward: 300,
    mode: "single",
    units: [
      {
        id: "rc-checks",
        title: "Disziplinen",
        order: 1,
        exercises: [
          "Rauchfrei",
          "Gesund",
          "Diszipliniert",
          "Reichtum",
          "Erfolg",
          "Mind Push",
          "State Controll",
          "Action",
          "Meditation",
          "Social Value",
          "Family Value",
          "Daily Body Workout"
        ].map((label, index) => ({
          id: `rc-${index}`,
          label,
          type: "checkbox",
          xpValue: 20
        }))
      }
    ]
  },
  {
    id: "daily-checklist-body",
    slug: "daily-checklist-body",
    code: "MS1",
    name: "Morgensport",
    summary: "Morgen Sport Routine",
    category: "body",
    frequency: "daily",
    durationMinutes: 20,
    xpReward: 550,
    mode: "flow",
    units: [
      {
        id: "db1-activity",
        title: "Morgensport",
        order: 1,
        exercises: [
          {
            id: "db1-sport",
            label: "Morning Sport absolviert",
            type: "multiselect",
            config: {
              options: [
                "Calistenics",
                "Freeletics",
                "Schattenboxen",
                "Laufen",
                "Schwimmen",
                "Boxsack",
                "Fitness"
              ],
              optionsRequireMinutes: true
            },
            xpValue: 550
          }
        ]
      }
    ],
    blueprint: {
      xp: {
        baseValue: 550,
        requireCompletion: true,
        minQualityScore: 1,
        customRuleLabel: "Regel-Check erfüllt",
        distribution: [{ area: "body", percentage: 100 }]
      }
    }
  },
  {
    id: "daily-checklist-human",
    slug: "daily-checklist-human",
    code: "DH1",
    name: "Daily Human Checklist",
    summary: "Family, Chat und Meet Programme an einem Ort.",
    category: "human",
    frequency: "daily",
    durationMinutes: 10,
    xpReward: 400,
    mode: "flow",
    units: [
      {
        id: "dh1-family",
        title: "Connections",
        order: 1,
        exercises: [
          {
            id: "dh1-family-call",
            label: "Family Kontakt gepflegt",
            type: "checkbox",
            xpValue: 120
          },
          {
            id: "dh1-chat",
            label: "Menschenwert geschaffen",
            type: "text",
            xpValue: 120
          }
        ]
      }
    ]
  },
  {
    id: "environment-program",
    slug: "environment-program",
    code: "EN1",
    name: "Environment Program",
    summary: "Haushalt, Cleaning, Garden, Shaggy Program.",
    category: "environment",
    frequency: "daily",
    durationMinutes: 25,
    xpReward: 500,
    mode: "flow",
    units: [
      {
        id: "en1-cleaning",
        title: "Cleaning & Garden",
        order: 1,
        exercises: [
          {
            id: "en1-clean",
            label: "Haushalt erledigt",
            type: "checkbox",
            xpValue: 150
          },
          {
            id: "en1-garden",
            label: "Garden / Shaggy Program",
            type: "text",
            xpValue: 150
          }
        ]
      }
    ]
  },
  {
    id: "business-development-program",
    slug: "business-development-program",
    code: "BU1",
    name: "Business Development",
    summary:
      "Virtuelles Kundencenter, Immobilienentwicklungen, Research und KPIs.",
    category: "business",
    frequency: "daily",
    durationMinutes: 30,
    xpReward: 650,
    mode: "flow",
    units: [
      {
        id: "bu1-sales",
        title: "Sales & Development",
        order: 1,
        exercises: [
          {
            id: "bu1-pipeline",
            label: "Pipeline gepflegt",
            type: "checkbox",
            xpValue: 200
          },
          {
            id: "bu1-innovation",
            label: "Innovationseintrag",
            type: "text",
            xpValue: 200
          }
        ]
      }
    ]
  }
];

export const programDefinitions: ProgramDefinition[] = programSeeds.map((seed) => ({
  ...seed,
  blueprint: createBlueprintFromSource(
    {
      summary: seed.summary,
      category: seed.category,
      durationMinutes: seed.durationMinutes,
      xpReward: seed.xpReward,
      frequency: seed.frequency,
      units: seed.units
    },
    seed.blueprint
  )
}));

export const rewardDefinitions: RewardDefinition[] = [
  {
    id: "reward-cinema",
    name: "Kinoabend",
    description: "Zwei Tickets + Snacks als Feier des Fortschritts.",
    cost: 1500,
    active: true
  },
  {
    id: "reward-dayoff",
    name: "Freier Tag",
    description: "Ganzer Tag Offsite ohne Verpflichtungen.",
    cost: 2500,
    active: true
  },
  {
    id: "reward-watch",
    name: "Neue Uhr",
    description: "High-End Accessoire als Meilenstein.",
    cost: 8000,
    active: false
  }
];

export const journalDefinitions: JournalDefinition[] = [
  {
    id: "journal-learn",
    name: "Lern Journal",
    type: "learn",
    description: "Transfer & Erkenntnisse dokumentieren."
  },
  {
    id: "journal-success",
    name: "Erfolgs Journal",
    type: "success",
    description: "Siege, Completed Tasks und Momentum."
  },
  {
    id: "journal-gratitude",
    name: "Dankbarkeits Journal",
    type: "gratitude",
    description: "Mini-Ritual täglicher Appreciation."
  }
];
