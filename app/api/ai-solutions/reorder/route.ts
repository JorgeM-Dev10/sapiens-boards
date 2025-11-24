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
    const { solutionIds, type } = body // Array de IDs en el nuevo orden

    if (!Array.isArray(solutionIds)) {
      return NextResponse.json(
        { error: "solutionIds debe ser un array" },
        { status: 400 }
      )
    }

    // Actualizar el orden de cada solución
    const updatePromises = solutionIds.map((solutionId: string, index: number) =>
      prisma.aISolution.updateMany({
        where: {
          id: solutionId,
          userId: session.user.id,
          ...(type && { type }),
        },
        data: {
          order: index,
        },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reordering AI solutions:", error)
    return NextResponse.json(
      { error: "Error al reordenar las soluciones" },
      { status: 500 }
    )
  }
}


