/**
 * Helpers para paginación y orden en GET listados.
 * Query params: limit, offset, page, sort, order.
 * Si no se envían, se devuelve todo (comportamiento actual).
 */

export type PaginationParams = {
  limit?: number
  offset?: number
  page?: number
  sort?: string
  order?: "asc" | "desc"
}

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

/**
 * Parsea query string y devuelve limit, offset (calculado si viene page), sort, order.
 * order por defecto desc si no se especifica.
 */
export function parsePaginationParams(url: string): PaginationParams & { skip: number; take: number; orderBy: Record<string, string> | undefined } {
  const u = new URL(url, "http://localhost")
  const limit = Math.min(
    Math.max(1, parseInt(u.searchParams.get("limit") || "0", 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  )
  const page = Math.max(1, parseInt(u.searchParams.get("page") || "0", 10) || 0)
  const offset = parseInt(u.searchParams.get("offset") || "0", 10) || 0
  const sort = u.searchParams.get("sort")?.trim() || undefined
  const orderParam = (u.searchParams.get("order") || "desc").toLowerCase()
  const order: "asc" | "desc" = orderParam === "asc" ? "asc" : "desc"

  const skip = page > 0 ? (page - 1) * limit : offset
  const take = limit
  const orderBy = sort ? { [sort]: order } : undefined

  return {
    limit: take,
    offset: skip,
    page: page || undefined,
    sort,
    order,
    skip,
    take,
    orderBy,
  }
}

/**
 * Indica si en la URL se pidió formato paginado (limit o page).
 */
export function wantsPagination(url: string): boolean {
  const u = new URL(url, "http://localhost")
  return u.searchParams.has("limit") || u.searchParams.has("page") || u.searchParams.has("offset")
}

/**
 * Respuesta estándar paginada con meta.
 */
export function paginatedResponse<T>(data: T[], total: number, params: PaginationParams & { skip: number; take: number }, resource: string, startTime: number) {
  const page = params.page ?? (params.offset !== undefined ? Math.floor(params.offset / params.limit!) + 1 : 1)
  return {
    success: true as const,
    data,
    total,
    page,
    limit: params.limit ?? data.length,
    meta: {
      resource,
      count: data.length,
      total,
      time: Date.now() - startTime,
    },
  }
}
