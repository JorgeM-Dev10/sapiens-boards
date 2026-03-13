import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/stats
 * Estadísticas agregadas del usuario (clientes, workers, bitácoras, gastos, roadmaps, tareas).
 * Acepta sesión o x-api-key.
 */
export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const [
      clients,
      workers,
      bitacoras,
      expenses,
      boards,
      solutions,
      tasksCountResult,
      clientTotals,
    ] = await Promise.all([
      prisma.client.findMany({
        where: { userId },
        select: { id: true, totalAmount: true, paidAmount: true, phase: true },
      }),
      prisma.worker.findMany({
        where: { userId },
        select: { id: true, salary: true },
      }),
      prisma.bitacoraBoard.findMany({
        where: { userId },
        include: {
          avatar: true,
          workSessions: {
            select: { durationMinutes: true, tasksCompleted: true },
          },
        },
      }),
      prisma.companyExpense.findMany({
        where: { createdById: userId },
        select: { amount: true },
      }),
      prisma.board.findMany({
        where: { ownerId: userId },
        select: { id: true },
        include: {
          lists: {
            select: { id: true },
            include: {
              tasks: { select: { id: true } },
            },
          },
        },
      }),
      prisma.aISolution.findMany({
        where: { userId },
        select: { id: true, type: true },
      }),
      prisma.task.count({
        where: {
          list: { board: { ownerId: userId } },
        },
      }),
      prisma.client.aggregate({
        where: { userId },
        _sum: { totalAmount: true, paidAmount: true },
        _count: true,
      }),
    ])

    const totalClients = clients.length
    const totalRevenue = clientTotals._sum.totalAmount ?? 0
    const totalPaid = clientTotals._sum.paidAmount ?? 0
    const pendingRevenue = totalRevenue - totalPaid
    const completedClients = clients.filter((c) => c.phase === "COMPLETADO").length

    const totalWorkers = workers.length
    const totalSalary = workers.reduce((s, w) => s + w.salary, 0)

    const totalBitacoras = bitacoras.length
    const bitacoraStats = bitacoras.reduce(
      (acc, b) => {
        acc.totalHours += b.workSessions.reduce((h, ws) => h + ws.durationMinutes / 60, 0)
        acc.totalTasks += b.workSessions.reduce((t, ws) => t + ws.tasksCompleted, 0)
        acc.totalSessions += b.workSessions.length
        return acc
      },
      { totalHours: 0, totalTasks: 0, totalSessions: 0 }
    )

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const totalBoards = boards.length
    const totalLists = boards.reduce((n, b) => n + b.lists.length, 0)
    const totalSolutions = solutions.length

    const data = {
      clients: {
        total: totalClients,
        completed: completedClients,
        totalRevenue,
        totalPaid,
        pendingRevenue,
      },
      workers: {
        total: totalWorkers,
        totalSalary,
      },
      bitacoras: {
        total: totalBitacoras,
        ...bitacoraStats,
      },
      expenses: {
        total: totalExpenses,
        count: expenses.length,
      },
      roadmaps: {
        total: totalBoards,
        lists: totalLists,
        tasks: tasksCountResult,
      },
      solutions: {
        total: totalSolutions,
        individual: solutions.filter((s) => s.type === "INDIVIDUAL").length,
        bundles: solutions.filter((s) => s.type === "BUNDLE").length,
      },
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json(
      { success: false, error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
