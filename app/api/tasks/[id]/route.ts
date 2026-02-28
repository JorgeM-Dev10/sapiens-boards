import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { evaluateTaskImpact } from "@/lib/openrouter"

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
    const { title, description, image, status, listId, order, assignedTo, dueDate, tagIds, difficulty, category, economicValue } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (status !== undefined) updateData.status = status
    if (listId !== undefined) updateData.listId = listId
    if (order !== undefined) updateData.order = order
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (difficulty !== undefined) updateData.difficulty = difficulty == null ? null : Number(difficulty)
    if (category !== undefined) updateData.category = category || null
    if (economicValue !== undefined) updateData.economicValue = economicValue == null ? null : Number(economicValue)

    // Si se proporcionan tagIds, actualizar las etiquetas
    if (tagIds !== undefined) {
      // Primero eliminar todas las etiquetas existentes
      await prisma.taskTag.deleteMany({
        where: {
          taskId: id,
        },
      })

      // Luego agregar las nuevas etiquetas
      if (tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: tagIds.map((tagId: string) => ({
            taskId: id,
            tagId,
          })),
        })
      }
    }

    // Obtener la tarea antes de actualizar para verificar si cambió el status
    const oldTask = await prisma.task.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            board: true,
          },
        },
      },
    })

    const task = await prisma.task.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        assigned: true,
        list: {
          include: {
            board: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Completada: evaluación IA, guardar impacto, crear BitacoraEntry y actualizar avatar por XP de impacto
    if (status === 'completed' && oldTask?.status !== 'completed' && task.list?.board) {
      try {
        const evaluation = await evaluateTaskImpact({
          title: task.title,
          description: task.description,
          category: task.category,
          difficulty: task.difficulty,
          economicValue: task.economicValue,
          resultAchieved: "Completada",
        })

        await prisma.task.update({
          where: { id },
          data: {
            impactLevel: evaluation.impactLevel,
            impactScore: evaluation.impactScore,
            xpValue: evaluation.recommendedXP,
            evaluatedByAI: true,
          },
        })

        const bitacora = await prisma.bitacoraBoard.findFirst({
          where: {
            boardId: task.list.board.id,
            userId: session.user.id,
          },
        })

        if (bitacora) {
          await prisma.bitacoraEntry.create({
            data: {
              taskId: task.id,
              bitacoraBoardId: bitacora.id,
              xpGanado: evaluation.recommendedXP,
              impactScore: evaluation.impactScore,
              economicImpact: task.economicValue ?? undefined,
              aiReasoning: evaluation.shortReasoning,
            },
          })

          const entries = await prisma.bitacoraEntry.findMany({
            where: { bitacoraBoardId: bitacora.id },
          })
          const experience = entries.reduce((sum, e) => sum + e.xpGanado, 0)
          const totalTasks = entries.length

          const workSessions = await prisma.workSession.findMany({
            where: { bitacoraBoardId: bitacora.id },
          })
          const totalHours = workSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
          const totalSessions = workSessions.length

          const level = Math.floor(experience / 100) + 1
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
            avatarStyle = "basic"
            avatarImageUrl = "https://i.imgur.com/ZhsrnvR.png"
          }

          const avatarData = {
            level,
            experience,
            totalTasks,
            totalHours,
            totalSessions,
            avatarStyle,
            rank,
            avatarImageUrl,
          }

          const existingAvatar = await prisma.bitacoraAvatar.findUnique({
            where: { bitacoraBoardId: bitacora.id },
          })
          if (existingAvatar) {
            await prisma.bitacoraAvatar.update({
              where: { id: existingAvatar.id },
              data: avatarData,
            })
          } else {
            await prisma.bitacoraAvatar.create({
              data: { bitacoraBoardId: bitacora.id, ...avatarData },
            })
          }

          const now = new Date()
          const startTime = new Date(now.getTime() - 30 * 60000)
          await prisma.workSession.create({
            data: {
              userId: session.user.id,
              bitacoraBoardId: bitacora.id,
              boardId: task.list.board.id,
              listId: task.listId,
              date: now,
              startTime: format(startTime, "HH:mm"),
              endTime: format(now, "HH:mm"),
              durationMinutes: 30,
              tasksCompleted: 1,
              description: `Tarea completada: ${task.title}`,
              workType: "dev",
            },
          })
        }
      } catch (error) {
        console.error("Error al evaluar impacto / registrar en bitácora:", error)
      }
    }

    const taskWithImpact = await prisma.task.findUnique({
      where: { id },
      include: {
        assigned: true,
        list: { include: { board: true } },
        tags: { include: { tag: true } },
      },
    })

    return NextResponse.json(taskWithImpact ?? task)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Error al actualizar la tarea" },
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

    await prisma.task.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Error al eliminar la tarea" },
      { status: 500 }
    )
  }
}



