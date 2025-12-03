import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"

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
    const { title, description, image, status, listId, order, assignedTo, dueDate, tagIds } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (image !== undefined) updateData.image = image
    if (status !== undefined) updateData.status = status
    if (listId !== undefined) updateData.listId = listId
    if (order !== undefined) updateData.order = order
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null

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

    // Si la tarea se marcó como completada y tiene un board asociado, registrar en bitácora
    if (status === 'completed' && oldTask?.status !== 'completed' && task.list?.board) {
      try {
        // Buscar bitácora conectada a este roadmap
        const bitacora = await prisma.bitacoraBoard.findFirst({
          where: {
            boardId: task.list.board.id,
            userId: session.user.id,
          },
        })

        if (bitacora) {
          // Crear registro automático en la bitácora
          const now = new Date()
          const startTime = new Date(now.getTime() - 30 * 60000) // 30 minutos antes
          const endTime = now
          const durationMinutes = 30 // Asumir 30 minutos por tarea completada

          await prisma.workSession.create({
            data: {
              userId: session.user.id,
              bitacoraBoardId: bitacora.id,
              boardId: task.list.board.id,
              listId: task.listId,
              date: now,
              startTime: format(startTime, 'HH:mm'),
              endTime: format(endTime, 'HH:mm'),
              durationMinutes,
              tasksCompleted: 1,
              description: `Tarea completada: ${task.title}`,
              workType: "dev",
            },
          })

          // Actualizar avatar de la bitácora
          const bitacoraWithSessions = await prisma.bitacoraBoard.findUnique({
            where: { id: bitacora.id },
            include: { avatar: true, workSessions: true },
          })

          if (bitacoraWithSessions) {
            const totalHours = bitacoraWithSessions.workSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
            const totalTasks = bitacoraWithSessions.workSessions.reduce((sum, s) => sum + s.tasksCompleted, 0)
            const totalSessions = bitacoraWithSessions.workSessions.length
            const experience = Math.floor(totalHours) + (totalTasks * 10) + (totalSessions * 5)
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
              rank = "Principiante"
              avatarStyle = "basic"
              avatarImageUrl = "https://i.imgur.com/ZhsrnvR.png"
            }

            if (bitacoraWithSessions.avatar) {
              await prisma.bitacoraAvatar.update({
                where: { id: bitacoraWithSessions.avatar.id },
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
                  bitacoraBoardId: bitacora.id,
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
          }
        }
      } catch (error) {
        console.error("Error registering task completion in bitacora:", error)
        // No fallar la actualización de la tarea si hay error en la bitácora
      }
    }

    return NextResponse.json(task)
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



