import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"
import { parsePaginationParams, wantsPagination, paginatedResponse } from "@/lib/api-pagination"

export async function GET(request: Request) {
  const start = Date.now()
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const url = request.url
    const u = new URL(url, "http://localhost")
    const month = u.searchParams.get("month")?.trim() // YYYY-MM
    const usePagination = wantsPagination(url)
    const params = usePagination ? parsePaginationParams(url) : null

    const where: { createdById: string; createdAt?: { gte: Date; lt: Date } } = { createdById: userId }
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number)
      where.createdAt = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      }
    }

    const [expenses, total] = await Promise.all([
      prisma.companyExpense.findMany({
        where,
        orderBy: params?.orderBy ?? { createdAt: "desc" },
        ...(usePagination && params ? { skip: params.skip, take: params.take } : {}),
      }),
      usePagination ? prisma.companyExpense.count({ where }) : Promise.resolve(0),
    ])

    if (usePagination && params) {
      return NextResponse.json(
        paginatedResponse(expenses, total, { ...params, limit: params.limit!, skip: params.skip, take: params.take }, "expenses", start)
      )
    }
    return NextResponse.json(expenses)
  } catch (error) {
    console.error("Error fetching company expenses:", error)
    return NextResponse.json(
      { error: "Error al obtener los gastos" },
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
    const { amount, category, description } = body

    if (amount === undefined || amount === null || !category?.trim()) {
      return NextResponse.json(
        { error: "Monto y categoría son requeridos" },
        { status: 400 }
      )
    }

    const expense = await prisma.companyExpense.create({
      data: {
        amount: parseFloat(amount),
        category: category.trim(),
        description: description?.trim() || null,
        createdById: userId,
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating company expense:", error)
    return NextResponse.json(
      { error: "Error al registrar el gasto" },
      { status: 500 }
    )
  }
}
