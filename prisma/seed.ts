import { PrismaClient } from "@prisma/client";

import {
  journalDefinitions,
  programDefinitions,
  rewardDefinitions
} from "../src/lib/data";

const prisma = new PrismaClient();

async function main() {
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@dais.app" },
    update: {},
    create: {
      email: "demo@dais.app",
      password: "changeme",
      name: "DAiS Demo",
      role: "admin"
    }
  });

  for (const reward of rewardDefinitions) {
    await prisma.reward.upsert({
      where: { id: reward.id },
      create: reward,
      update: reward
    });
  }

  for (const program of programDefinitions) {
    await prisma.program.upsert({
      where: { id: program.id },
      create: {
        id: program.id,
        slug: program.slug,
        code: program.code,
        name: program.name,
        summary: program.summary,
        category: program.category,
        frequency: program.frequency,
        durationMinutes: program.durationMinutes,
        xpReward: program.xpReward,
        mode: program.mode,
        units: {
          create: program.units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            order: unit.order,
            exercises: {
              create: unit.exercises.map((exercise) => ({
                id: exercise.id,
                label: exercise.label,
                description: exercise.description,
                type: exercise.type,
                config: exercise.config ?? {},
                xpValue: exercise.xpValue
              }))
            }
          }))
        }
      },
      update: {}
    });
  }

  for (const journal of journalDefinitions) {
    await prisma.journal.upsert({
      where: { id: journal.id },
      create: {
        id: journal.id,
        name: journal.name,
        type: journal.type,
        userId: demoUser.id
      },
      update: {}
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
