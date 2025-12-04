import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskXP } from "@/lib/utils"

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

    // Obtener el board
    const board = await prisma.board.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
      include: {
        lists: {
          include: {
            tasks: {
              include: {
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      )
    }

    // Obtener todas las tareas del board
    const allTasks = board.lists.flatMap((list) => list.tasks)

    // Calcular estadísticas
    const totalHours = allTasks.reduce((sum, task) => sum + ((task as any).hours || 0), 0)
    const totalTasks = allTasks.length
    const totalXP = allTasks.reduce((sum, task) => {
      return sum + calculateTaskXP((task as any).hours, (task as any).difficulty)
    }, 0)

    // Calcular nivel y estilo de avatar basado en XP
    const level = Math.floor(totalXP / 1000) + 1
    const experience = totalXP

    let avatarStyle = "beginner"
    if (totalXP >= 5000) avatarStyle = "legend"
    else if (totalXP >= 3000) avatarStyle = "master"
    else if (totalXP >= 2000) avatarStyle = "expert"
    else if (totalXP >= 1000) avatarStyle = "advanced"
    else if (totalXP >= 500) avatarStyle = "intermediate"

    return NextResponse.json({
      id: board.id,
      title: board.title,
      description: board.description,
      image: board.image,
      tasks: allTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        hours: (task as any).hours,
        difficulty: (task as any).difficulty,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        tags: task.tags,
      })),
      stats: {
        totalHours,
        totalTasks,
        totalXP,
      },
      avatar: {
        level,
        experience,
        avatarStyle,
      },
    })
  } catch (error) {
    console.error("Error fetching bitacora:", error)
    return NextResponse.json(
      { error: "Error al obtener la bitácora" },
      { status: 500 }
    )
  }
}

