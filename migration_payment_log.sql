-- Primero, verificar si la tabla Worker existe, si no, crearla
-- (Solo ejecuta esto si Worker no existe en tu base de datos)
-- Si Worker ya existe, puedes saltar esta parte

-- Crear tabla PaymentLog para bitácora de pagos
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

-- Agregar foreign key constraint a Worker (solo si Worker existe)
-- Si Worker no existe, primero necesitas crearla o verificar el nombre correcto de la tabla
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Worker') THEN
        ALTER TABLE "PaymentLog" 
        ADD CONSTRAINT "PaymentLog_workerId_fkey" 
        FOREIGN KEY ("workerId") 
        REFERENCES "Worker"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE;
    ELSE
        RAISE NOTICE 'La tabla Worker no existe. Por favor crea la tabla Worker primero o verifica el nombre correcto.';
    END IF;
END $$;

