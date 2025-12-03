import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "VIDEO", "PDF", "LINK", "DOCUMENT"
    const category = searchParams.get("category")

    const where: any = {
      userId: session.user.id,
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    const libraryItems = await prisma.library.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(libraryItems)
  } catch (error) {
    console.error("Error fetching library items:", error)
    return NextResponse.json(
      { error: "Error al obtener los recursos de la librería" },
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
    const {
      title,
      description,
      url,
      type,
      category,
      thumbnail,
    } = body

    if (!title || !url || !type) {
      return NextResponse.json(
        { error: "Título, URL y tipo son requeridos" },
        { status: 400 }
      )
    }

    const libraryItem = await prisma.library.create({
      data: {
        title,
        description: description || null,
        url,
        type,
        category: category || null,
        thumbnail: thumbnail || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(libraryItem)
  } catch (error) {
    console.error("Error creating library item:", error)
    return NextResponse.json(
      { error: "Error al crear el recurso" },
      { status: 500 }
    )
  }
}





