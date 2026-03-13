-- Logs de peticiones API (por API Key)
CREATE TABLE IF NOT EXISTS "api_logs" (
  "id" TEXT NOT NULL,
  "apiKey" TEXT,
  "endpoint" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "resource" TEXT,
  "action" TEXT,
  "statusCode" INTEGER,
  "body" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);
