export const householdTaskSeeds = [
  {
    id: "hh-task-clean",
    label: "Aufgeräumt",
    order: 0
  },
  {
    id: "hh-task-dishes",
    label: "Geschirr in Spühlmaschine getan",
    order: 1
  },
  {
    id: "hh-task-laundry",
    label: "Wäsche gewaschen",
    order: 2
  },
  {
    id: "hh-task-floor",
    label: "Boden gewischt",
    order: 3
  },
  {
    id: "hh-task-trash",
    label: "Müll entsorgt",
    order: 4
  },
  {
    id: "hh-task-handwerk",
    label: "Handwerkliche Aufgabe erledigt",
    order: 5
  },
  {
    id: "hh-task-cooking",
    label: "Essen zubereitet",
    order: 6
  },
  {
    id: "hh-task-shopping",
    label: "Einkaufen gewesen",
    order: 7
  }
] as const;

export const householdCardSeeds = [
  {
    id: "hh-card-monday-reset",
    title: "Montag Reset",
    summary: "Wohnbereich zurück in Fokus-Mode bringen.",
    weekday: 1,
    taskIds: ["hh-task-clean", "hh-task-dishes", "hh-task-floor", "hh-task-trash"]
  },
  {
    id: "hh-card-tuesday-kitchen",
    title: "Dienstag Küche",
    summary: "Küchenroutine und Vorratscheck.",
    weekday: 2,
    taskIds: ["hh-task-dishes", "hh-task-floor", "hh-task-cooking"]
  },
  {
    id: "hh-card-wednesday-laundry",
    title: "Mittwoch Laundry",
    summary: "Wäsche, Müll und kleine Reparaturen.",
    weekday: 3,
    taskIds: ["hh-task-laundry", "hh-task-trash", "hh-task-handwerk"]
  },
  {
    id: "hh-card-thursday-supply",
    title: "Donnerstag Vorräte",
    summary: "Einkaufen und Entsorgen kombinieren.",
    weekday: 4,
    taskIds: ["hh-task-shopping", "hh-task-trash", "hh-task-floor"]
  },
  {
    id: "hh-card-friday-deep",
    title: "Freitag Deep Clean",
    summary: "Woche mit tiefer Reinigung abschließen.",
    weekday: 5,
    taskIds: ["hh-task-clean", "hh-task-dishes", "hh-task-floor", "hh-task-handwerk"]
  },
  {
    id: "hh-card-saturday-family",
    title: "Samstag Family Prep",
    summary: "Küche & Essen für das Wochenende vorbereiten.",
    weekday: 6,
    taskIds: ["hh-task-clean", "hh-task-cooking", "hh-task-dishes"]
  },
  {
    id: "hh-card-sunday-buffer",
    title: "Sonntag Vorratscheck",
    summary: "Wäsche finalisieren und Einkäufe vorbereiten.",
    weekday: 7,
    taskIds: ["hh-task-laundry", "hh-task-shopping", "hh-task-trash"]
  }
] as const;
