import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
          ownerId: session.user.id, // Solo actualizar boards del usuario
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

