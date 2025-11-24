-- Migración: Agregar categoryColor y order a la tabla AISolution
-- Ejecutar este SQL en tu base de datos PostgreSQL

-- 1. Agregar columna categoryColor (nullable, tipo TEXT)
ALTER TABLE "AISolution" 
ADD COLUMN IF NOT EXISTS "categoryColor" TEXT;

-- 2. Agregar columna order (INTEGER con default 0)
ALTER TABLE "AISolution" 
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- 3. Actualizar registros existentes: asignar order basado en createdAt
-- Esto asegura que los registros existentes tengan un orden inicial
UPDATE "AISolution" 
SET "order" = subquery.row_number - 1
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY type ORDER BY "createdAt" ASC) as row_number
  FROM "AISolution"
) AS subquery
WHERE "AISolution".id = subquery.id;

-- 4. (Opcional) Si quieres que categoryColor tenga un valor por defecto para registros existentes
-- UPDATE "AISolution" 
-- SET "categoryColor" = 'bg-gray-500' 
-- WHERE "categoryColor" IS NULL;

-- Verificar que las columnas se agregaron correctamente
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'AISolution' 
-- AND column_name IN ('categoryColor', 'order');


