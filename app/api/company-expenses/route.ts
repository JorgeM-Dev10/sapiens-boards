import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const expenses = await prisma.companyExpense.findMany({
      where: {
        createdById: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

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
