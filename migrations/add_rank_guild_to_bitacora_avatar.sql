-- Agregar columnas rank y guild a BitacoraAvatar
ALTER TABLE "BitacoraAvatar" 
ADD COLUMN IF NOT EXISTS "rank" TEXT DEFAULT 'Novato',
ADD COLUMN IF NOT EXISTS "guild" TEXT DEFAULT 'I';

-- Actualizar registros existentes con valores por defecto
UPDATE "BitacoraAvatar" 
SET "rank" = 'Novato', "guild" = 'I' 
WHERE "rank" IS NULL OR "guild" IS NULL;



