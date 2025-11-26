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

    const bitacoras = await prisma.bitacoraBoard.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        avatar: true,
        workSessions: {
          select: {
            id: true,
            date: true,
            durationMinutes: true,
            tasksCompleted: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

    // Calcular estadísticas rápidas
    const bitacorasWithStats = bitacoras.map((bitacora) => {
      const totalHours = bitacora.workSessions.reduce(
        (sum, session) => sum + session.durationMinutes / 60,
        0
      )
      const totalTasks = bitacora.workSessions.reduce(
        (sum, session) => sum + session.tasksCompleted,
        0
      )
      const totalSessions = bitacora.workSessions.length

      return {
        ...bitacora,
        stats: {
          totalHours,
          totalTasks,
          totalSessions,
        },
      }
    })

    return NextResponse.json(bitacorasWithStats)
  } catch (error) {
    console.error("Error fetching bitacoras:", error)
    return NextResponse.json(
      { error: "Error al obtener las bitácoras" },
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
    const { title, description, image } = body

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    // Obtener el máximo order para ponerlo al final
    const maxOrder = await prisma.bitacoraBoard.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    })

    const newOrder = maxOrder ? maxOrder.order + 1 : 0

    const bitacora = await prisma.bitacoraBoard.create({
      data: {
        title,
        description: description || null,
        image: image || null,
        order: newOrder,
        userId: session.user.id,
      },
      include: {
        avatar: true,
      },
    })

    // Crear avatar inicial
    await prisma.bitacoraAvatar.create({
      data: {
        bitacoraBoardId: bitacora.id,
        level: 1,
        experience: 0,
        totalHours: 0,
        totalTasks: 0,
        totalSessions: 0,
        avatarStyle: "basic",
        rank: "Novato",
        guild: "I",
      },
    })

    const bitacoraWithAvatar = await prisma.bitacoraBoard.findUnique({
      where: {
        id: bitacora.id,
      },
      include: {
        avatar: true,
      },
    })

    return NextResponse.json(bitacoraWithAvatar)
  } catch (error) {
    console.error("Error creating bitacora:", error)
    return NextResponse.json(
      { error: "Error al crear la bitácora" },
      { status: 500 }
    )
  }
}

