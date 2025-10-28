import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const boards = await prisma.board.findMany({
      where: {
        ownerId: session.user.id,
      },
      include: {
        lists: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(boards)
  } catch (error) {
    console.error("Error fetching boards:", error)
    return NextResponse.json(
      { error: "Error al obtener los tableros" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, image } = body

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    const board = await prisma.board.create({
      data: {
        title,
        description,
        image,
        ownerId: session.user.id,
      },
    })

    return NextResponse.json(board)
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json(
      { error: "Error al crear el tablero" },
      { status: 500 }
    )
  }
}



