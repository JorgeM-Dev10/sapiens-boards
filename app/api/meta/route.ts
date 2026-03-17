import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"

export const dynamic = "force-dynamic"

const API_VERSION = "1.0"

const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "list",
  "search",
  "stats",
  "summary",
]

const RESOURCES = [
  "clients",
  "workers",
  "bitacoras",
  "stats",
  "solutions",
  "expenses",
  "roadmaps",
  "boards",
  "tasks",
  "api-keys",
  "search",
  "summary",
  "meta",
  "alfred",
  "health",
  "recent",
  "activity",
  "batch",
]

const ENDPOINTS = [
  "GET /api/clients",
  "GET /api/clients/:id",
  "POST /api/clients",
  "PATCH /api/clients/:id",
  "DELETE /api/clients/:id",
  "GET /api/workers",
  "GET /api/workers/:id",
  "POST /api/workers",
  "PATCH /api/workers/:id",
  "DELETE /api/workers/:id",
  "GET /api/bitacoras",
  "GET /api/bitacoras/:id",
  "POST /api/bitacoras",
  "PATCH /api/bitacoras/:id",
  "DELETE /api/bitacoras/:id",
  "GET /api/stats",
  "GET /api/ai-solutions",
  "GET /api/ai-solutions/:id",
  "POST /api/ai-solutions",
  "PATCH /api/ai-solutions/:id",
  "DELETE /api/ai-solutions/:id",
  "GET /api/expenses",
  "GET /api/expenses/:id",
  "POST /api/expenses",
  "PATCH /api/expenses/:id",
  "DELETE /api/expenses/:id",
  "GET /api/boards",
  "GET /api/boards/:id",
  "POST /api/boards",
  "PATCH /api/boards/:id",
  "DELETE /api/boards/:id",
  "GET /api/roadmaps",
  "GET /api/roadmaps/:id",
  "POST /api/roadmaps",
  "GET /api/tasks",
  "GET /api/tasks/:id",
  "POST /api/tasks",
  "PATCH /api/tasks/:id",
  "DELETE /api/tasks/:id",
  "GET /api/search?q=",
  "GET /api/summary",
  "GET /api/meta",
  "GET /api/health",
  "GET /api/recent",
  "GET /api/activity",
  "POST /api/alfred",
  "POST /api/batch",
]

/**
 * GET /api/meta
 * Recursos disponibles, endpoints y versión de API. Para IA.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth

    return NextResponse.json({
      success: true,
      data: {
        version: API_VERSION,
        resources: RESOURCES,
        endpoints: ENDPOINTS,
        actions: ACTIONS,
        queryParams: {
          list: "limit, offset, page, sort, order",
          filters: "Resource-specific (e.g. name=, boardId=, month=)",
        },
      },
      meta: {
        resource: "meta",
        count: RESOURCES.length,
        time: 0,
      },
    })
  } catch (error) {
    console.error("Error in meta:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener meta" },
      { status: 500 }
    )
  }
}
