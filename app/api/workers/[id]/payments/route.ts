import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el worker pertenece al usuario
    const worker = await prisma.worker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!worker) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    const paymentLogs = await prisma.paymentLog.findMany({
      where: {
        workerId: id,
      },
      orderBy: {
        paymentDate: "desc",
      },
    })

    return NextResponse.json(paymentLogs)
  } catch (error) {
    console.error("Error fetching payment logs:", error)
    return NextResponse.json(
      { error: "Error al obtener la bitácora de pagos" },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { type, amount, previousSalary, newSalary, description, paymentDate } = body

    if (!type || amount === undefined) {
      return NextResponse.json(
        { error: "Tipo y monto son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que el worker pertenece al usuario
    const worker = await prisma.worker.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!worker) {
      return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
    }

    // Crear el registro de pago
    const paymentLog = await prisma.paymentLog.create({
      data: {
        type,
        amount,
        previousSalary,
        newSalary,
        description,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        workerId: id,
      },
    })

    // Si es un aumento de salario, actualizar el salario del worker
    if (type === "SALARY_INCREASE" && newSalary !== undefined) {
      await prisma.worker.update({
        where: { id },
        data: { salary: newSalary },
      })
    }

    return NextResponse.json(paymentLog)
  } catch (error) {
    console.error("Error creating payment log:", error)
    return NextResponse.json(
      { error: "Error al registrar el pago" },
      { status: 500 }
    )
  }
}

