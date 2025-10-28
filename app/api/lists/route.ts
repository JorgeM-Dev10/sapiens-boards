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
    const { title, boardId, order } = body

    if (!title || !boardId) {
      return NextResponse.json(
        { error: "El título y boardId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el board pertenece al usuario
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
        ownerId: session.user.id,
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: "Tablero no encontrado" },
        { status: 404 }
      )
    }

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        order: order ?? 0,
      },
    })

    return NextResponse.json(list)
  } catch (error) {
    console.error("Error creating list:", error)
    return NextResponse.json(
      { error: "Error al crear la lista" },
      { status: 500 }
    )
  }
}



