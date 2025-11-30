-- CreateTable
CREATE TABLE "MindVisualizationAsset" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindVisualizationAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specific" TEXT NOT NULL,
    "measurable" TEXT NOT NULL,
    "achievable" TEXT NOT NULL,
    "relevant" TEXT NOT NULL,
    "timeBound" TEXT NOT NULL,
    "metricName" TEXT,
    "targetValue" INTEGER,
    "unit" TEXT,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MindGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MindGoalCheckin" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT,
    "progressPercent" INTEGER NOT NULL,
    "selfAssessment" TEXT,
    "readThrough" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindGoalCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainExercise" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrainExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrainExerciseSession" (
    "id" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrainExerciseSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMilestone" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "LearningMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningMilestoneProgress" (
    "id" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "userId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningMilestoneProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningMilestoneProgress_milestoneId_userId_key" ON "LearningMilestoneProgress"("milestoneId", "userId");

-- CreateTable
CREATE TABLE "EmotionPractice" (
    "id" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "regulationSteps" JSONB NOT NULL,
    "groundingPrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "practiceId" TEXT,
    "emotionLabel" TEXT NOT NULL,
    "intensity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MindGoalCheckin" ADD CONSTRAINT "MindGoalCheckin_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "MindGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindGoalCheckin" ADD CONSTRAINT "MindGoalCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainExerciseSession" ADD CONSTRAINT "BrainExerciseSession_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "BrainExercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrainExerciseSession" ADD CONSTRAINT "BrainExerciseSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestone" ADD CONSTRAINT "LearningMilestone_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestoneProgress" ADD CONSTRAINT "LearningMilestoneProgress_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "LearningMilestone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningMilestoneProgress" ADD CONSTRAINT "LearningMilestoneProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionLog" ADD CONSTRAINT "EmotionLog_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "EmotionPractice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionLog" ADD CONSTRAINT "EmotionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
