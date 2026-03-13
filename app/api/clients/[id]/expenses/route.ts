import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/clients/:id/expenses
 * Gastos de empresa del mismo usuario que el cliente (relación por cuenta).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id: clientId } = await params
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    })
    if (!client) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const expenses = await prisma.companyExpense.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: expenses,
      meta: { resource: "expenses", count: expenses.length },
    })
  } catch (error) {
    console.error("Error fetching client expenses:", error)
    return NextResponse.json(
      { error: "Error al obtener los gastos" },
      { status: 500 }
    )
  }
}
