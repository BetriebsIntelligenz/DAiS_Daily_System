import { PrismaClient } from "@prisma/client";

import {
  journalDefinitions,
  programDefinitions,
  rewardDefinitions
} from "../src/lib/data";
import { blueprintToPersistenceColumns } from "../src/lib/program-blueprint";
import {
  visualizationSeeds,
  mindGoalSeeds,
  brainExerciseSeeds,
  learningPathSeeds,
  emotionPracticeSeeds,
  meditationFlowSeeds,
  performanceChecklistSeeds
} from "../src/lib/mind-data";
import { householdCardSeeds, householdTaskSeeds } from "../src/lib/household-data";
import { humanContactSeeds } from "../src/lib/human-data";

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
        ...(blueprintToPersistenceColumns(program.blueprint) as any),
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
                config: JSON.parse(JSON.stringify(exercise.config ?? {})),
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

  for (const asset of visualizationSeeds) {
    await prisma.mindVisualizationAsset.upsert({
      where: { id: asset.id },
      create: {
        id: asset.id,
        title: asset.title,
        imageData: asset.imageData,
        order: typeof asset.order === "number" ? asset.order : 0
      },
      update: {
        title: asset.title,
        imageData: asset.imageData,
        order: typeof asset.order === "number" ? asset.order : 0
      }
    });
  }

  for (const item of performanceChecklistSeeds) {
    await prisma.performanceChecklistItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        label: item.label,
        summary: item.summary,
        order: item.order
      },
      update: {
        label: item.label,
        summary: item.summary,
        order: item.order
      }
    });
  }

  for (const goal of mindGoalSeeds) {
    await prisma.mindGoal.upsert({
      where: { id: goal.id },
      create: {
        id: goal.id,
        title: goal.title,
        specific: goal.specific,
        measurable: goal.measurable,
        achievable: goal.achievable,
        relevant: goal.relevant,
        timeBound: goal.timeBound,
        metricName: goal.metricName,
        targetValue: goal.targetValue ?? null,
        unit: goal.unit,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : null
      },
      update: {
        title: goal.title,
        specific: goal.specific,
        measurable: goal.measurable,
        achievable: goal.achievable,
        relevant: goal.relevant,
        timeBound: goal.timeBound,
        metricName: goal.metricName,
        targetValue: goal.targetValue ?? null,
        unit: goal.unit,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : null
      }
    });
  }

  for (const exercise of brainExerciseSeeds) {
    await prisma.brainExercise.upsert({
      where: { id: exercise.id },
      create: exercise,
      update: exercise
    });
  }

  for (const path of learningPathSeeds) {
    await prisma.learningPath.upsert({
      where: { id: path.id },
      create: {
        id: path.id,
        title: path.title,
        theme: path.theme,
        description: path.description
      },
      update: {
        title: path.title,
        theme: path.theme,
        description: path.description
      }
    });

    for (const milestone of path.milestones) {
      await prisma.learningMilestone.upsert({
        where: { id: milestone.id },
        create: {
          id: milestone.id,
          pathId: path.id,
          title: milestone.title,
          description: milestone.description,
          order: milestone.order
        },
        update: {
          pathId: path.id,
          title: milestone.title,
          description: milestone.description,
          order: milestone.order
        }
      });
    }
  }

  for (const practice of emotionPracticeSeeds) {
    await prisma.emotionPractice.upsert({
      where: { id: practice.id },
      create: practice,
      update: practice
    });
  }

  for (const flow of meditationFlowSeeds) {
    await prisma.mindMeditationFlow.upsert({
      where: { id: flow.id },
      create: {
        id: flow.id,
        title: flow.title,
        subtitle: flow.subtitle,
        summary: flow.summary,
        order: typeof flow.order === "number" ? flow.order : 0
      },
      update: {
        title: flow.title,
        subtitle: flow.subtitle,
        summary: flow.summary,
        order: typeof flow.order === "number" ? flow.order : 0
      }
    });

    for (const step of flow.steps) {
      await prisma.mindMeditationStep.upsert({
        where: { id: step.id },
        create: {
          id: step.id,
          flowId: flow.id,
          title: step.title,
          description: step.description ?? null,
          order: typeof step.order === "number" ? step.order : 0
        },
        update: {
          flowId: flow.id,
          title: step.title,
          description: step.description ?? null,
          order: typeof step.order === "number" ? step.order : 0
        }
      });
    }
  }

  for (const task of householdTaskSeeds) {
    await prisma.householdTask.upsert({
      where: { id: task.id },
      create: {
        id: task.id,
        label: task.label,
        order: task.order
      },
      update: {
        label: task.label,
        order: task.order,
        active: true
      }
    });
  }

  for (const card of householdCardSeeds) {
    await prisma.householdCard.upsert({
      where: { id: card.id },
      create: {
        id: card.id,
        title: card.title,
        summary: card.summary,
        weekday: card.weekday
      },
      update: {
        title: card.title,
        summary: card.summary,
        weekday: card.weekday
      }
    });
    await prisma.householdCardTask.deleteMany({ where: { cardId: card.id } });
    for (const [index, taskId] of card.taskIds.entries()) {
      await prisma.householdCardTask.create({
        data: {
          cardId: card.id,
          taskId,
          order: index
        }
      });
    }
  }

  for (const contact of humanContactSeeds) {
    await prisma.humanContactPerson.upsert({
      where: { id: contact.id },
      create: {
        id: contact.id,
        name: contact.name,
        relation: contact.relation,
        note: contact.note ?? null
      },
      update: {
        name: contact.name,
        relation: contact.relation,
        note: contact.note ?? null
      }
    });

    await prisma.humanContactAssignment.deleteMany({ where: { personId: contact.id } });
    const cadences = ["daily", "weekly"] as const;
    for (const cadence of cadences) {
      const activities = contact.assignments?.[cadence];
      if (!activities || activities.length === 0) {
        continue;
      }
      for (const activity of activities) {
        await prisma.humanContactAssignment.create({
          data: {
            personId: contact.id,
            activity,
            cadence
          }
        });
      }
    }
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
