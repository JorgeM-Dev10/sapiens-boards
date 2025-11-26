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

    // Calcular experiencia: 1 XP por hora, 10 XP por tarea, 5 XP por sesión
    const experience = Math.floor(totalHours) + (totalTasks * 10) + (totalSessions * 5)
    
    // Calcular nivel: cada 100 XP = 1 nivel
    const level = Math.floor(experience / 100) + 1

    // Determinar rango/gremio según XP TOTAL (no nivel)
    // Rangos: Novato, Aprendiz, Experto, Maestro, Leyenda
    // Gremios dentro de cada rango: I, II, III
    let rank = "Novato" // Rango base
    let guild = "I" // Gremio base
    let avatarStyle = "basic"
    
    if (experience >= 10000) {
      rank = "Leyenda"
      if (experience >= 50000) guild = "III"
      else if (experience >= 30000) guild = "II"
      else guild = "I"
      avatarStyle = "legend"
    } else if (experience >= 5000) {
      rank = "Maestro"
      if (experience >= 8000) guild = "III"
      else if (experience >= 6500) guild = "II"
      else guild = "I"
      avatarStyle = "master"
    } else if (experience >= 2000) {
      rank = "Experto"
      if (experience >= 4000) guild = "III"
      else if (experience >= 3000) guild = "II"
      else guild = "I"
      avatarStyle = "expert"
    } else if (experience >= 500) {
      rank = "Aprendiz"
      if (experience >= 1500) guild = "III"
      else if (experience >= 1000) guild = "II"
      else guild = "I"
      avatarStyle = "advanced"
    } else if (experience >= 100) {
      rank = "Novato"
      if (experience >= 300) guild = "III"
      else if (experience >= 200) guild = "II"
      else guild = "I"
      avatarStyle = "intermediate"
    } else {
      rank = "Novato"
      guild = "I"
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
          guild,
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
          guild,
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
    if (bitacoraBoardId) {
      await updateBitacoraAvatar(bitacoraBoardId, durationMinutes, tasksCompleted || 0)
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error("Error creating work session:", error)
    return NextResponse.json(
      { error: "Error al crear la sesión de trabajo" },
      { status: 500 }
    )
  }
}



