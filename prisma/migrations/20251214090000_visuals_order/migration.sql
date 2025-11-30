-- Add order column for visualization assets
ALTER TABLE "MindVisualizationAsset" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
