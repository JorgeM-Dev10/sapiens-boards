-- Migración: tabla api_keys para API Keys de integración con agentes externos
-- Ejecuta este SQL en Supabase (SQL Editor) si prisma migrate dev se queda colgado

CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "permissions" JSONB,
  "lastUsedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,

  CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_keyHash_key" ON "api_keys"("keyHash");

ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
