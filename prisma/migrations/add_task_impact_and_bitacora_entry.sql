-- Task: campos de impacto y evaluación IA
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "difficulty" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "economicValue" DOUBLE PRECISION;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "impactLevel" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "impactScore" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "xpValue" INTEGER;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "evaluatedByAI" BOOLEAN NOT NULL DEFAULT false;

-- BitacoraEntry: entradas por impacto (tarea completada = entrada automática)
CREATE TABLE IF NOT EXISTS "BitacoraEntry" (
  "id" TEXT NOT NULL,
  "taskId" TEXT,
  "bitacoraBoardId" TEXT NOT NULL,
  "xpGanado" INTEGER NOT NULL DEFAULT 0,
  "impactScore" INTEGER,
  "economicImpact" DOUBLE PRECISION,
  "aiReasoning" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BitacoraEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BitacoraEntry" ADD CONSTRAINT "BitacoraEntry_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BitacoraEntry" ADD CONSTRAINT "BitacoraEntry_bitacoraBoardId_fkey"
  FOREIGN KEY ("bitacoraBoardId") REFERENCES "BitacoraBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "BitacoraEntry_taskId_idx" ON "BitacoraEntry"("taskId");
CREATE INDEX IF NOT EXISTS "BitacoraEntry_bitacoraBoardId_idx" ON "BitacoraEntry"("bitacoraBoardId");
