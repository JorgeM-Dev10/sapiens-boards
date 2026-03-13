import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const tasks = await prisma.task.findMany({
      where: {
        list: {
          board: {
            ownerId: userId,
          },
        },
      },
      include: {
        assigned: true,
        list: { include: { board: { select: { id: true, title: true } } } },
        tags: { include: { tag: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json(
      { error: "Error al obtener las tareas" },
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
    const { title, description, image, listId, order, status, assignedTo, dueDate } = body

    console.log("Creating task with data:", { title, listId, order })

    if (!title || !listId) {
      return NextResponse.json(
        { error: "El título y listId son requeridos" },
        { status: 400 }
      )
    }

    // Verificar que la lista existe y pertenece a un board del usuario
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        board: { ownerId: userId },
      },
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



