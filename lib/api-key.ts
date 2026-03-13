import { createHash, randomBytes } from "crypto"
import { prisma } from "./prisma"

const PREFIX = "sk_sapiens_"
const RANDOM_BYTES = 16 // 32 caracteres hex

/**
 * Genera una API Key segura: sk_sapiens_ + 32 caracteres hex (crypto.randomBytes).
 * No usar Math.random.
 */
export function generateSecureKey(): string {
  const randomPart = randomBytes(RANDOM_BYTES).toString("hex")
  return `${PREFIX}${randomPart}`
}

/**
 * Hash SHA-256 de la key para guardar y buscar en DB (nunca guardar la key en claro).
 */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex")
}

/**
 * Prefijo para mostrar en listados (solo primeros caracteres).
 */
export function keyPrefix(key: string, visibleChars = 12): string {
  const start = PREFIX.length
  const visible = key.slice(0, PREFIX.length + visibleChars)
  return visible + "…"
}

/**
 * Busca una API Key por el header x-api-key o Authorization: Bearer <key>.
 * Si existe y está activa: actualiza lastUsedAt y devuelve el registro.
 * Si no existe → null.
 * Si existe pero inactiva → lanza error para devolver 403.
 */
export async function findAndValidateApiKey(
  rawKey: string | null
): Promise<{ id: string; createdById: string; name: string } | null> {
  if (!rawKey?.trim()) return null

  const keyHash = hashKey(rawKey.trim())
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
  })

  if (!apiKey) return null
  if (!apiKey.isActive) {
    const err = new Error("API key desactivada") as Error & { code?: string }
    err.code = "API_KEY_INACTIVE"
    throw err
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    id: apiKey.id,
    createdById: apiKey.createdById,
    name: apiKey.name,
  }
}

/**
 * Extrae la API Key del request (header x-api-key o Authorization: Bearer).
 */
export function getApiKeyFromRequest(request: Request): string | null {
  const fromHeader = request.headers.get("x-api-key")?.trim()
  if (fromHeader) return fromHeader
  const auth = request.headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim()
  return null
}
