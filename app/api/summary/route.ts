import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/summary
 * Resumen general en una sola llamada: clientes, workers, gastos, ingresos, tareas, boards, bitácoras, solutions.
 */
export async function GET(request: Request) {
  const start = Date.now()
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const [
      clientsAgg,
      workersAgg,
      expensesAgg,
      clientRevenue,
      tasksCount,
      boardsCount,
      bitacorasCount,
      solutionsCount,
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.worker.count({ where: { userId } }),
      prisma.companyExpense.aggregate({
        where: { createdById: userId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.client.aggregate({
        where: { userId },
        _sum: { totalAmount: true, paidAmount: true },
      }),
      prisma.task.count({
        where: { list: { board: { ownerId: userId } } },
      }),
      prisma.board.count({ where: { ownerId: userId } }),
      prisma.bitacoraBoard.count({ where: { userId } }),
      prisma.aISolution.count({ where: { userId } }),
    ])

    const totalRevenue = clientRevenue._sum.totalAmount ?? 0
    const totalPaid = clientRevenue._sum.paidAmount ?? 0

    const data = {
      clientes: clientsAgg,
      workers: workersAgg,
      gastos: {
        total: expensesAgg._sum.amount ?? 0,
        count: expensesAgg._count,
      },
      ingresos: {
        total: totalRevenue,
        cobrado: totalPaid,
        pendiente: totalRevenue - totalPaid,
      },
      tareas: tasksCount,
      boards: boardsCount,
      bitacoras: bitacorasCount,
      solutions: solutionsCount,
    }

    return NextResponse.json({
      success: true,
      data,
      meta: {
        resource: "summary",
        count: 8,
        time: Date.now() - start,
      },
    })
  } catch (error) {
    console.error("Error fetching summary:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener el resumen" },
      { status: 500 }
    )
  }
}
