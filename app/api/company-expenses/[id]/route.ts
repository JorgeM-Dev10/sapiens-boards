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
    const expense = await prisma.companyExpense.findFirst({
      where: { id, createdById: userId },
    })
    if (!expense) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error fetching expense:", error)
    return NextResponse.json(
      { error: "Error al obtener el gasto" },
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
    const { amount, category, description } = body

    const updateData: { amount?: number; category?: string; description?: string | null } = {}
    if (amount !== undefined && amount !== null) updateData.amount = parseFloat(amount)
    if (category !== undefined) updateData.category = category.trim()
    if (description !== undefined) updateData.description = description?.trim() || null

    const expense = await prisma.companyExpense.updateMany({
      where: {
        id,
        createdById: userId,
      },
      data: updateData,
    })

    if (expense.count === 0) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    const updated = await prisma.companyExpense.findUnique({
      where: { id },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating company expense:", error)
    return NextResponse.json(
      { error: "Error al actualizar el gasto" },
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

    const result = await prisma.companyExpense.deleteMany({
      where: {
        id,
        createdById: userId,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Gasto no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting company expense:", error)
    return NextResponse.json(
      { error: "Error al eliminar el gasto" },
      { status: 500 }
    )
  }
}
