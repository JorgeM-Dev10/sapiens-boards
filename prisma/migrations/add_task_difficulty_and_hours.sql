-- AlterTable
-- Agregar campos difficulty y hours a la tabla Task
ALTER TABLE "Task" 
ADD COLUMN IF NOT EXISTS "difficulty" TEXT,
ADD COLUMN IF NOT EXISTS "hours" DOUBLE PRECISION;

