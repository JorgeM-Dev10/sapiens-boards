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
    const type = searchParams.get("type") // "INDIVIDUAL" o "BUNDLE"

    const where: any = {
      userId: session.user.id,
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
        createdAt: "desc",
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
      solutionIds, // Para bundles
    } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: "Nombre y categoría son requeridos" },
        { status: 400 }
      )
    }

    const solution = await prisma.aISolution.create({
      data: {
        name,
        description,
        category,
        type: type || "INDIVIDUAL",
        price,
        features,
        icon,
        isActive: isActive !== undefined ? isActive : true,
        userId: session.user.id,
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



