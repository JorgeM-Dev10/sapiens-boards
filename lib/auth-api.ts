import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import {
  getApiKeyFromRequest,
  findAndValidateApiKey,
} from "@/lib/api-key"
import { logApiRequest } from "@/lib/api-log"

export type AuthResult =
  | { userId: string; method: "session" }
  | { userId: string; method: "apiKey"; keyPrefix: string }
  | NextResponse

/**
 * Middleware checkApiKey: lee header x-api-key, busca en api_keys.
 * - No existe key en request → 401
 * - Key no existe en DB → 401
 * - Key existe pero isActive = false → 403
 * - Key existe y activa → permite request (devuelve userId y keyPrefix para logs).
 */
export async function checkApiKey(
  request: Request
): Promise<{ userId: string; keyPrefix: string } | NextResponse> {
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
    return { userId: apiKey.createdById, keyPrefix: apiKey.keyPrefix }
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
 * Si la petición es con API Key, registra en api_logs (endpoint, method).
 */
export async function getAuthUserId(request: Request): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return { userId: session.user.id, method: "session" }
  }
  const result = await checkApiKey(request)
  if (result instanceof NextResponse) return result
  try {
    const pathname = new URL(request.url, "http://localhost").pathname
    const segments = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean)
    const resource = segments[0] ?? undefined
    const action = request.method === "GET" ? "read" : request.method === "POST" ? "create" : request.method === "PATCH" || request.method === "PUT" ? "update" : request.method === "DELETE" ? "delete" : request.method.toLowerCase()
    await logApiRequest({
      apiKeyPrefix: result.keyPrefix,
      endpoint: pathname,
      method: request.method,
      resource: resource || undefined,
      action,
      body: null,
    })
  } catch (_) {}
  return { userId: result.userId, method: "apiKey", keyPrefix: result.keyPrefix }
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
