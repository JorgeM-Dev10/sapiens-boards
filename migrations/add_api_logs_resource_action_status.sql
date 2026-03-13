-- Añadir columnas resource, action, statusCode a api_logs (si ya existe la tabla)
ALTER TABLE "api_logs" ADD COLUMN IF NOT EXISTS "resource" TEXT;
ALTER TABLE "api_logs" ADD COLUMN IF NOT EXISTS "action" TEXT;
ALTER TABLE "api_logs" ADD COLUMN IF NOT EXISTS "statusCode" INTEGER;
