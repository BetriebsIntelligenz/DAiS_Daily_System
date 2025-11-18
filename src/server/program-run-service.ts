import { prisma } from "@/lib/prisma";
import { getOrCreateDemoUser } from "@/lib/demo-user";
import { programDefinitions } from "@/lib/data";

interface CreateProgramRunParams {
  programId: string;
  payload: Record<string, unknown>;
  userEmail?: string;
  userName?: string;
}

export async function createProgramRun({
  programId,
  payload,
  userEmail,
  userName
}: CreateProgramRunParams) {
  let program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      units: {
        include: { exercises: true }
      }
    }
  });

  if (!program) {
    const definition =
      programDefinitions.find(
        (candidate) => candidate.id === programId || candidate.slug === programId
      ) ?? null;

    if (!definition) {
      throw new Error("Programm nicht gefunden");
    }

    const createdProgram = await prisma.program.create({
      data: {
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
      },
      include: {
        units: {
          include: { exercises: true }
        }
      }
    });

    program = createdProgram;
  }

  const user = await getOrCreateDemoUser({
    email: userEmail,
    name: userName
  });

  const xpEarned = program.units.reduce((sum, unit) => {
    return (
      sum +
      unit.exercises.reduce((innerSum, exercise) => innerSum + exercise.xpValue, 0)
    );
  }, 0);

  const run = await prisma.programRun.create({
    data: {
      programId,
      userId: user.id,
      mode: program.mode,
      xpEarned,
      answers: JSON.parse(JSON.stringify(payload ?? {}))
    }
  });

  await prisma.xpTransaction.create({
    data: {
      userId: user.id,
      category: program.category,
      amount: xpEarned,
      type: "earn",
      source: "program",
      programRunId: run.id
    }
  });

  return { runId: run.id, xpEarned };
}
