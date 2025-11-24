import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Generar número de pedido único
function generateOrderNumber(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORD-${timestamp}-${random}`
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = {
      userId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            solution: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                categoryColor: true,
                type: true,
                price: true,
                icon: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    return NextResponse.json(
      { error: "Error al obtener los pedidos" },
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
    const { items, notes, status } = body

    // Validar que hay items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Se requiere al menos un item en el pedido" },
        { status: 400 }
      )
    }

    // Validar cada item
    for (const item of items) {
      if (!item.solutionId) {
        return NextResponse.json(
          { error: "Cada item debe tener un solutionId" },
          { status: 400 }
        )
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json(
          { error: "Cada item debe tener una cantidad válida (>= 1)" },
          { status: 400 }
        )
      }
    }

    // Obtener las soluciones y calcular el total
    let totalAmount = 0
    const orderItemsData = []

    for (const item of items) {
      const solution = await prisma.aISolution.findUnique({
        where: { id: item.solutionId },
        select: { id: true, name: true, price: true, userId: true },
      })

      if (!solution) {
        return NextResponse.json(
          { error: `Solución con id ${item.solutionId} no encontrada` },
          { status: 404 }
        )
      }

      // Verificar que la solución pertenece al usuario o está disponible
      if (solution.userId !== session.user.id) {
        return NextResponse.json(
          { error: `No tienes acceso a la solución ${solution.name}` },
          { status: 403 }
        )
      }

      if (!solution.price || solution.price <= 0) {
        return NextResponse.json(
          { error: `La solución ${solution.name} no tiene un precio válido` },
          { status: 400 }
        )
      }

      const unitPrice = solution.price
      const quantity = item.quantity
      const totalPrice = unitPrice * quantity

      totalAmount += totalPrice

      orderItemsData.push({
        solutionId: solution.id,
        quantity,
        unitPrice,
        totalPrice,
      })
    }

    // Crear el pedido con sus items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: status || "PENDING",
        totalAmount,
        notes: notes || null,
        userId: session.user.id,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            solution: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                categoryColor: true,
                type: true,
                price: true,
                icon: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error("Error creating order:", error)
    return NextResponse.json(
      { error: "Error al crear el pedido: " + error.message },
      { status: 500 }
    )
  }
}

