-- SQL SIMPLE: Solo crea PaymentLog sin foreign key
-- Úsalo si Worker no existe o tiene otro nombre

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

-- NOTA: La foreign key se agregará después cuando verifiques el nombre correcto de la tabla Worker

