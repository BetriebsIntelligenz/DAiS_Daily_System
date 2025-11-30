-- DropForeignKey
ALTER TABLE "BrainExerciseSession" DROP CONSTRAINT "BrainExerciseSession_exerciseId_fkey";

-- DropForeignKey
ALTER TABLE "LearningMilestone" DROP CONSTRAINT "LearningMilestone_pathId_fkey";

-- DropForeignKey
ALTER TABLE "LearningMilestoneProgress" DROP CONSTRAINT "LearningMilestoneProgress_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "MindGoalCheckin" DROP CONSTRAINT "MindGoalCheckin_goalId_fkey";

-- AddForeignKey
ALTER TABLE "MindGoalCheckin" ADD CONSTRAINT "MindGoalCheckin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MindGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainExerciseSession" ADD CONSTRAINT "BrainExerciseSession_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "BrainExercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestone" ADD CONSTRAINT "LearningMilestone_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestoneProgress" ADD CONSTRAINT "LearningMilestoneProgress_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "LearningMilestone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
