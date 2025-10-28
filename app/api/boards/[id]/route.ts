import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Buscar el tablero primero
    const board = await prisma.board.findFirst({
      where: {
        id,
        ownerId: session.user.id, // Solo tableros del usuario
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
                order: "asc",
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, image } = body

    const board = await prisma.board.update({
      where: {
        id,
        ownerId: session.user.id,
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    await prisma.board.delete({
      where: {
        id,
        ownerId: session.user.id,
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



