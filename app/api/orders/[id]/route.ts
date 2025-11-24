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

    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    // Verificar que el pedido pertenece al usuario
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para ver este pedido" },
        { status: 403 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    return NextResponse.json(
      { error: "Error al obtener el pedido" },
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
    const { status, notes } = body

    // Verificar que el pedido existe y pertenece al usuario
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    if (existingOrder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para actualizar este pedido" },
        { status: 403 }
      )
    }

    // Actualizar el pedido
    const updateData: any = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(order)
  } catch (error: any) {
    console.error("Error updating order:", error)
    return NextResponse.json(
      { error: "Error al actualizar el pedido: " + error.message },
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

    // Verificar que el pedido existe y pertenece al usuario
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      )
    }

    if (existingOrder.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No autorizado para eliminar este pedido" },
        { status: 403 }
      )
    }

    // Eliminar el pedido (los items se eliminan en cascada)
    await prisma.order.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Pedido eliminado correctamente" })
  } catch (error: any) {
    console.error("Error deleting order:", error)
    return NextResponse.json(
      { error: "Error al eliminar el pedido: " + error.message },
      { status: 500 }
    )
  }
}

