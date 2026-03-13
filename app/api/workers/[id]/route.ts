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

    const worker = await prisma.worker.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!worker) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    return NextResponse.json(worker)
  } catch (error) {
    console.error("Error fetching worker:", error)
    return NextResponse.json(
      { error: "Error al obtener el empleado" },
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
        userId,
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params

    await prisma.worker.delete({
      where: {
        id,
        userId,
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





