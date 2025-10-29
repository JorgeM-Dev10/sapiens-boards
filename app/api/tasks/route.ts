import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, image, listId, order, status, assignedTo, dueDate } = body

    console.log("Creating task with data:", { title, listId, order })

    if (!title || !listId) {
      return NextResponse.json(
        { error: "El título y listId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que la lista existe
    const list = await prisma.list.findUnique({
      where: { id: listId },
    })

    if (!list) {
      console.error("List not found:", listId)
      return NextResponse.json(
        { error: "Lista no encontrada" },
        { status: 404 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        image: image || null,
        listId,
        order: order ?? 0,
        status: status ?? "pending",
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assigned: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    console.log("Task created successfully:", task.id)
    return NextResponse.json(task)
  } catch (error: any) {
    console.error("Error creating task:", error)
    console.error("Error details:", error.message)
    return NextResponse.json(
      { error: "Error al crear la tarea: " + error.message },
      { status: 500 }
    )
  }
}



