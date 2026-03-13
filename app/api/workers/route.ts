import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const workers = await prisma.worker.findMany({
      where: {
        userId,
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

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
        userId,
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








