import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await request.json()
    const { boardIds } = body

    if (!Array.isArray(boardIds)) {
      return NextResponse.json(
        { error: "boardIds debe ser un array" },
        { status: 400 }
      )
    }

    // Actualizar el orden de cada board
    const updatePromises = boardIds.map((boardId: string, index: number) =>
      prisma.board.updateMany({
        where: {
          id: boardId,
          ownerId: userId, // Solo actualizar boards del usuario
        },
        data: {
          order: index,
        },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering boards:", error)
    return NextResponse.json(
      { error: "Error al reordenar los tableros" },
      { status: 500 }
    )
  }
}

