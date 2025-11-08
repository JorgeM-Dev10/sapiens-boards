-- ============================================
-- MIGRACIÓN: Crear tabla PaymentLog
-- ============================================

-- Paso 1: Crear tabla PaymentLog
CREATE TABLE IF NOT EXISTS "PaymentLog" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "previousSalary" DOUBLE PRECISION,
    "newSalary" DOUBLE PRECISION,
    "description" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workerId" TEXT NOT NULL,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- Paso 2: Crear índice para mejorar las consultas por workerId
CREATE INDEX IF NOT EXISTS "PaymentLog_workerId_idx" ON "PaymentLog"("workerId");

-- Paso 3: Agregar foreign key constraint a Worker
-- Esto solo funcionará si la tabla Worker existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Worker'
    ) THEN
        -- Verificar si la constraint ya existe antes de agregarla
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_schema = 'public'
            AND constraint_name = 'PaymentLog_workerId_fkey'
        ) THEN
            ALTER TABLE "PaymentLog" 
            ADD CONSTRAINT "PaymentLog_workerId_fkey" 
            FOREIGN KEY ("workerId") 
            REFERENCES "Worker"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
            
            RAISE NOTICE 'Foreign key agregada exitosamente a PaymentLog';
        ELSE
            RAISE NOTICE 'La foreign key ya existe';
        END IF;
    ELSE
        RAISE NOTICE 'La tabla Worker no existe. PaymentLog se creó sin foreign key.';
        RAISE NOTICE 'Puedes agregar la foreign key manualmente cuando Worker esté disponible.';
    END IF;
END $$;

