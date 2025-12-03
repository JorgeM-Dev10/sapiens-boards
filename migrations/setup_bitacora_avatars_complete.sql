-- ============================================
-- SCRIPT COMPLETO PARA CONFIGURAR AVATARES DE BITÁCORAS
-- Ejecutar este script una sola vez
-- ============================================

-- 1. Agregar campo avatarImageUrl si no existe
ALTER TABLE "BitacoraAvatar" 
ADD COLUMN IF NOT EXISTS "avatarImageUrl" TEXT;

-- 2. Asegurar que el campo rank existe y tiene valores correctos
-- (Si ya ejecutaste update_rank_system.sql, esto no hará cambios)
ALTER TABLE "BitacoraAvatar" 
ADD COLUMN IF NOT EXISTS "rank" TEXT DEFAULT 'Principiante';

-- Actualizar valores de rank si existen valores antiguos
UPDATE "BitacoraAvatar" 
SET "rank" = CASE
  WHEN "rank" = 'Novato' THEN 'Principiante'
  WHEN "rank" = 'Aprendiz' THEN 'Intermedio'
  WHEN "rank" = 'Experto' THEN 'Avanzado'
  WHEN "rank" = 'Maestro' THEN 'Épico'
  WHEN "rank" = 'Leyenda' THEN 'Leyenda'
  ELSE COALESCE("rank", 'Principiante')
END
WHERE "rank" IS NOT NULL;

-- Asegurar que todos tengan un valor por defecto
UPDATE "BitacoraAvatar" 
SET "rank" = 'Principiante' 
WHERE "rank" IS NULL;

-- 3. Eliminar columna guild si existe (ya no se usa)
ALTER TABLE "BitacoraAvatar" 
DROP COLUMN IF EXISTS "guild";

-- 4. Actualizar URLs de imágenes según el rango actual
UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/ZhsrnvR.png'
WHERE "rank" = 'Principiante';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/8sfE7ue.png'
WHERE "rank" = 'Intermedio';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/3oUQA6l.png'
WHERE "rank" = 'Avanzado';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/CCuILkk.png'
WHERE "rank" = 'Épico';

UPDATE "BitacoraAvatar"
SET "avatarImageUrl" = 'https://i.imgur.com/5WDwPXs.png'
WHERE "rank" = 'Leyenda';

-- Verificar resultados
SELECT 
  "rank", 
  COUNT(*) as cantidad,
  COUNT("avatarImageUrl") as con_imagen
FROM "BitacoraAvatar"
GROUP BY "rank";

