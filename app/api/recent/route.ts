import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const PER_TYPE = 10

/**
 * GET /api/recent
 * Últimos registros de clients, tasks, expenses, bitacoras, boards. Para dashboards e IA.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const [clients, tasks, expenses, bitacoras, boards] = await Promise.all([
      prisma.client.findMany({
        where: { userId },
        take: PER_TYPE,
        orderBy: { createdAt: "desc" },
        include: { timelines: { take: 2, orderBy: { createdAt: "desc" } } },
      }),
      prisma.task.findMany({
        where: { list: { board: { ownerId: userId } } },
        take: PER_TYPE,
        orderBy: { createdAt: "desc" },
        include: { list: { select: { id: true, title: true, board: { select: { id: true, title: true } } } } },
      }),
      prisma.companyExpense.findMany({
        where: { createdById: userId },
        take: PER_TYPE,
        orderBy: { createdAt: "desc" },
      }),
      prisma.bitacoraBoard.findMany({
        where: { userId },
        take: PER_TYPE,
        orderBy: { createdAt: "desc" },
        include: { avatar: true },
      }),
      prisma.board.findMany({
        where: { ownerId: userId },
        take: PER_TYPE,
        orderBy: { createdAt: "desc" },
        include: { lists: { select: { id: true, title: true } } },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        clients,
        tasks,
        expenses,
        bitacoras,
        boards,
      },
    })
  } catch (error) {
    console.error("Error fetching recent:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener registros recientes" },
      { status: 500 }
    )
  }
}
