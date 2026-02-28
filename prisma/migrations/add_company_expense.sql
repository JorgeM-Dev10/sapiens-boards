-- CompanyExpense: gastos globales de la empresa (independientes de clientes)
CREATE TABLE IF NOT EXISTS "CompanyExpense" (
  "id" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,

  CONSTRAINT "CompanyExpense_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
