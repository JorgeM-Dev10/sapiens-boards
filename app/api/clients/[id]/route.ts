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

    const client = await prisma.client.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        timelines: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      )
    }
    const pendingAmount = client.totalAmount - client.paidAmount
    const paymentStatus = pendingAmount > 0 ? "Pending" : "Paid"
    return NextResponse.json({ ...client, pendingAmount, paymentStatus })
  } catch (error) {
    console.error("Error fetching client:", error)
    return NextResponse.json(
      { error: "Error al obtener el cliente" },
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
    const { name, description, icon, phase, totalAmount, paidAmount, logoUrl } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (phase !== undefined) updateData.phase = phase
    if (totalAmount !== undefined) updateData.totalAmount = parseFloat(totalAmount)
    if (paidAmount !== undefined) updateData.paidAmount = parseFloat(paidAmount)

    const client = await prisma.client.update({
      where: {
        id,
        userId,
      },
      data: updateData,
      include: {
        timelines: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })

    const pendingAmount = client.totalAmount - client.paidAmount
    const paymentStatus = pendingAmount > 0 ? "Pending" : "Paid"
    return NextResponse.json({ ...client, pendingAmount, paymentStatus })
  } catch (error) {
    console.error("Error updating client:", error)
    return NextResponse.json(
      { error: "Error al actualizar el cliente" },
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

    await prisma.client.delete({
      where: {
        id,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting client:", error)
    return NextResponse.json(
      { error: "Error al eliminar el cliente" },
      { status: 500 }
    )
  }
}








