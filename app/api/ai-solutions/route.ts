import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "INDIVIDUAL" o "BUNDLE"

    const where: any = {
      userId,
    }

    if (type) {
      where.type = type
    }

    const solutions = await prisma.aISolution.findMany({
      where,
      include: {
        bundleItems: {
          include: {
            solution: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    return NextResponse.json(solutions)
  } catch (error) {
    console.error("Error fetching AI solutions:", error)
    return NextResponse.json(
      { error: "Error al obtener las soluciones" },
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
      solutionIds, // Para bundles
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nombre y categoría son requeridos" },
        { status: 400 }
      )
    }

    // Obtener el máximo order para ponerlo al final
    const maxOrder = await prisma.aISolution.findFirst({
      where: {
        userId,
        type: type || "INDIVIDUAL",
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    })

    const solution = await prisma.aISolution.create({
      data: {
        name,
        description,
        category,
        categoryColor: categoryColor || null,
        type: type || "INDIVIDUAL",
        price,
        features,
        icon,
        order: (maxOrder?.order ?? -1) + 1,
        isActive: isActive !== undefined ? isActive : true,
        userId,
        updatedAt: new Date(),
      },
    })

    // Si es un bundle, agregar las soluciones
    if (type === "BUNDLE" && solutionIds && solutionIds.length > 0) {
      await prisma.bundleItem.createMany({
        data: solutionIds.map((solutionId: string) => ({
          id: `${solution.id}_${solutionId}`,
          bundleId: solution.id,
          solutionId,
        })),
      })
    }

    return NextResponse.json(solution)
  } catch (error) {
    console.error("Error creating AI solution:", error)
    return NextResponse.json(
      { error: "Error al crear la solución" },
      { status: 500 }
    )
  }
}







