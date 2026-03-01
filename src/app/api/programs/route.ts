import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { programDefinitions } from "@/lib/data";
import {
  blueprintToPersistenceColumns,
  createBlueprintFromSource
} from "@/lib/program-blueprint";
import { loadProgramBySlug, loadPrograms } from "@/lib/programs";
import type {
  ProgramBlueprint,
  ProgramDefinition,
  ProgramExercise,
  ProgramUnit,
  ProgramXpRulesConfig
} from "@/lib/types";

const PROGRAM_CATEGORIES: ProgramDefinition["category"][] = [
  "mind",
  "body",
  "human",
  "environment",
  "business"
];
const PROGRAM_FREQUENCIES: ProgramDefinition["frequency"][] = [
  "daily",
  "weekly",
  "monthly",
  "adhoc",
  "block_only"
];
const PROGRAM_MODES: ProgramDefinition["mode"][] = ["single", "flow"];
const EXERCISE_TYPES: ProgramExercise["type"][] = [
  "checkbox",
  "scale",
  "multiselect",
  "text",
  "number",
  "html"
];

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeExerciseType(value: unknown): ProgramExercise["type"] {
  const candidate = String(value ?? "text") as ProgramExercise["type"];
  return EXERCISE_TYPES.includes(candidate) ? candidate : "text";
}

function normalizeUnits(rawUnits: unknown): ProgramUnit[] {
  if (!Array.isArray(rawUnits)) {
    return [];
  }

  return rawUnits.map((rawUnit, unitIndex) => {
    const unit = toRecord(rawUnit);
    const rawExercises = Array.isArray(unit.exercises) ? unit.exercises : [];

    return {
      id: typeof unit.id === "string" ? unit.id : `unit-${unitIndex + 1}`,
      title: String(unit.title ?? "").trim(),
      order: Number.isFinite(Number(unit.order))
        ? Number(unit.order)
        : unitIndex + 1,
      exercises: rawExercises.map((rawExercise, exerciseIndex) => {
        const exercise = toRecord(rawExercise);
        const config = toRecord(exercise.config);

        return {
          id:
            typeof exercise.id === "string"
              ? exercise.id
              : `exercise-${unitIndex + 1}-${exerciseIndex + 1}`,
          label: String(exercise.label ?? "").trim(),
          description:
            typeof exercise.description === "string" && exercise.description.trim()
              ? exercise.description.trim()
              : undefined,
          type: normalizeExerciseType(exercise.type),
          config: JSON.parse(JSON.stringify(config)),
          xpValue: Math.max(0, Math.round(Number(exercise.xpValue ?? 0)))
        };
      })
    };
  });
}

function validateProgramInput(input: {
  name: string;
  slug: string;
  code: string;
  category: ProgramDefinition["category"];
  frequency: ProgramDefinition["frequency"];
  mode: ProgramDefinition["mode"];
  durationMinutes: number;
  xpReward: number;
  units: ProgramUnit[];
}) {
  if (!input.name) {
    return "Name ist ein Pflichtfeld.";
  }
  if (!input.slug) {
    return "Slug ist ein Pflichtfeld.";
  }
  if (!PROGRAM_CATEGORIES.includes(input.category)) {
    return "Ungültige Kategorie.";
  }
  if (!PROGRAM_FREQUENCIES.includes(input.frequency)) {
    return "Ungültige Frequenz.";
  }
  if (!PROGRAM_MODES.includes(input.mode)) {
    return "Ungültiger Modus.";
  }
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    return "Dauer muss größer als 0 sein.";
  }
  if (!Number.isFinite(input.xpReward) || input.xpReward < 0) {
    return "XP muss mindestens 0 sein.";
  }
  if (input.units.length === 0) {
    return "Mindestens eine Unit wird benötigt.";
  }

  for (const unit of input.units) {
    if (!unit.title.trim()) {
      return "Jede Unit benötigt einen Titel.";
    }
    if (!Array.isArray(unit.exercises) || unit.exercises.length === 0) {
      return `Unit \"${unit.title}\" benötigt mindestens ein Feld.`;
    }
    for (const exercise of unit.exercises) {
      if (!exercise.label.trim()) {
        return `Jedes Feld in Unit \"${unit.title}\" benötigt ein Label.`;
      }
    }
  }

  return null;
}

function parseProgramPayload(
  body: Record<string, unknown>,
  fallback?: {
    name: string;
    slug: string;
    code: string;
    summary: string;
    category: ProgramDefinition["category"];
    frequency: ProgramDefinition["frequency"];
    durationMinutes: number;
    xpReward: number;
    mode: ProgramDefinition["mode"];
    units: ProgramUnit[];
  }
) {
  const name = String(body.name ?? fallback?.name ?? "").trim();
  const summary = String(body.summary ?? fallback?.summary ?? "").trim();
  const category = String(
    body.category ?? fallback?.category ?? "mind"
  ) as ProgramDefinition["category"];
  const frequency = String(
    body.frequency ?? fallback?.frequency ?? "daily"
  ) as ProgramDefinition["frequency"];
  const mode = String(body.mode ?? fallback?.mode ?? "single") as ProgramDefinition["mode"];
  const durationMinutes = Math.max(
    1,
    Math.round(Number(body.durationMinutes ?? fallback?.durationMinutes ?? 10))
  );
  const xpReward = Math.max(0, Math.round(Number(body.xpReward ?? fallback?.xpReward ?? 200)));

  const rawSlug = String(body.slug ?? "").trim();
  const slug = normalizeSlug(rawSlug || fallback?.slug || name);
  const code = String(body.code ?? fallback?.code ?? name.slice(0, 3).toUpperCase())
    .trim()
    .toUpperCase();

  const units = normalizeUnits(body.units ?? fallback?.units ?? []);
  const blueprintInput =
    body.blueprint && typeof body.blueprint === "object"
      ? (body.blueprint as Partial<ProgramBlueprint>)
      : undefined;

  return {
    name,
    summary,
    category,
    frequency,
    mode,
    durationMinutes,
    xpReward,
    slug,
    code,
    units,
    blueprintInput
  };
}

function mapUnitsForCreate(units: ProgramUnit[]) {
  return units.map((unit, unitIndex) => ({
    title: unit.title,
    order: Number.isFinite(unit.order) ? unit.order : unitIndex + 1,
    exercises: {
      create: unit.exercises.map((exercise) => ({
        label: exercise.label,
        description: exercise.description,
        type: exercise.type,
        config: JSON.parse(JSON.stringify(exercise.config ?? {})),
        xpValue: Math.max(0, Math.round(exercise.xpValue))
      }))
    }
  }));
}

async function seedProgramsIfEmpty() {
  const count = await prisma.program.count();
  if (count > 0) return;

  for (const definition of programDefinitions) {
    const blueprintColumns = blueprintToPersistenceColumns(definition.blueprint);

    await prisma.program.upsert({
      where: { id: definition.id },
      update: {},
      create: {
        id: definition.id,
        slug: definition.slug,
        code: definition.code,
        name: definition.name,
        summary: definition.summary,
        category: definition.category,
        frequency: definition.frequency,
        durationMinutes: definition.durationMinutes,
        xpReward: definition.xpReward,
        mode: definition.mode,
        ...(blueprintColumns as any),
        units: {
          create: definition.units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            order: unit.order,
            exercises: {
              create: unit.exercises.map((exercise) => ({
                id: exercise.id,
                label: exercise.label,
                description: exercise.description,
                type: exercise.type,
                config: JSON.parse(JSON.stringify(exercise.config ?? {})),
                xpValue: exercise.xpValue
              }))
            }
          }))
        }
      }
    });
  }
}

export async function GET() {
  try {
    await seedProgramsIfEmpty();
    const programs = await loadPrograms();
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Programs GET failed", error);
    return NextResponse.json(
      {
        error: "Programme konnten nicht geladen werden.",
        hint:
          "Bitte DATABASE_URL setzen und Prisma-Migrationen ausführen (siehe README)."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = toRecord(await request.json());
  const parsed = parseProgramPayload(body);

  const validationError = validateProgramInput(parsed);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const blueprint = createBlueprintFromSource(
      {
        summary: parsed.summary,
        category: parsed.category,
        durationMinutes: parsed.durationMinutes,
        xpReward: parsed.xpReward,
        frequency: parsed.frequency,
        units: parsed.units
      },
      parsed.blueprintInput
    );
    const blueprintColumns = blueprintToPersistenceColumns(blueprint);

    await prisma.program.create({
      data: {
        name: parsed.name,
        code: parsed.code,
        category: parsed.category,
        slug: parsed.slug,
        summary: parsed.summary,
        frequency: parsed.frequency,
        durationMinutes: parsed.durationMinutes,
        xpReward: parsed.xpReward,
        mode: parsed.mode,
        ...(blueprintColumns as any),
        units: {
          create: mapUnitsForCreate(parsed.units)
        }
      }
    });

    const createdProgram = await loadProgramBySlug(parsed.slug);
    return NextResponse.json(createdProgram, { status: 201 });
  } catch (error) {
    console.error("Programs POST failed", error);
    return NextResponse.json(
      {
        error: "Programm konnte nicht gespeichert werden.",
        hint:
          "Bitte Datenbankverbindung prüfen und Prisma-Migrationen ausführen (siehe README)."
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const body = toRecord(await request.json());
  const id = typeof body.id === "string" ? body.id : undefined;
  const slug = typeof body.slug === "string" ? normalizeSlug(body.slug) : undefined;

  if (!id && !slug) {
    return NextResponse.json(
      { error: "Program ID oder Slug muss angegeben werden." },
      { status: 400 }
    );
  }

  const existing = id
    ? await prisma.program.findUnique({
        where: { id },
        include: {
          units: {
            include: {
              exercises: true
            }
          }
        }
      })
    : await prisma.program.findUnique({
        where: { slug: slug! },
        include: {
          units: {
            include: {
              exercises: true
            }
          }
        }
      });

  if (!existing) {
    return NextResponse.json({ error: "Programm nicht gefunden." }, { status: 404 });
  }

  const fallbackUnits: ProgramUnit[] = existing.units
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((unit) => ({
      id: unit.id,
      title: unit.title,
      order: unit.order,
      exercises: unit.exercises.map((exercise) => ({
        id: exercise.id,
        label: exercise.label,
        description: exercise.description ?? undefined,
        type: exercise.type as ProgramExercise["type"],
        config: (exercise.config ?? {}) as ProgramExercise["config"],
        xpValue: exercise.xpValue
      }))
    }));

  const parsed = parseProgramPayload(body, {
    name: existing.name,
    slug: existing.slug,
    code: existing.code,
    summary: existing.summary,
    category: existing.category as ProgramDefinition["category"],
    frequency: existing.frequency as ProgramDefinition["frequency"],
    durationMinutes: existing.durationMinutes,
    xpReward: existing.xpReward,
    mode: existing.mode as ProgramDefinition["mode"],
    units: fallbackUnits
  });

  const validationError = validateProgramInput(parsed);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const blueprint = createBlueprintFromSource(
      {
        summary: parsed.summary,
        category: parsed.category,
        durationMinutes: parsed.durationMinutes,
        xpReward: parsed.xpReward,
        frequency: parsed.frequency,
        units: parsed.units
      },
      parsed.blueprintInput
    );
    const blueprintColumns = blueprintToPersistenceColumns(blueprint);

    await prisma.$transaction(async (tx) => {
      await tx.exercise.deleteMany({ where: { unit: { programId: existing.id } } });
      await tx.programUnit.deleteMany({ where: { programId: existing.id } });

      await tx.program.update({
        where: { id: existing.id },
        data: {
          name: parsed.name,
          code: parsed.code,
          category: parsed.category,
          slug: parsed.slug,
          summary: parsed.summary,
          frequency: parsed.frequency,
          durationMinutes: parsed.durationMinutes,
          xpReward: parsed.xpReward,
          mode: parsed.mode,
          ...(blueprintColumns as any),
          units: {
            create: mapUnitsForCreate(parsed.units)
          }
        }
      });
    });

    const updatedProgram = await loadProgramBySlug(parsed.slug);
    return NextResponse.json(updatedProgram, { status: 200 });
  } catch (error) {
    console.error("Programs PUT failed", error);
    return NextResponse.json(
      { error: "Programm konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = toRecord(await request.json().catch(() => ({})));
  const id = typeof body.id === "string" ? body.id : undefined;
  const slug = typeof body.slug === "string" ? normalizeSlug(body.slug) : undefined;

  if (!id && !slug) {
    return NextResponse.json(
      { error: "Program ID oder Slug muss angegeben werden." },
      { status: 400 }
    );
  }

  const existing = id
    ? await prisma.program.findUnique({ where: { id }, select: { id: true, slug: true } })
    : await prisma.program.findUnique({ where: { slug: slug! }, select: { id: true, slug: true } });

  if (!existing) {
    return NextResponse.json({ error: "Programm nicht gefunden." }, { status: 404 });
  }

  try {
    const runCount = await prisma.programRun.count({ where: { programId: existing.id } });
    if (runCount > 0) {
      await prisma.program.update({
        where: { id: existing.id },
        data: { status: "archived" }
      });
      return NextResponse.json(
        {
          success: true,
          archived: true,
          message:
            "Programm hat bereits Runs und wurde deshalb archiviert statt gelöscht."
        },
        { status: 200 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.exercise.deleteMany({ where: { unit: { programId: existing.id } } });
      await tx.programUnit.deleteMany({ where: { programId: existing.id } });
      await tx.program.delete({ where: { id: existing.id } });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Programs DELETE failed", error);
    return NextResponse.json(
      { error: "Programm konnte nicht gelöscht werden." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : undefined;
    const slug = typeof body.slug === "string" ? body.slug : undefined;

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Program ID oder Slug muss angegeben werden." },
        { status: 400 }
      );
    }

    const programRecord = id
      ? await prisma.program.findUnique({
          where: { id },
          select: {
            id: true,
            slug: true,
            summary: true,
            category: true,
            durationMinutes: true,
            frequency: true,
            xpReward: true,
            xpRules: true
          }
        })
      : await prisma.program.findUnique({
          where: { slug: slug! },
          select: {
            id: true,
            slug: true,
            summary: true,
            category: true,
            durationMinutes: true,
            frequency: true,
            xpReward: true,
            xpRules: true
          }
        });

    if (!programRecord) {
      return NextResponse.json({ error: "Programm nicht gefunden." }, { status: 404 });
    }

    const data: Prisma.ProgramUpdateInput = {};

    if (body.xpReward !== undefined) {
      const parsed = Number(body.xpReward);
      if (!Number.isFinite(parsed)) {
        return NextResponse.json({ error: "Ungültiger XP-Wert." }, { status: 400 });
      }
      const xpReward = Math.max(0, Math.round(parsed));
      data.xpReward = xpReward;

      const xpRules: ProgramXpRulesConfig =
        (programRecord.xpRules as ProgramXpRulesConfig | null) ??
        createBlueprintFromSource({
          summary: programRecord.summary ?? "",
          category: programRecord.category as ProgramDefinition["category"],
          durationMinutes: programRecord.durationMinutes,
          xpReward,
          frequency: programRecord.frequency as ProgramDefinition["frequency"],
          units: []
        }).xp;

      data.xpRules = { ...xpRules, baseValue: xpReward } as any;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Keine Änderungen angegeben." }, { status: 400 });
    }

    const updated = await prisma.program.update({
      where: { id: programRecord.id },
      data
    });

    const payload = await loadProgramBySlug(updated.slug);
    return NextResponse.json(payload ?? updated, { status: 200 });
  } catch (error) {
    console.error("Programs PATCH failed", error);
    return NextResponse.json(
      { error: "Programm konnte nicht aktualisiert werden." },
      { status: 500 }
    );
  }
}
