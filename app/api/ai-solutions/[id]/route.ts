import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
      name,
      description,
      category,
      type,
      price,
      features,
      icon,
      isActive,
      solutionIds,
    } = body

    const solution = await prisma.aISolution.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(type && { type }),
        ...(price !== undefined && { price }),
        ...(features !== undefined && { features }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    })

    // Si es un bundle y se proporcionan solutionIds, actualizar
    if (type === "BUNDLE" && solutionIds) {
      // Eliminar items existentes
      await prisma.bundleItem.deleteMany({
        where: {
          bundleId: id,
        },
      })

      // Agregar nuevos items
      if (solutionIds.length > 0) {
        await prisma.bundleItem.createMany({
          data: solutionIds.map((solutionId: string) => ({
            id: `${id}_${solutionId}`,
            bundleId: id,
            solutionId,
          })),
        })
      }
    }

    return NextResponse.json(solution)
  } catch (error) {
    console.error("Error updating AI solution:", error)
    return NextResponse.json(
      { error: "Error al actualizar la solución" },
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

    await prisma.aISolution.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting AI solution:", error)
    return NextResponse.json(
      { error: "Error al eliminar la solución" },
      { status: 500 }
    )
  }
}

