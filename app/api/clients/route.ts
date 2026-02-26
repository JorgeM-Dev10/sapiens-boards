import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const clients = await prisma.client.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        timelines: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const withComputed = clients.map((c) => ({
      ...c,
      pendingAmount: c.totalAmount - c.paidAmount,
      paymentStatus: c.totalAmount - c.paidAmount > 0 ? "Pending" : "Paid",
    }))
    return NextResponse.json(withComputed)
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Error al obtener los clientes" },
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
    const { name, description, icon, phase, totalAmount, paidAmount, logoUrl } = body

    if (!name || totalAmount === undefined) {
      return NextResponse.json(
        { error: "El nombre y monto total son requeridos" },
        { status: 400 }
      )
    }

    const client = await prisma.client.create({
      data: {
        name,
        description,
        icon,
        logoUrl: logoUrl || null,
        phase: phase || "PLANIFICACIÓN",
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount) || 0,
        userId: session.user.id,
      },
      include: {
        timelines: true,
      },
    })

    const pendingAmount = client.totalAmount - client.paidAmount
    const paymentStatus = pendingAmount > 0 ? "Pending" : "Paid"
    return NextResponse.json({ ...client, pendingAmount, paymentStatus })
  } catch (error) {
    console.error("Error creating client:", error)
    return NextResponse.json(
      { error: "Error al crear el cliente" },
      { status: 500 }
    )
  }
}








