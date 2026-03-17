import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const LIMIT = 30

type ActivityItem = {
  type: string
  resource: string
  id: string
  createdAt: string
  title?: string
}

/**
 * GET /api/activity
 * Actividad reciente combinada (por createdAt). Simple, sin sistema complejo.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const [clients, tasks, expenses, bitacoras, boards] = await Promise.all([
      prisma.client.findMany({
        where: { userId },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, createdAt: true },
      }),
      prisma.task.findMany({
        where: { list: { board: { ownerId: userId } } },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.companyExpense.findMany({
        where: { createdById: userId },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, category: true, createdAt: true },
      }),
      prisma.bitacoraBoard.findMany({
        where: { userId },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      }),
      prisma.board.findMany({
        where: { ownerId: userId },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, createdAt: true },
      }),
    ])

    const activities: ActivityItem[] = [
      ...clients.map((c) => ({ type: "client_created", resource: "clients", id: c.id, createdAt: c.createdAt.toISOString(), title: c.name })),
      ...tasks.map((t) => ({ type: "task_created", resource: "tasks", id: t.id, createdAt: t.createdAt.toISOString(), title: t.title })),
      ...expenses.map((e) => ({ type: "expense_created", resource: "expenses", id: e.id, createdAt: e.createdAt.toISOString(), title: `${e.category}: ${e.amount}` })),
      ...bitacoras.map((b) => ({ type: "bitacora_created", resource: "bitacoras", id: b.id, createdAt: b.createdAt.toISOString(), title: b.title })),
      ...boards.map((b) => ({ type: "board_created", resource: "boards", id: b.id, createdAt: b.createdAt.toISOString(), title: b.title })),
    ]
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const recent = activities.slice(0, LIMIT)

    return NextResponse.json({
      success: true,
      data: recent,
    })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener actividad" },
      { status: 500 }
    )
  }
}
