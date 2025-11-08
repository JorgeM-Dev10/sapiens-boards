-- Agregar campo order a la tabla Board
ALTER TABLE "Board" 
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Actualizar el orden de los boards existentes basado en createdAt
UPDATE "Board" 
SET "order" = subquery.row_number - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) as row_number
  FROM "Board"
) AS subquery
WHERE "Board".id = subquery.id;

-- Crear índice para mejorar las consultas ordenadas
CREATE INDEX IF NOT EXISTS "Board_order_idx" ON "Board"("order");

