import type {
  HumanContactActivity,
  HumanContactCadence,
  HumanContactRelation
} from "./types";

export interface HumanContactSeed {
  id: string;
  name: string;
  relation: HumanContactRelation;
  note?: string;
  assignments?: Partial<Record<HumanContactCadence, HumanContactActivity[]>>;
}

export const humanContactSeeds: HumanContactSeed[] = [
  {
    id: "human-contact-lena",
    name: "Lena (Family)",
    relation: "family",
    note: "Täglicher Check-in via WhatsApp.",
    assignments: {
      daily: ["whatsapp"],
      weekly: ["meeting"]
    }
  },
  {
    id: "human-contact-sven",
    name: "Sven (Business)",
    relation: "business_partner",
    note: "Pipeline Sync Call",
    assignments: {
      daily: ["email"],
      weekly: ["video_call", "meeting"]
    }
  },
  {
    id: "human-contact-amelie",
    name: "Amelie (Network)",
    relation: "network",
    assignments: {
      daily: ["whatsapp"],
      weekly: ["call", "meeting"]
    }
  }
];
