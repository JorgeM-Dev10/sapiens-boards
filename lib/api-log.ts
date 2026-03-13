import { prisma } from "./prisma"

const MAX_BODY_SIZE = 2000

function truncateBody(body: unknown): object | undefined {
  if (body == null) return undefined
  if (typeof body !== "object") return { _: String(body).slice(0, MAX_BODY_SIZE) }
  try {
    const str = JSON.stringify(body)
    if (str.length <= MAX_BODY_SIZE) return body as object
    return { _truncated: str.slice(0, MAX_BODY_SIZE) + "..." }
  } catch {
    return undefined
  }
}

/**
 * Registra en api_logs una petición hecha con API Key.
 * body se trunca si es muy grande.
 */
export async function logApiRequest(params: {
  apiKeyPrefix: string | null
  endpoint: string
  method: string
  resource?: string | null
  action?: string | null
  statusCode?: number | null
  body?: unknown
}): Promise<void> {
  try {
    await prisma.apiLog.create({
      data: {
        apiKey: params.apiKeyPrefix ?? undefined,
        endpoint: params.endpoint,
        method: params.method,
        resource: params.resource ?? undefined,
        action: params.action ?? undefined,
        statusCode: params.statusCode ?? undefined,
        body: params.body ? truncateBody(params.body) : undefined,
      },
    })
  } catch (e) {
    console.error("[ApiLog]", e)
  }
}
