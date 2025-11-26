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
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
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
      },
    })

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
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params

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

    await prisma.workSession.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting work session:", error)
    return NextResponse.json(
      { error: "Error al eliminar la sesión de trabajo" },
      { status: 500 }
    )
  }
}



