import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const clients = await prisma.client.findMany({
      where: {
        userId,
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

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
        userId,
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








