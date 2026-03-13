import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import {
  getApiKeyFromRequest,
  findAndValidateApiKey,
} from "@/lib/api-key"

export type AuthResult =
  | { userId: string; method: "session" }
  | { userId: string; method: "apiKey" }
  | NextResponse

/**
 * Middleware checkApiKey: lee header x-api-key, busca en api_keys.
 * - No existe key en request → 401
 * - Key no existe en DB → 401
 * - Key existe pero isActive = false → 403
 * - Key existe y activa → permite request (devuelve userId).
 */
export async function checkApiKey(
  request: Request
): Promise<{ userId: string } | NextResponse> {
  const rawKey = getApiKeyFromRequest(request)
  if (!rawKey) {
    return NextResponse.json(
      { error: "No autorizado. Envía header x-api-key." },
      { status: 401 }
    )
  }
  try {
    const apiKey = await findAndValidateApiKey(rawKey)
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key inválida o no encontrada" },
        { status: 401 }
      )
    }
    return { userId: apiKey.createdById }
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e?.code === "API_KEY_INACTIVE") {
      return NextResponse.json(
        { error: "API key desactivada" },
        { status: 403 }
      )
    }
    throw err
  }
}

/**
 * Obtiene el userId permitiendo sesión O API Key (alternativa al login).
 * Primero sesión; si no hay sesión, usa checkApiKey (x-api-key).
 * Aplicado a: /api/clients, /api/workers, /api/bitacoras, /api/boards (roadmaps),
 * /api/ai-solutions (solutions), /api/company-expenses (expenses).
 * No rompe auth actual.
 */
export async function getAuthUserId(request: Request): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return { userId: session.user.id, method: "session" }
  }
  const result = await checkApiKey(request)
  if (result instanceof NextResponse) return result
  return { userId: result.userId, method: "apiKey" }
}

/**
 * Comprueba si el usuario actual es admin (para rutas /api/admin/*).
 * Por defecto se usa ADMIN_EMAIL en env; si no está definido, cualquier usuario logueado es "admin" para API keys.
 */
export function isAdmin(
  session: { user?: { id?: string; email?: string | null } } | null
): boolean {
  const adminEmail = process.env.ADMIN_EMAIL
  if (adminEmail) {
    return session?.user?.email === adminEmail
  }
  return !!session?.user?.id
}
