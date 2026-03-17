import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/search?q=...
 * Búsqueda global en clients, tasks, boards, solutions, bitacoras.
 * Para IA y agentes externos.
 */
export async function GET(request: Request) {
  const start = Date.now()
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const q = new URL(request.url, "http://localhost").searchParams.get("q")?.trim()
    if (!q) {
      return NextResponse.json(
        { success: true, clients: [], tasks: [], boards: [], solutions: [], bitacoras: [] },
      )
    }
    const mode = "insensitive" as const

    const [clients, tasks, boards, solutions, bitacoras] = await Promise.all([
      prisma.client.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode } },
            { description: { contains: q, mode } },
          ],
        },
        take: 20,
        include: { timelines: { take: 3, orderBy: { createdAt: "desc" } } },
      }),
      prisma.task.findMany({
        where: {
          list: { board: { ownerId: userId } },
          OR: [
            { title: { contains: q, mode } },
            { description: { contains: q, mode } },
          ],
        },
        take: 20,
        include: {
          list: { select: { id: true, title: true, board: { select: { id: true, title: true } } } },
        },
      }),
      prisma.board.findMany({
        where: {
          ownerId: userId,
          OR: [
            { title: { contains: q, mode } },
            { description: { contains: q, mode } },
          ],
        },
        take: 20,
        include: { lists: { select: { id: true, title: true } } },
      }),
      prisma.aISolution.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q, mode } },
            { description: { contains: q, mode } },
            { category: { contains: q, mode } },
          ],
        },
        take: 20,
      }),
      prisma.bitacoraBoard.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q, mode } },
            { description: { contains: q, mode } },
          ],
        },
        take: 20,
        include: { avatar: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      clients,
      tasks,
      boards,
      solutions,
      bitacoras,
      meta: { query: q, time: Date.now() - start },
    })
  } catch (error) {
    console.error("Error in search:", error)
    return NextResponse.json(
      { success: false, error: "Error en la búsqueda" },
      { status: 500 }
    )
  }
}
