import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { runOneAlfredAction } from "@/app/api/alfred/route"

/**
 * POST /api/batch
 * Ejecutar varias acciones Alfred en una sola request. Misma lógica que /api/alfred.
 * Body: { actions: [ { action, resource, id?, data?, filters? }, ... ] }
 */
export async function POST(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await request.json().catch(() => ({}))
    const { actions } = body
    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Se requiere 'actions' (array no vacío)" },
        { status: 400 }
      )
    }
    if (actions.length > 20) {
      return NextResponse.json(
        { success: false, error: "Máximo 20 acciones por request" },
        { status: 400 }
      )
    }

    const results: { success: boolean; data?: unknown; error?: string }[] = []
    for (const actionBody of actions) {
      try {
        const data = await runOneAlfredAction(userId, actionBody)
        results.push({ success: true, data })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error desconocido"
        results.push({ success: false, error: message })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Error en batch:", error)
    return NextResponse.json(
      { success: false, error: "Error en batch" },
      { status: 500 }
    )
  }
}
