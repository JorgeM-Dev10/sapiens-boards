import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    const { title, description, status, listId, order, assignedTo, dueDate, tagIds } = body

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
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

    const task = await prisma.task.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        assigned: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

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



