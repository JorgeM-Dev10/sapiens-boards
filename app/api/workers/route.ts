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

    const workers = await prisma.worker.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(workers)
  } catch (error) {
    console.error("Error fetching workers:", error)
    return NextResponse.json(
      { error: "Error al obtener los empleados" },
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

    if (!name || !type || !responsibilities || !status) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    const worker = await prisma.worker.create({
      data: {
        name,
        type,
        responsibilities,
        status,
        salary: salary || 0,
        paymentType: paymentType || "FIXED",
        percentage,
        startDate: startDate ? new Date(startDate) : new Date(),
        paymentDate,
        userId: session.user.id,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(worker)
  } catch (error) {
    console.error("Error creating worker:", error)
    return NextResponse.json(
      { error: "Error al crear el empleado" },
      { status: 500 }
    )
  }
}

