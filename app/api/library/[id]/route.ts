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

    const libraryItem = await prisma.library.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!libraryItem) {
      return NextResponse.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(libraryItem)
  } catch (error) {
    console.error("Error fetching library item:", error)
    return NextResponse.json(
      { error: "Error al obtener el recurso" },
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
    const {
      title,
      description,
      url,
      type,
      category,
      thumbnail,
    } = body

    const libraryItem = await prisma.library.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(url && { url }),
        ...(type && { type }),
        ...(category !== undefined && { category }),
        ...(thumbnail !== undefined && { thumbnail }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(libraryItem)
  } catch (error) {
    console.error("Error updating library item:", error)
    return NextResponse.json(
      { error: "Error al actualizar el recurso" },
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

    await prisma.library.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting library item:", error)
    return NextResponse.json(
      { error: "Error al eliminar el recurso" },
      { status: 500 }
    )
  }
}



