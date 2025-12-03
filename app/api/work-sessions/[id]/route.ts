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

    // Determinar nivel según XP TOTAL
    // Niveles: Principiante, Intermedio, Avanzado, Épico, Leyenda
    let rank = "Principiante"
    let avatarStyle = "basic"
    let avatarImageUrl: string | null = null
    
    if (experience >= 10000) {
      rank = "Leyenda"
      avatarStyle = "legend"
      avatarImageUrl = "https://i.imgur.com/5WDwPXs.png"
    } else if (experience >= 5000) {
      rank = "Épico"
      avatarStyle = "epic"
      avatarImageUrl = "https://i.imgur.com/CCuILkk.png"
    } else if (experience >= 2000) {
      rank = "Avanzado"
      avatarStyle = "advanced"
      avatarImageUrl = "https://i.imgur.com/3oUQA6l.png"
    } else if (experience >= 500) {
      rank = "Intermedio"
      avatarStyle = "intermediate"
      avatarImageUrl = "https://i.imgur.com/8sfE7ue.png"
    } else {
      rank = "Principiante"
      avatarStyle = "basic"
      avatarImageUrl = "https://i.imgur.com/ZhsrnvR.png"
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
          avatarImageUrl,
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
          avatarImageUrl,
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
  
  if (endTotal < startTotal) {
    return (24 * 60 - startTotal) + endTotal
  }
  
  return endTotal - startTotal
}

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

    const workSession = await prisma.workSession.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    if (!workSession) {
      return NextResponse.json(
        { error: "Sesión de trabajo no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(workSession)
  } catch (error) {
    console.error("Error fetching work session:", error)
    return NextResponse.json(
      { error: "Error al obtener la sesión de trabajo" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Los commits no se pueden editar una vez registrados
  return NextResponse.json(
    { error: "Los commits no se pueden editar una vez registrados" },
    { status: 403 }
  )
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

    // Verificar que la sesión pertenece al usuario
    const existingSession = await prisma.workSession.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: "Sesión de trabajo no encontrada" },
        { status: 404 }
      )
    }

    // Calcular duración si se actualizan las horas
    let durationMinutes = existingSession.durationMinutes
    if (startTime && endTime) {
      durationMinutes = calculateMinutes(startTime, endTime)
      if (durationMinutes <= 0) {
        return NextResponse.json(
          { error: "La hora de fin debe ser mayor que la hora de inicio" },
          { status: 400 }
        )
      }
    }

    const updatedSession = await prisma.workSession.update({
      where: {
        id,
      },
      data: {
        ...(boardId && { boardId }),
        ...(listId !== undefined && { listId: listId || null }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        ...(durationMinutes !== existingSession.durationMinutes && { durationMinutes }),
        ...(tasksCompleted !== undefined && { tasksCompleted }),
        ...(description !== undefined && { description }),
        ...(workType && { workType }),
        updatedAt: new Date(),
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
    if (updatedSession.bitacoraBoardId) {
      await updateBitacoraAvatar(updatedSession.bitacoraBoardId, updatedSession.durationMinutes, updatedSession.tasksCompleted || 0)
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("Error updating work session:", error)
    return NextResponse.json(
      { error: "Error al actualizar la sesión de trabajo" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Los commits no se pueden borrar una vez registrados
  return NextResponse.json(
    { error: "Los commits no se pueden borrar una vez registrados" },
    { status: 403 }
  )
}



