import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"
import { parsePaginationParams, wantsPagination, paginatedResponse } from "@/lib/api-pagination"

/**
 * GET /api/boards/:id/tasks
 * Todas las tareas del tablero (roadmap). Relación para IA.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const start = Date.now()
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id: boardId } = await params
    const board = await prisma.board.findFirst({
      where: { id: boardId, ownerId: userId },
      include: { lists: { select: { id: true } } },
    })
    if (!board) {
      return NextResponse.json({ error: "Tablero no encontrado" }, { status: 404 })
    }

    const listIds = board.lists.map((l) => l.id)
    const url = request.url
    const usePagination = wantsPagination(url)
    const paramsPag = usePagination ? parsePaginationParams(url) : null

    const where = { listId: { in: listIds } }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assigned: true,
          list: { select: { id: true, title: true } },
          tags: { include: { tag: true } },
        },
        orderBy: paramsPag?.orderBy ?? { createdAt: "desc" },
        ...(usePagination && paramsPag ? { skip: paramsPag.skip, take: paramsPag.take } : {}),
      }),
      usePagination ? prisma.task.count({ where }) : Promise.resolve(0),
    ])

    if (usePagination && paramsPag) {
      return NextResponse.json(
        paginatedResponse(tasks, total, { ...paramsPag, limit: paramsPag.limit!, skip: paramsPag.skip, take: paramsPag.take }, "tasks", start)
      )
    }
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching board tasks:", error)
    return NextResponse.json(
      { error: "Error al obtener las tareas del tablero" },
      { status: 500 }
    )
  }
}
