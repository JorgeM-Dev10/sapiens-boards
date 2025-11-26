import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Función auxiliar para calcular minutos entre dos horas
function calculateMinutes(startTime: string, endTime: string): number {
  const [startHours, startMins] = startTime.split(":").map(Number)
  const [endHours, endMins] = endTime.split(":").map(Number)
  
  const startTotal = startHours * 60 + startMins
  const endTotal = endHours * 60 + endMins
  
  // Si endTime es menor que startTime, asumimos que es del día siguiente
  if (endTotal < startTotal) {
    return (24 * 60 - startTotal) + endTotal
  }
  
  return endTotal - startTotal
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const boardId = searchParams.get("boardId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const workType = searchParams.get("workType")

    const where: any = {
      // Solo mostrar sesiones del usuario o de su equipo (si tiene permisos)
      userId: userId || session.user.id,
    }

    if (boardId) {
      where.boardId = boardId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (workType) {
      where.workType = workType
    }

    const sessions = await prisma.workSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        list: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching work sessions:", error)
    return NextResponse.json(
      { error: "Error al obtener las sesiones de trabajo" },
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
      boardId,
      listId,
      date,
      startTime,
      endTime,
      tasksCompleted,
      description,
      workType,
    } = body

    if (!boardId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "boardId, date, startTime y endTime son requeridos" },
        { status: 400 }
      )
    }

    // Calcular duración
    const durationMinutes = calculateMinutes(startTime, endTime)

    if (durationMinutes <= 0) {
      return NextResponse.json(
        { error: "La hora de fin debe ser mayor que la hora de inicio" },
        { status: 400 }
      )
    }

    const sessionData = await prisma.workSession.create({
      data: {
        userId: session.user.id,
        boardId,
        listId: listId || null,
        date: new Date(date),
        startTime,
        endTime,
        durationMinutes,
        tasksCompleted: tasksCompleted || 0,
        description: description || null,
        workType: workType || "dev",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        list: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error("Error creating work session:", error)
    return NextResponse.json(
      { error: "Error al crear la sesión de trabajo" },
      { status: 500 }
    )
  }
}



