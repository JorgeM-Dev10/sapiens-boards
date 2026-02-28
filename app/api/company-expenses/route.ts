import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const expenses = await prisma.companyExpense.findMany({
      where: {
        createdById: session.user.id,
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
        createdById: session.user.id,
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
