import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { calculateTaskXP } from "@/lib/utils"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener todos los boards del usuario
    const boards = await prisma.board.findMany({
      where: {
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
              where: {
                assignedTo: session.user.id,
              },
              include: {
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Transformar boards en bitácoras con estadísticas
    const bitacoras = boards.map((board) => {
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

      return {
        id: board.id,
        title: board.title,
        description: board.description,
        image: board.image,
        avatar: {
          level,
          experience,
          totalHours,
          totalTasks,
          totalSessions: 1, // Por ahora, cada board es una sesión
          avatarStyle,
        },
        stats: {
          totalHours,
          totalTasks,
          totalSessions: 1,
        },
      }
    })

    return NextResponse.json(bitacoras)
  } catch (error) {
    console.error("Error fetching bitacoras:", error)
    return NextResponse.json(
      { error: "Error al obtener las bitácoras" },
      { status: 500 }
    )
  }
}

