-- BitacoraBoard: tema de color personalizable
ALTER TABLE "BitacoraBoard" ADD COLUMN IF NOT EXISTS "themeColor" TEXT;
ALTER TABLE "BitacoraBoard" ADD COLUMN IF NOT EXISTS "themeVariant" TEXT;
