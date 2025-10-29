import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const {
      name,
      type,
      responsibilities,
      status,
      salary,
      paymentType,
      percentage,
      startDate,
      paymentDate,
    } = body

    const worker = await prisma.worker.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(responsibilities && { responsibilities }),
        ...(status && { status }),
        ...(salary !== undefined && { salary }),
        ...(paymentType && { paymentType }),
        ...(percentage !== undefined && { percentage }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(paymentDate !== undefined && { paymentDate }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(worker)
  } catch (error) {
    console.error("Error updating worker:", error)
    return NextResponse.json(
      { error: "Error al actualizar el empleado" },
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

    await prisma.worker.delete({
      where: {
        id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting worker:", error)
    return NextResponse.json(
      { error: "Error al eliminar el empleado" },
      { status: 500 }
    )
  }
}



