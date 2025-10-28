import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
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
    const { title, description, type, amount } = body

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el cliente pertenece al usuario
    const client = await prisma.client.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }

    const timeline = await prisma.clientTimeline.create({
      data: {
        title,
        description,
        type: type || "UPDATE",
        amount: amount ? parseFloat(amount) : null,
        clientId: id,
      },
    })

    // Si es un pago, actualizar el monto pagado del cliente
    if (type === "PAYMENT" && amount) {
      await prisma.client.update({
        where: { id },
        data: {
          paidAmount: {
            increment: parseFloat(amount),
          },
        },
      })
    }

    return NextResponse.json(timeline)
  } catch (error) {
    console.error("Error creating timeline:", error)
    return NextResponse.json(
      { error: "Error al crear el timeline" },
      { status: 500 }
    )
  }
}

