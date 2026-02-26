-- Add logoUrl to Client table (optional, for client logo)
ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
