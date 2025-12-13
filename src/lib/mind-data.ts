const createSvgDataUrl = (title: string, subtitle: string, gradient: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradient.split(",")[0]}" /><stop offset="100%" stop-color="${gradient.split(",")[1] ?? gradient.split(",")[0]}" /></linearGradient></defs><rect width="640" height="360" fill="url(#g)"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-size="42" font-family="Arial" fill="white" opacity="0.9">${title}</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-family="Arial" fill="white" opacity="0.8">${subtitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const visualizationSeeds = [
  {
    id: "mv-city-dawn",
    title: "DAiS Future City Dawn",
    imageData: createSvgDataUrl("Future City", "Sunrise Office Corner", "#FDBA8C,#9353D3"),
    order: 0
  },
  {
    id: "mv-stage-prime",
    title: "Prime Stage Moment",
    imageData: createSvgDataUrl("Main Stage", "Coach Spotlight", "#7EE8FA,#EEC0C6"),
    order: 1
  },
  {
    id: "mv-lab-focus",
    title: "DAiS Mind Lab",
    imageData: createSvgDataUrl("Mind Lab", "Neuro Focus Capsule", "#FCE38A,#F38181"),
    order: 2
  }
] as const;

export const performanceChecklistSeeds = [
  {
    id: "pc-state",
    label: "State",
    summary: "Gefühl & Selbststeuerung prüfen.",
    order: 0
  },
  {
    id: "pc-posture",
    label: "Körperhaltung",
    summary: "Aufrichtung & Körpersprache (Power Pose).",
    order: 1
  },
  {
    id: "pc-energy",
    label: "Energy",
    summary: "Energie & Aktivierungsspanne.",
    order: 2
  },
  {
    id: "pc-nutrition",
    label: "Gesunde Ernährung",
    summary: "Fuel & Hydration Status.",
    order: 3
  },
  {
    id: "pc-focus",
    label: "Fokus",
    summary: "Ablenkung vs. Konzentrationsgrad.",
    order: 4
  },
  {
    id: "pc-concentration",
    label: "Konzentration",
    summary: "Tiefe Arbeitsfähigkeit.",
    order: 5
  },
  {
    id: "pc-discipline",
    label: "Disziplin",
    summary: "Commitments & Selbstführung.",
    order: 6
  }
] as const;

export const mindGoalSeeds = [
  {
    id: "goal-smart-ritual",
    title: "Tägliches SMART Visual Mindset",
    specific: "Jeden Morgen die Visualisierung der drei Kernrollen durchführen.",
    measurable: "Mind Journal dokumentiert min. 25 Sessions pro Monat.",
    achievable: "10-minütiger Slot direkt nach dem Aufstehen blockiert.",
    relevant: "Stärkt Identität als Innovator & Leader.",
    timeBound: "In 90 Tagen automatisiert etabliert.",
    metricName: "Visual Sessions",
    targetValue: 90,
    unit: "Sessions",
    targetDate: new Date().toISOString()
  },
  {
    id: "goal-smart-learning",
    title: "Higher Thinking Curriculum",
    specific: "Jede Woche einen philosophischen Lernabschnitt reflektieren.",
    measurable: "Mind Board enthält 12 reflektierte Kapitel.",
    achievable: "60 Minuten Deep Learning Slot Dienstagabend.",
    relevant: "Vertieft Entscheidungskompetenz & Strategie.",
    timeBound: "In 12 Wochen abgeschlossen.",
    metricName: "Kapitel",
    targetValue: 12,
    unit: "Kapitel",
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString()
  },
  {
    id: "goal-smart-emotion",
    title: "Emotion Regulation Score",
    specific: "Emotion Log täglich mit Intensität & Technik füllen.",
    measurable: "Mind App zeigt 85% Tage mit Tracking.",
    achievable: "Reflexionsslot 20:30 Uhr nach Evening Walk.",
    relevant: "Sichert konstante Performance & Ruhe.",
    timeBound: "In 60 Tagen >85% Compliance.",
    metricName: "Tracking Quote",
    targetValue: 85,
    unit: "%",
    targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString()
  }
] as const;

export const brainExerciseSeeds = [
  {
    id: "brain-dual-focus",
    title: "Dual Focus Matrix",
    focusArea: "Aufmerksamkeit + Kurzzeitgedächtnis",
    description: "2 Minuten Buchstabenstrom laut rückwärts buchstabieren und gleichzeitig Primzahlen markieren.",
    difficulty: 4,
    durationMinutes: 5,
    rating: 5
  },
  {
    id: "brain-pattern-sprint",
    title: "Pattern Sprint",
    focusArea: "Strategisches Denken",
    description: "Zahlenfolgen mit zunehmender Komplexität erkennen und innerhalb von 60 Sekunden lösen.",
    difficulty: 3,
    durationMinutes: 4,
    rating: 4
  },
  {
    id: "brain-concept-flash",
    title: "Concept Flash",
    focusArea: "Kreativität + Transfer",
    description: "Zwei zufällige Begriffe verbinden und eine Produktidee in Notizen skizzieren.",
    difficulty: 2,
    durationMinutes: 6,
    rating: 5
  }
] as const;

export const learningPathSeeds = [
  {
    id: "path-higher-thinking",
    title: "Higher Thinking Foundations",
    theme: "Philosophie & Strategisches Denken",
    description: "Kuratiertes Lernpfad-Set für modernes Leadership- und Konzept-Denken.",
    milestones: [
      {
        id: "milestone-socratic",
        title: "Socratic Questioning",
        description: "Warum-Fragen-Kaskade auf aktuelle Challenge anwenden.",
        order: 1
      },
      {
        id: "milestone-systems",
        title: "System Model Canvas",
        description: "Systemische Dynamiken mit Ursache-Wirkung darstellen.",
        order: 2
      },
      {
        id: "milestone-paradox",
        title: "Paradox Playbook",
        description: "Gegenläufige Thesen ausformulieren und lösen.",
        order: 3
      }
    ]
  },
  {
    id: "path-hyperlearning",
    title: "Hyper Learning Loop",
    theme: "Meta-Lernen",
    description: "Kurzzyklen für Lernen, Reflection und Output.",
    milestones: [
      {
        id: "milestone-input",
        title: "Focused Input Session",
        description: "25 Min. Fokus auf ein Lernobjekt.",
        order: 1
      },
      {
        id: "milestone-output",
        title: "Teach Back",
        description: "Gelernten Inhalt per Loom Audio erklären.",
        order: 2
      },
      {
        id: "milestone-integration",
        title: "Integration Note",
        description: "Eine neue Handlung ableiten und terminieren.",
        order: 3
      }
    ]
  }
] as const;

export const emotionPracticeSeeds = [
  {
    id: "emotion-calm-focus",
    emotion: "Nervosität",
    summary: "Akute Nervosität vor Calls oder Pitches neutralisieren.",
    regulationSteps: [
      "Box Breathing 4-4-4-4 für 120 Sekunden",
      "Power Pose + Micro-Smile im Spiegel",
      "Mini-Visualisierung des idealen Outcomes"
    ],
    groundingPrompt: "Was ist das Minimum, das ich heute liefern will?"
  },
  {
    id: "emotion-clarity",
    emotion: "Überforderung",
    summary: "Gedanken entstapeln und Handlungsfähigkeit herstellen.",
    regulationSteps: [
      "Brain Dump in Notion (alles raus, 3 Minuten)",
      "3 wichtigsten Issues markieren",
      "Nächste Mikro-Aktion laut committen"
    ],
    groundingPrompt: "Was bringt mich in 5 Minuten wieder in Kontrolle?"
  },
  {
    id: "emotion-fire",
    emotion: "Low Energy",
    summary: "State hochfahren und Emotionen bewusst lenken.",
    regulationSteps: [
      "Kälte- oder Hitze-Trigger für 30 Sekunden",
      "Lieblingssong + Movement",
      "Values Statement laut vorlesen"
    ],
    groundingPrompt: "Welche Emotion will ich jetzt kultivieren?"
  }
] as const;

export const meditationFlowSeeds = [
  {
    id: "med-sayajin",
    title: "Sayajin Meditation",
    subtitle: "Energie + Fokus",
    summary: "State-Ritual über Visualisierung und Energieball-Steuerung.",
    order: 0,
    steps: [
      {
        id: "med-sayajin-1",
        title: "Durch Vibration und Visualisation Energieball um Körper erzeugen.",
        order: 1
      },
      {
        id: "med-sayajin-2",
        title: "Energieball um Wachsen lassen.",
        order: 2
      },
      {
        id: "med-sayajin-3",
        title: "Energieball in Stratosphäre bewegen.",
        order: 3
      },
      {
        id: "med-sayajin-4",
        title: "Energieball auf Erde splitten und an Energiebedürftige verteilen.",
        order: 4
      }
    ]
  },
  {
    id: "med-earth-love",
    title: "Earth Love Meditation",
    subtitle: "Liebe + Dankbarkeit",
    summary: "Verbinde dich mit der Erde und sende positive Frequenzen.",
    order: 1,
    steps: [
      {
        id: "med-earth-love-1",
        title: "Liebe an Erde senden",
        order: 1
      },
      {
        id: "med-earth-love-2",
        title: "Dankbarkeit an Erde senden",
        order: 2
      }
    ]
  }
] as const;
