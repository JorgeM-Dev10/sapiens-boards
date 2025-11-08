import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Verificar API key
function verifyApiKey(request: Request): boolean {
  const apiKey = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "")
  const validApiKey = process.env.WILLIAM_API_KEY

  if (!validApiKey) {
    console.error("WILLIAM_API_KEY no está configurada en las variables de entorno")
    return false
  }

  return apiKey === validApiKey
}

// Obtener userId del request o usar el primero disponible
async function getUserId(userId?: string, userEmail?: string): Promise<string | null> {
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) return user.id
  }

  if (userEmail) {
    const user = await prisma.user.findUnique({ where: { email: userEmail } })
    if (user) return user.id
  }

  // Si no se especifica, usar el primer usuario disponible
  const firstUser = await prisma.user.findFirst()
  return firstUser?.id || null
}

export async function POST(request: Request) {
  try {
    // Verificar API key
    if (!verifyApiKey(request)) {
      return NextResponse.json(
        { error: "API key inválida o no proporcionada" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, resource, data, id, userId, userEmail } = body

    if (!action || !resource) {
      return NextResponse.json(
        { error: "Se requiere 'action' y 'resource'" },
        { status: 400 }
      )
    }

    const targetUserId = await getUserId(userId, userEmail)
    if (!targetUserId) {
      return NextResponse.json(
        { error: "No se pudo determinar el usuario. Proporciona userId o userEmail" },
        { status: 400 }
      )
    }

    let result: any

    switch (action.toLowerCase()) {
      case "create":
        result = await handleCreate(resource, data, targetUserId)
        break
      case "read":
        result = await handleRead(resource, id, targetUserId)
        break
      case "update":
        if (!id) {
          return NextResponse.json({ error: "Se requiere 'id' para actualizar" }, { status: 400 })
        }
        result = await handleUpdate(resource, id, data, targetUserId)
        break
      case "delete":
        if (!id) {
          return NextResponse.json({ error: "Se requiere 'id' para eliminar" }, { status: 400 })
        }
        result = await handleDelete(resource, id, targetUserId)
        break
      case "list":
        result = await handleList(resource, targetUserId)
        break
      default:
        return NextResponse.json(
          { error: `Acción '${action}' no válida. Use: create, read, update, delete, list` },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("Error en API de William:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

// CREATE
async function handleCreate(resource: string, data: any, userId: string) {
  switch (resource.toLowerCase()) {
    case "client":
    case "clients":
      if (!data.name || data.totalAmount === undefined) {
        throw new Error("name y totalAmount son requeridos")
      }
      return await prisma.client.create({
        data: {
          name: data.name,
          description: data.description || null,
          icon: data.icon || null,
          phase: data.phase || "PLANIFICACIÓN",
          totalAmount: parseFloat(data.totalAmount),
          paidAmount: parseFloat(data.paidAmount) || 0,
          userId,
        },
        include: { timelines: true },
      })

    case "board":
    case "boards":
      if (!data.title) {
        throw new Error("title es requerido")
      }
      return await prisma.board.create({
        data: {
          title: data.title,
          description: data.description || null,
          image: data.image || null,
          ownerId: userId,
        },
        include: { lists: { include: { tasks: true } } },
      })

    case "list":
    case "lists":
      if (!data.title || !data.boardId) {
        throw new Error("title y boardId son requeridos")
      }
      // Obtener el último order
      const lastList = await prisma.list.findFirst({
        where: { boardId: data.boardId },
        orderBy: { order: "desc" },
      })
      return await prisma.list.create({
        data: {
          title: data.title,
          boardId: data.boardId,
          order: data.order ?? (lastList ? lastList.order + 1 : 0),
        },
        include: { tasks: true },
      })

    case "task":
    case "tasks":
      if (!data.title || !data.listId) {
        throw new Error("title y listId son requeridos")
      }
      const lastTask = await prisma.task.findFirst({
        where: { listId: data.listId },
        orderBy: { order: "desc" },
      })
      const task = await prisma.task.create({
        data: {
          title: data.title,
          description: data.description || null,
          image: data.image || null,
          listId: data.listId,
          order: data.order ?? (lastTask ? lastTask.order + 1 : 0),
          status: data.status || "pending",
          assignedTo: data.assignedTo || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        },
        include: {
          assigned: true,
          tags: { include: { tag: true } },
        },
      })
      // Agregar tags si se proporcionan
      if (data.tagIds && data.tagIds.length > 0) {
        await prisma.taskTag.createMany({
          data: data.tagIds.map((tagId: string) => ({
            taskId: task.id,
            tagId,
          })),
        })
        return await prisma.task.findUnique({
          where: { id: task.id },
          include: {
            assigned: true,
            tags: { include: { tag: true } },
          },
        })
      }
      return task

    case "worker":
    case "workers":
      if (!data.name || !data.type || !data.responsibilities || !data.status) {
        throw new Error("name, type, responsibilities y status son requeridos")
      }
      return await prisma.worker.create({
        data: {
          name: data.name,
          type: data.type,
          responsibilities: data.responsibilities,
          status: data.status,
          salary: parseFloat(data.salary) || 0,
          paymentType: data.paymentType || "FIXED",
          percentage: data.percentage ? parseFloat(data.percentage) : null,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          paymentDate: data.paymentDate || null,
          userId,
        },
      })

    case "ai-solution":
    case "ai-solutions":
    case "solution":
    case "solutions":
      if (!data.name || !data.category) {
        throw new Error("name y category son requeridos")
      }
      return await prisma.aISolution.create({
        data: {
          name: data.name,
          description: data.description || null,
          category: data.category,
          type: data.type || "INDIVIDUAL",
          price: data.price ? parseFloat(data.price) : null,
          features: data.features || null,
          icon: data.icon || null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          userId,
        },
      })

    case "tag":
    case "tags":
      if (!data.name || !data.color) {
        throw new Error("name y color son requeridos")
      }
      return await prisma.tag.create({
        data: {
          name: data.name,
          color: data.color,
        },
      })

    case "timeline":
    case "timelines":
      if (!data.title || !data.clientId) {
        throw new Error("title y clientId son requeridos")
      }
      return await prisma.clientTimeline.create({
        data: {
          title: data.title,
          description: data.description || null,
          type: data.type || "UPDATE",
          amount: data.amount ? parseFloat(data.amount) : null,
          clientId: data.clientId,
        },
      })

    default:
      throw new Error(`Recurso '${resource}' no válido`)
  }
}

// READ
async function handleRead(resource: string, id: string, userId: string) {
  if (!id) {
    throw new Error("Se requiere 'id' para leer un recurso específico")
  }

  switch (resource.toLowerCase()) {
    case "client":
    case "clients":
      return await prisma.client.findFirst({
        where: { id, userId },
        include: { timelines: { orderBy: { createdAt: "desc" } } },
      })

    case "board":
    case "boards":
      return await prisma.board.findFirst({
        where: { id, ownerId: userId },
        include: {
          lists: {
            include: {
              tasks: {
                include: {
                  assigned: true,
                  tags: { include: { tag: true } },
                },
              },
            },
          },
        },
      })

    case "list":
    case "lists":
      return await prisma.list.findUnique({
        where: { id },
        include: { tasks: { include: { assigned: true, tags: { include: { tag: true } } } } },
      })

    case "task":
    case "tasks":
      return await prisma.task.findUnique({
        where: { id },
        include: {
          assigned: true,
          tags: { include: { tag: true } },
          list: true,
        },
      })

    case "worker":
    case "workers":
      return await prisma.worker.findFirst({
        where: { id, userId },
      })

    case "ai-solution":
    case "ai-solutions":
    case "solution":
    case "solutions":
      return await prisma.aISolution.findFirst({
        where: { id, userId },
      })

    case "tag":
    case "tags":
      return await prisma.tag.findUnique({
        where: { id },
      })

    case "timeline":
    case "timelines":
      return await prisma.clientTimeline.findUnique({
        where: { id },
      })

    default:
      throw new Error(`Recurso '${resource}' no válido`)
  }
}

// UPDATE
async function handleUpdate(resource: string, id: string, data: any, userId: string) {
  switch (resource.toLowerCase()) {
    case "client":
    case "clients":
      const clientUpdateData: any = {}
      if (data.name !== undefined) clientUpdateData.name = data.name
      if (data.description !== undefined) clientUpdateData.description = data.description
      if (data.icon !== undefined) clientUpdateData.icon = data.icon
      if (data.phase !== undefined) clientUpdateData.phase = data.phase
      if (data.totalAmount !== undefined) clientUpdateData.totalAmount = parseFloat(data.totalAmount)
      if (data.paidAmount !== undefined) clientUpdateData.paidAmount = parseFloat(data.paidAmount)

      return await prisma.client.update({
        where: { id, userId },
        data: clientUpdateData,
        include: { timelines: { orderBy: { createdAt: "desc" } } },
      })

    case "board":
    case "boards":
      const boardUpdateData: any = {}
      if (data.title !== undefined) boardUpdateData.title = data.title
      if (data.description !== undefined) boardUpdateData.description = data.description
      if (data.image !== undefined) boardUpdateData.image = data.image

      return await prisma.board.update({
        where: { id, ownerId: userId },
        data: boardUpdateData,
        include: { lists: { include: { tasks: true } } },
      })

    case "list":
    case "lists":
      const listUpdateData: any = {}
      if (data.title !== undefined) listUpdateData.title = data.title
      if (data.order !== undefined) listUpdateData.order = data.order
      if (data.boardId !== undefined) listUpdateData.boardId = data.boardId

      return await prisma.list.update({
        where: { id },
        data: listUpdateData,
        include: { tasks: true },
      })

    case "task":
    case "tasks":
      const taskUpdateData: any = {}
      if (data.title !== undefined) taskUpdateData.title = data.title
      if (data.description !== undefined) taskUpdateData.description = data.description
      if (data.image !== undefined) taskUpdateData.image = data.image
      if (data.status !== undefined) taskUpdateData.status = data.status
      if (data.listId !== undefined) taskUpdateData.listId = data.listId
      if (data.order !== undefined) taskUpdateData.order = data.order
      if (data.assignedTo !== undefined) taskUpdateData.assignedTo = data.assignedTo
      if (data.dueDate !== undefined) taskUpdateData.dueDate = data.dueDate ? new Date(data.dueDate) : null

      // Actualizar tags si se proporcionan
      if (data.tagIds !== undefined) {
        await prisma.taskTag.deleteMany({ where: { taskId: id } })
        if (data.tagIds.length > 0) {
          await prisma.taskTag.createMany({
            data: data.tagIds.map((tagId: string) => ({
              taskId: id,
              tagId,
            })),
          })
        }
      }

      return await prisma.task.update({
        where: { id },
        data: taskUpdateData,
        include: {
          assigned: true,
          tags: { include: { tag: true } },
        },
      })

    case "worker":
    case "workers":
      const workerUpdateData: any = {}
      if (data.name !== undefined) workerUpdateData.name = data.name
      if (data.type !== undefined) workerUpdateData.type = data.type
      if (data.responsibilities !== undefined) workerUpdateData.responsibilities = data.responsibilities
      if (data.status !== undefined) workerUpdateData.status = data.status
      if (data.salary !== undefined) workerUpdateData.salary = parseFloat(data.salary)
      if (data.paymentType !== undefined) workerUpdateData.paymentType = data.paymentType
      if (data.percentage !== undefined) workerUpdateData.percentage = data.percentage ? parseFloat(data.percentage) : null
      if (data.startDate !== undefined) workerUpdateData.startDate = new Date(data.startDate)
      if (data.paymentDate !== undefined) workerUpdateData.paymentDate = data.paymentDate

      return await prisma.worker.update({
        where: { id, userId },
        data: workerUpdateData,
      })

    case "ai-solution":
    case "ai-solutions":
    case "solution":
    case "solutions":
      const solutionUpdateData: any = {}
      if (data.name !== undefined) solutionUpdateData.name = data.name
      if (data.description !== undefined) solutionUpdateData.description = data.description
      if (data.category !== undefined) solutionUpdateData.category = data.category
      if (data.type !== undefined) solutionUpdateData.type = data.type
      if (data.price !== undefined) solutionUpdateData.price = data.price ? parseFloat(data.price) : null
      if (data.features !== undefined) solutionUpdateData.features = data.features
      if (data.icon !== undefined) solutionUpdateData.icon = data.icon
      if (data.isActive !== undefined) solutionUpdateData.isActive = data.isActive

      return await prisma.aISolution.update({
        where: { id, userId },
        data: solutionUpdateData,
      })

    case "tag":
    case "tags":
      const tagUpdateData: any = {}
      if (data.name !== undefined) tagUpdateData.name = data.name
      if (data.color !== undefined) tagUpdateData.color = data.color

      return await prisma.tag.update({
        where: { id },
        data: tagUpdateData,
      })

    case "timeline":
    case "timelines":
      const timelineUpdateData: any = {}
      if (data.title !== undefined) timelineUpdateData.title = data.title
      if (data.description !== undefined) timelineUpdateData.description = data.description
      if (data.type !== undefined) timelineUpdateData.type = data.type
      if (data.amount !== undefined) timelineUpdateData.amount = data.amount ? parseFloat(data.amount) : null

      return await prisma.clientTimeline.update({
        where: { id },
        data: timelineUpdateData,
      })

    default:
      throw new Error(`Recurso '${resource}' no válido`)
  }
}

// DELETE
async function handleDelete(resource: string, id: string, userId: string) {
  switch (resource.toLowerCase()) {
    case "client":
    case "clients":
      await prisma.client.delete({ where: { id, userId } })
      return { success: true, message: "Cliente eliminado" }

    case "board":
    case "boards":
      await prisma.board.delete({ where: { id, ownerId: userId } })
      return { success: true, message: "Tablero eliminado" }

    case "list":
    case "lists":
      await prisma.list.delete({ where: { id } })
      return { success: true, message: "Lista eliminada" }

    case "task":
    case "tasks":
      await prisma.task.delete({ where: { id } })
      return { success: true, message: "Tarea eliminada" }

    case "worker":
    case "workers":
      await prisma.worker.delete({ where: { id, userId } })
      return { success: true, message: "Empleado eliminado" }

    case "ai-solution":
    case "ai-solutions":
    case "solution":
    case "solutions":
      await prisma.aISolution.delete({ where: { id, userId } })
      return { success: true, message: "Solución AI eliminada" }

    case "tag":
    case "tags":
      await prisma.tag.delete({ where: { id } })
      return { success: true, message: "Etiqueta eliminada" }

    case "timeline":
    case "timelines":
      await prisma.clientTimeline.delete({ where: { id } })
      return { success: true, message: "Timeline eliminado" }

    default:
      throw new Error(`Recurso '${resource}' no válido`)
  }
}

// LIST
async function handleList(resource: string, userId: string) {
  switch (resource.toLowerCase()) {
    case "client":
    case "clients":
      return await prisma.client.findMany({
        where: { userId },
        include: { timelines: { orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      })

    case "board":
    case "boards":
      return await prisma.board.findMany({
        where: { ownerId: userId },
        include: { lists: { include: { tasks: true } } },
        orderBy: { createdAt: "desc" },
      })

    case "list":
    case "lists":
      return await prisma.list.findMany({
        include: { tasks: true },
        orderBy: { order: "asc" },
      })

    case "task":
    case "tasks":
      return await prisma.task.findMany({
        include: {
          assigned: true,
          tags: { include: { tag: true } },
          list: true,
        },
        orderBy: { createdAt: "desc" },
      })

    case "worker":
    case "workers":
      return await prisma.worker.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

    case "ai-solution":
    case "ai-solutions":
    case "solution":
    case "solutions":
      return await prisma.aISolution.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      })

    case "tag":
    case "tags":
      return await prisma.tag.findMany({
        orderBy: { createdAt: "desc" },
      })

    case "timeline":
    case "timelines":
      return await prisma.clientTimeline.findMany({
        orderBy: { createdAt: "desc" },
      })

    default:
      throw new Error(`Recurso '${resource}' no válido`)
  }
}






