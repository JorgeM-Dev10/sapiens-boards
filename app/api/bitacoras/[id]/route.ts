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

    const bitacora = await prisma.bitacoraBoard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        avatar: true,
        workSessions: {
          orderBy: {
            date: "desc",
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!bitacora) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(bitacora)
  } catch (error) {
    console.error("Error fetching bitacora:", error)
    return NextResponse.json(
      { error: "Error al obtener la bitácora" },
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
    const { title, description, image, order } = body

    // Verificar que la bitácora pertenece al usuario
    const existing = await prisma.bitacoraBoard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      )
    }

    const updated = await prisma.bitacoraBoard.update({
      where: {
        id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(order !== undefined && { order }),
        updatedAt: new Date(),
      },
      include: {
        avatar: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating bitacora:", error)
    return NextResponse.json(
      { error: "Error al actualizar la bitácora" },
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

    // Verificar que la bitácora pertenece al usuario
    const existing = await prisma.bitacoraBoard.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      )
    }

    await prisma.bitacoraBoard.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bitacora:", error)
    return NextResponse.json(
      { error: "Error al eliminar la bitácora" },
      { status: 500 }
    )
  }
}

