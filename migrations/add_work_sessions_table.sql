-- Migración para agregar la tabla WorkSession
-- Ejecuta este SQL en tu base de datos PostgreSQL

-- Crear la tabla WorkSession
CREATE TABLE IF NOT EXISTS "WorkSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "listId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "workType" TEXT NOT NULL DEFAULT 'dev',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- Crear índices para mejorar las consultas
CREATE INDEX IF NOT EXISTS "WorkSession_userId_idx" ON "WorkSession"("userId");
CREATE INDEX IF NOT EXISTS "WorkSession_boardId_idx" ON "WorkSession"("boardId");
CREATE INDEX IF NOT EXISTS "WorkSession_date_idx" ON "WorkSession"("date");
CREATE INDEX IF NOT EXISTS "WorkSession_listId_idx" ON "WorkSession"("listId");

-- Agregar las foreign key constraints
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Comentarios para documentación
COMMENT ON TABLE "WorkSession" IS 'Tabla para almacenar sesiones de trabajo y commits diarios';
COMMENT ON COLUMN "WorkSession"."workType" IS 'Tipo de trabajo: dev, diseño, ops, calls, etc';
COMMENT ON COLUMN "WorkSession"."durationMinutes" IS 'Duración calculada automáticamente en minutos';



