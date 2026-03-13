import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

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
          userId,
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


