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
    const solution = await prisma.aISolution.findFirst({
      where: { id, userId },
      include: {
        bundleItems: { include: { solution: true } },
        bundles: { include: { bundle: true } },
      },
    })
    if (!solution) {
      return NextResponse.json({ error: "Solución no encontrada" }, { status: 404 })
    }
    return NextResponse.json(solution)
  } catch (error) {
    console.error("Error fetching solution:", error)
    return NextResponse.json(
      { error: "Error al obtener la solución" },
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
    const {
      name,
      description,
      category,
      categoryColor,
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
        userId,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(categoryColor !== undefined && { categoryColor }),
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params

    await prisma.aISolution.delete({
      where: {
        id,
        userId,
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







