import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"
import { recomputeBitacoraAvatar } from "@/lib/gamification"

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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get("boardId")
    const bitacoraBoardId = searchParams.get("bitacoraBoardId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const workType = searchParams.get("workType")

    const where: any = {
      userId,
    }

    if (boardId) {
      where.boardId = boardId
    }

    if (bitacoraBoardId) {
      where.bitacoraBoardId = bitacoraBoardId
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
        bitacoraBoard: {
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await request.json()
    const {
      boardId,
      bitacoraBoardId,
      listId,
      date,
      startTime,
      endTime,
      tasksCompleted,
      description,
      workType,
    } = body

    if ((!boardId && !bitacoraBoardId) || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "boardId o bitacoraBoardId, date, startTime y endTime son requeridos" },
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
        userId,
        boardId: boardId || null,
        bitacoraBoardId: bitacoraBoardId || null,
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
        bitacoraBoard: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Actualizar métricas (horas, sesiones) - NO genera XP. XP solo por impacto (BitacoraEntry).
    let previousXP = 0
    let previousLevel = 1
    let previousRank = "INITIUM"
    let newLevel = 1
    let newRank = "INITIUM"

    if (bitacoraBoardId) {
      const bitacoraBefore = await prisma.bitacoraBoard.findUnique({
        where: { id: bitacoraBoardId },
        include: { avatar: true },
      })
      if (bitacoraBefore?.avatar) {
        previousXP = bitacoraBefore.avatar.experience
        previousLevel = bitacoraBefore.avatar.level
        previousRank = bitacoraBefore.avatar.rank || "INITIUM"
      }

      await recomputeBitacoraAvatar(bitacoraBoardId)

      const bitacoraAfter = await prisma.bitacoraBoard.findUnique({
        where: { id: bitacoraBoardId },
        include: { avatar: true },
      })
      if (bitacoraAfter?.avatar) {
        newLevel = bitacoraAfter.avatar.level
        newRank = bitacoraAfter.avatar.rank || "INITIUM"
      }
    }

    // XP ganado = 0 (sesiones manuales no dan XP; XP viene de tareas completadas con evaluación IA)
    const xpGained = 0

    return NextResponse.json({
      ...sessionData,
      xpGained,
      previousXP,
      previousLevel,
      previousRank,
      newLevel,
      newRank,
    })
  } catch (error) {
    console.error("Error creating work session:", error)
    return NextResponse.json(
      { error: "Error al crear la sesión de trabajo" },
      { status: 500 }
    )
  }
}



