import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Función para actualizar el avatar de la bitácora
async function updateBitacoraAvatar(bitacoraBoardId: string, durationMinutes: number, tasksCompleted: number) {
  try {
    const bitacora = await prisma.bitacoraBoard.findUnique({
      where: { id: bitacoraBoardId },
      include: { avatar: true, workSessions: true },
    })

    if (!bitacora) return

    const totalHours = bitacora.workSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
    const totalTasks = bitacora.workSessions.reduce((sum, s) => sum + s.tasksCompleted, 0)
    const totalSessions = bitacora.workSessions.length

    // Sistema de Experiencia (XP):
    // - 1 XP por cada hora trabajada (redondeado hacia abajo)
    // - 10 XP por cada tarea completada
    // - 5 XP por cada sesión/commit registrado
    const experience = Math.floor(totalHours) + (totalTasks * 10) + (totalSessions * 5)
    
    // Calcular nivel: cada 100 XP = 1 nivel
    const level = Math.floor(experience / 100) + 1

    // Determinar nivel según XP TOTAL
    // Niveles: Principiante, Intermedio, Avanzado, Épico, Leyenda
    let rank = "Principiante"
    let avatarStyle = "basic"
    
    if (experience >= 10000) {
      rank = "Leyenda"
      avatarStyle = "legend"
    } else if (experience >= 5000) {
      rank = "Épico"
      avatarStyle = "epic"
    } else if (experience >= 2000) {
      rank = "Avanzado"
      avatarStyle = "advanced"
    } else if (experience >= 500) {
      rank = "Intermedio"
      avatarStyle = "intermediate"
    } else {
      rank = "Principiante"
      avatarStyle = "basic"
    }

    if (bitacora.avatar) {
      await prisma.bitacoraAvatar.update({
        where: { id: bitacora.avatar.id },
        data: {
          level,
          experience,
          totalHours,
          totalTasks,
          totalSessions,
          avatarStyle,
          rank,
        },
      })
    } else {
      await prisma.bitacoraAvatar.create({
        data: {
          bitacoraBoardId,
          level,
          experience,
          totalHours,
          totalTasks,
          totalSessions,
          avatarStyle,
          rank,
        },
      })
    }
  } catch (error) {
    console.error("Error updating bitacora avatar:", error)
  }
}

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
    const bitacoraBoardId = searchParams.get("bitacoraBoardId")
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

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
        userId: session.user.id,
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

    // Actualizar avatar si es una sesión de bitácora
    let xpGained = 0
    let previousXP = 0
    let previousLevel = 1
    let previousRank = "Principiante"
    let newLevel = 1
    let newRank = "Principiante"
    
    if (bitacoraBoardId) {
      // Obtener estado anterior
      const bitacoraBefore = await prisma.bitacoraBoard.findUnique({
        where: { id: bitacoraBoardId },
        include: { avatar: true, workSessions: true },
      })
      
      if (bitacoraBefore?.avatar) {
        previousXP = bitacoraBefore.avatar.experience
        previousLevel = bitacoraBefore.avatar.level
        previousRank = bitacoraBefore.avatar.rank || "Principiante"
      }
      
      // Calcular XP ganada en este commit
      // Sistema de XP: 1 XP por hora, 10 XP por tarea, 5 XP por sesión
      const hoursGained = durationMinutes / 60
      const tasksGained = tasksCompleted || 0
      xpGained = Math.floor(hoursGained) + (tasksGained * 10) + 5
      
      await updateBitacoraAvatar(bitacoraBoardId, durationMinutes, tasksCompleted || 0)
      
      // Obtener estado nuevo
      const bitacoraAfter = await prisma.bitacoraBoard.findUnique({
        where: { id: bitacoraBoardId },
        include: { avatar: true },
      })
      
      if (bitacoraAfter?.avatar) {
        newLevel = bitacoraAfter.avatar.level
        newRank = bitacoraAfter.avatar.rank || "Principiante"
      }
    }

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



