-- ============================================
-- MIGRACIÓN COMPLETA: Worker y PaymentLog
-- ============================================

-- Paso 1: Crear tabla Worker si no existe
CREATE TABLE IF NOT EXISTS "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "responsibilities" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentType" TEXT NOT NULL DEFAULT 'FIXED',
    "percentage" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentDate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- Crear índice para userId en Worker
CREATE INDEX IF NOT EXISTS "Worker_userId_idx" ON "Worker"("userId");

-- Agregar foreign key a User si existe (ajusta según tu esquema)
-- Si User no existe, comenta esta línea
-- ALTER TABLE "Worker" 
-- ADD CONSTRAINT "Worker_userId_fkey" 
-- FOREIGN KEY ("userId") 
-- REFERENCES "User"("id") 
-- ON DELETE CASCADE 
-- ON UPDATE CASCADE;

-- Paso 2: Crear tabla PaymentLog
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

-- Crear índice para mejorar las consultas por workerId
CREATE INDEX IF NOT EXISTS "PaymentLog_workerId_idx" ON "PaymentLog"("workerId");

-- Paso 3: Agregar foreign key constraint a Worker
-- Solo se ejecutará si Worker existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Worker') THEN
        -- Verificar si la constraint ya existe antes de agregarla
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'PaymentLog_workerId_fkey'
        ) THEN
            ALTER TABLE "PaymentLog" 
            ADD CONSTRAINT "PaymentLog_workerId_fkey" 
            FOREIGN KEY ("workerId") 
            REFERENCES "Worker"("id") 
            ON DELETE CASCADE 
            ON UPDATE CASCADE;
        END IF;
    ELSE
        RAISE NOTICE 'La tabla Worker no existe. La tabla PaymentLog se creó sin foreign key.';
    END IF;
END $$;

