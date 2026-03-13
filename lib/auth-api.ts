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
 * Obtiene el userId permitiendo sesión O API Key.
 * No modifica la lógica actual: si hay sesión se usa; si no, se intenta x-api-key.
 * - Si no hay sesión ni API key → 401
 * - Si API key no existe → 401
 * - Si API key existe pero inactiva → 403
 */
export async function getAuthUserId(request: Request): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return { userId: session.user.id, method: "session" }
  }

  const rawKey = getApiKeyFromRequest(request)
  if (!rawKey) {
    return NextResponse.json(
      { error: "No autorizado. Inicia sesión o envía x-api-key." },
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
    return { userId: apiKey.createdById, method: "apiKey" }
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
