import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const bitacoras = await prisma.bitacoraBoard.findMany({
      where: {
        userId,
      },
      include: {
        avatar: true,
        board: {
          select: {
            id: true,
            title: true,
          },
        },
        workSessions: {
          select: {
            id: true,
            date: true,
            durationMinutes: true,
            tasksCompleted: true,
          },
        },
        entries: {
          include: {
            task: {
              select: {
                impactLevel: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    })

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

      const entries = bitacora.entries as Array<{
        impactScore: number | null
        economicImpact: number | null
        task: { impactLevel: string | null } | null
      }>
      const impactScores = entries.filter((e) => e.impactScore != null).map((e) => e.impactScore!)
      const impactScorePromedio =
        impactScores.length > 0
          ? impactScores.reduce((a, b) => a + b, 0) / impactScores.length
          : 0
      const criticalCount = entries.filter(
        (e) => e.task?.impactLevel === "CRITICAL"
      ).length
      const economicValue = entries.reduce(
        (sum, e) => sum + (e.economicImpact ?? 0),
        0
      )

      const { entries: _entries, ...rest } = bitacora
      return {
        ...rest,
        stats: {
          totalHours,
          totalTasks,
          totalSessions,
        },
        impactStats: {
          impactScorePromedio: Math.round(impactScorePromedio),
          criticalCount,
          economicValue,
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
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const body = await request.json()
    const { title, description, image, themeColor, themeVariant } = body

    if (!title) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      )
    }

    // Obtener el máximo order para ponerlo al final
    const maxOrder = await prisma.bitacoraBoard.findFirst({
      where: {
        userId,
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
        themeColor: themeColor || null,
        themeVariant: themeVariant || null,
        order: newOrder,
        userId,
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
        rank: "INITIUM",
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

