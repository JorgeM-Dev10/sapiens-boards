-- Migración para agregar la tabla Library
-- Ejecuta este SQL en tu base de datos PostgreSQL

-- Crear la tabla Library
CREATE TABLE IF NOT EXISTS "Library" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- Crear índice para mejorar las consultas por usuario
CREATE INDEX IF NOT EXISTS "Library_userId_idx" ON "Library"("userId");

-- Agregar la foreign key constraint
ALTER TABLE "Library" ADD CONSTRAINT "Library_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comentarios para documentación
COMMENT ON TABLE "Library" IS 'Tabla para almacenar recursos de la librería de conocimiento (videos, PDFs, enlaces, etc.)';
COMMENT ON COLUMN "Library"."type" IS 'Tipo de recurso: VIDEO, PDF, LINK, DOCUMENT';
COMMENT ON COLUMN "Library"."category" IS 'Categoría personalizada del recurso (ej: Tutoriales, Documentación, Recursos)';



