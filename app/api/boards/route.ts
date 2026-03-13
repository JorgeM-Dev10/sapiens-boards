import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const boards = await prisma.board.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        lists: {
          include: {
            tasks: true,
          },
        },
      },
      orderBy: {
        order: "asc",
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await request.json()
    const { title, description, image } = body

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    // Obtener el máximo order para poner el nuevo board al final
    const maxOrder = await prisma.board.findFirst({
      where: {
        ownerId: userId,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    })

    const board = await prisma.board.create({
      data: {
        title,
        description,
        image,
        order: (maxOrder?.order ?? -1) + 1,
        ownerId: userId,
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



