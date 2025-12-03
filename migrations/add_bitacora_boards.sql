-- Crear tabla BitacoraBoard
CREATE TABLE IF NOT EXISTS "BitacoraBoard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BitacoraBoard_pkey" PRIMARY KEY ("id")
);

-- Crear tabla BitacoraAvatar
CREATE TABLE IF NOT EXISTS "BitacoraAvatar" (
    "id" TEXT NOT NULL,
    "bitacoraBoardId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTasks" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "avatarStyle" TEXT NOT NULL DEFAULT 'basic',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BitacoraAvatar_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BitacoraAvatar_bitacoraBoardId_key" UNIQUE ("bitacoraBoardId")
);

-- Agregar columnas a WorkSession
ALTER TABLE "WorkSession" 
ADD COLUMN IF NOT EXISTS "bitacoraBoardId" TEXT,
ALTER COLUMN "boardId" DROP NOT NULL;

-- Agregar foreign keys
ALTER TABLE "BitacoraBoard" 
ADD CONSTRAINT "BitacoraBoard_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BitacoraAvatar" 
ADD CONSTRAINT "BitacoraAvatar_bitacoraBoardId_fkey" 
FOREIGN KEY ("bitacoraBoardId") REFERENCES "BitacoraBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkSession" 
ADD CONSTRAINT "WorkSession_bitacoraBoardId_fkey" 
FOREIGN KEY ("bitacoraBoardId") REFERENCES "BitacoraBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS "BitacoraBoard_userId_idx" ON "BitacoraBoard"("userId");
CREATE INDEX IF NOT EXISTS "BitacoraBoard_order_idx" ON "BitacoraBoard"("order");
CREATE INDEX IF NOT EXISTS "WorkSession_bitacoraBoardId_idx" ON "WorkSession"("bitacoraBoardId");

-- Comentarios
COMMENT ON TABLE "BitacoraBoard" IS 'Tableros de bitácoras personales para cada usuario';
COMMENT ON TABLE "BitacoraAvatar" IS 'Sistema de gamificación con avatares que mejoran según el progreso';
COMMENT ON COLUMN "BitacoraAvatar"."level" IS 'Nivel del avatar (1-100+)';
COMMENT ON COLUMN "BitacoraAvatar"."experience" IS 'Experiencia total acumulada';
COMMENT ON COLUMN "BitacoraAvatar"."avatarStyle" IS 'Estilo del avatar según nivel: basic, intermediate, advanced, expert, master, legend';



