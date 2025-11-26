-- Actualizar sistema de rangos: eliminar guild y actualizar rank
ALTER TABLE "BitacoraAvatar" 
DROP COLUMN IF EXISTS "guild";

-- Actualizar valores de rank existentes
UPDATE "BitacoraAvatar" 
SET "rank" = CASE
  WHEN "rank" = 'Novato' THEN 'Principiante'
  WHEN "rank" = 'Aprendiz' THEN 'Intermedio'
  WHEN "rank" = 'Experto' THEN 'Avanzado'
  WHEN "rank" = 'Maestro' THEN 'Épico'
  WHEN "rank" = 'Leyenda' THEN 'Leyenda'
  ELSE 'Principiante'
END
WHERE "rank" IS NOT NULL;

-- Asegurar que todos tengan un valor por defecto
UPDATE "BitacoraAvatar" 
SET "rank" = 'Principiante' 
WHERE "rank" IS NULL;

