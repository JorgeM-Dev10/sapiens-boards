-- Agregar relación entre BitacoraBoard y Board
ALTER TABLE "BitacoraBoard" 
ADD COLUMN IF NOT EXISTS "boardId" TEXT;

-- Agregar foreign key constraint (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'BitacoraBoard_boardId_fkey'
    ) THEN
        ALTER TABLE "BitacoraBoard"
        ADD CONSTRAINT "BitacoraBoard_boardId_fkey" 
        FOREIGN KEY ("boardId") 
        REFERENCES "Board"("id") 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS "BitacoraBoard_boardId_idx" ON "BitacoraBoard"("boardId");

