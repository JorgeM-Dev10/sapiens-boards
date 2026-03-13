import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params

    // Buscar el tablero primero
    const board = await prisma.board.findFirst({
      where: {
        id,
        ownerId: userId, // Solo tableros del usuario
      },
      include: {
        lists: {
          include: {
            tasks: {
              include: {
                assigned: true,
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            order: "asc",
          },
        },
        owner: true,
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: "Tablero no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error fetching board:", error)
    return NextResponse.json(
      { error: "Error al obtener el tablero" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params
    const body = await request.json()
    const { title, description, image } = body

    const board = await prisma.board.update({
      where: {
        id,
        ownerId: userId,
      },
      data: {
        title,
        description,
        image,
      },
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error updating board:", error)
    return NextResponse.json(
      { error: "Error al actualizar el tablero" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params

    await prisma.board.delete({
      where: {
        id,
        ownerId: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting board:", error)
    return NextResponse.json(
      { error: "Error al eliminar el tablero" },
      { status: 500 }
    )
  }
}



