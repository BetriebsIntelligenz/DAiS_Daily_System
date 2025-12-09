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
  ProgramUnit,
  ProgramXpRulesConfig
} from "@/lib/types";

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
        ...blueprintColumns,
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
  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const category = body.category ?? "mind";
  const summary = typeof body.summary === "string" ? body.summary : "";
  const frequency: ProgramDefinition["frequency"] =
    body.frequency ?? "daily";
  const durationMinutes = Number(body.durationMinutes ?? 10);
  const xpReward = Number(body.xpReward ?? 200);
  const mode: ProgramDefinition["mode"] = body.mode ?? "single";
  const blueprintInput: Partial<ProgramBlueprint> | undefined = body.blueprint;
  const units: ProgramUnit[] = Array.isArray(body.units) ? body.units : [];

  if (!name || !category) {
    return NextResponse.json(
      { error: "Name und Kategorie sind Pflichtfelder." },
      { status: 400 }
    );
  }

  const slug =
    body.slug ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  try {
    const blueprint = createBlueprintFromSource(
      {
        summary,
        category,
        durationMinutes,
        xpReward,
        frequency,
        units
      },
      blueprintInput
    );
    const blueprintColumns = blueprintToPersistenceColumns(blueprint);

    await prisma.program.create({
      data: {
        name,
        code: body.code ?? name.slice(0, 3).toUpperCase(),
        category,
        slug,
        summary,
        frequency,
        durationMinutes,
        xpReward,
        mode,
        ...blueprintColumns
      }
    });

    const createdProgram = await loadProgramBySlug(slug);
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

      data.xpRules = { ...xpRules, baseValue: xpReward };
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
