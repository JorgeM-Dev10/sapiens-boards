-- Migración: Agregar tablas Order y OrderItem para gestionar pedidos
-- Ejecutar este SQL en tu base de datos PostgreSQL

-- Primero, verificar qué tablas existen (ejecutar esto para ver el nombre correcto)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 1. Crear tabla Order (sin foreign key primero)
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  "totalAmount" DOUBLE PRECISION NOT NULL,
  notes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL
);

-- 2. Crear tabla OrderItem (sin foreign keys primero)
CREATE TABLE IF NOT EXISTS "OrderItem" (
  id TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "orderId" TEXT NOT NULL,
  "solutionId" TEXT NOT NULL
);

-- 3. Agregar foreign keys solo si las tablas referenciadas existen
-- Verificar si existe la tabla User (puede ser "User" o "user" dependiendo de tu setup)
DO $$
BEGIN
  -- Agregar foreign key a User si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'Order_userId_fkey' AND table_name = 'Order'
    ) THEN
      ALTER TABLE "Order" 
      ADD CONSTRAINT "Order_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Agregar foreign key a AISolution si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AISolution' AND table_schema = 'public') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'OrderItem_solutionId_fkey' AND table_name = 'OrderItem'
    ) THEN
      ALTER TABLE "OrderItem" 
      ADD CONSTRAINT "OrderItem_solutionId_fkey" 
      FOREIGN KEY ("solutionId") REFERENCES "AISolution"(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- Agregar foreign key de OrderItem a Order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'OrderItem_orderId_fkey' AND table_name = 'OrderItem'
  ) THEN
    ALTER TABLE "OrderItem" 
    ADD CONSTRAINT "OrderItem_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"(status);
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_solutionId_idx" ON "OrderItem"("solutionId");

-- Verificar que las tablas se crearon correctamente
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('Order', 'OrderItem');

