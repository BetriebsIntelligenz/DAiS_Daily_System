import type {
  HumanContactActivity,
  HumanContactCadence,
  HumanContactRelation
} from "./types";

export const HUMAN_RELATION_OPTIONS = [
  { value: "family", label: "Familie" },
  { value: "friend", label: "Freund" },
  { value: "colleague", label: "Kollege" },
  { value: "business_partner", label: "Business Partner" },
  { value: "network", label: "Network" }
] as const satisfies ReadonlyArray<{
  value: HumanContactRelation;
  label: string;
}>;

export const HUMAN_RELATION_VALUES = HUMAN_RELATION_OPTIONS.map(
  (entry) => entry.value
);

export const HUMAN_ACTIVITY_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp Nachricht" },
  { value: "call", label: "Anruf" },
  { value: "email", label: "E-Mail" },
  { value: "meeting", label: "Treffen" },
  { value: "video_call", label: "Video Call" }
] as const satisfies ReadonlyArray<{
  value: HumanContactActivity;
  label: string;
}>;

export const HUMAN_ACTIVITY_VALUES = HUMAN_ACTIVITY_OPTIONS.map(
  (entry) => entry.value
);

export const HUMAN_CADENCE_OPTIONS = [
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" }
] as const satisfies ReadonlyArray<{
  value: HumanContactCadence;
  label: string;
}>;

export const HUMAN_CADENCE_VALUES = HUMAN_CADENCE_OPTIONS.map(
  (entry) => entry.value
);

export function getHumanCadenceLabel(value: HumanContactCadence) {
  return (
    HUMAN_CADENCE_OPTIONS.find((entry) => entry.value === value)?.label ?? value
  );
}

export function getHumanRelationLabel(value: HumanContactRelation) {
  return (
    HUMAN_RELATION_OPTIONS.find((entry) => entry.value === value)?.label ?? value
  );
}

export function getHumanActivityLabel(value: HumanContactActivity) {
  return (
    HUMAN_ACTIVITY_OPTIONS.find((entry) => entry.value === value)?.label ?? value
  );
}

export function createEmptyActivityCounts() {
  return HUMAN_ACTIVITY_VALUES.reduce<Record<HumanContactActivity, number>>(
    (acc, activity) => {
      acc[activity] = 0;
      return acc;
    },
    {} as Record<HumanContactActivity, number>
  );
}

export function buildActivityDistribution(
  counts: Record<HumanContactActivity, number>
) {
  const total = HUMAN_ACTIVITY_VALUES.reduce(
    (sum, activity) => sum + (counts[activity] ?? 0),
    0
  );
  return HUMAN_ACTIVITY_VALUES.map((activity) => {
    const count = counts[activity] ?? 0;
    const percentage = total === 0 ? 0 : Math.round((count / total) * 100);
    return { activity, count, percentage };
  });
}
