-- SQL para eliminar PaymentLog y todo lo relacionado
-- CUIDADO: Esto eliminará TODOS los datos de PaymentLog permanentemente

-- Paso 1: Eliminar la foreign key constraint si existe
ALTER TABLE "PaymentLog" 
DROP CONSTRAINT IF EXISTS "PaymentLog_workerId_fkey";

-- Paso 2: Eliminar el índice si existe
DROP INDEX IF EXISTS "PaymentLog_workerId_idx";

-- Paso 3: Eliminar la tabla PaymentLog completamente
DROP TABLE IF EXISTS "PaymentLog";

-- Verificar que se eliminó (esto debería mostrar 0 filas si se eliminó correctamente)
SELECT COUNT(*) as tablas_restantes 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'PaymentLog';

