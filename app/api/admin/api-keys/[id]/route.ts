import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/admin/api-keys/[id] -> Desactivar (body: { isActive: false })
 * DELETE /api/admin/api-keys/[id] -> Eliminar
 * Solo admin y solo las keys propias (createdById).
 */
async function getKeyAndCheckAdmin(
  id: string,
  session: { user?: { id?: string } } | null
) {
  if (!session?.user?.id) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  if (!isAdmin(session)) return { error: NextResponse.json({ error: "Solo administradores" }, { status: 403 }) }

  const apiKey = await prisma.apiKey.findFirst({
    where: { id, createdById: session.user.id },
  })
  if (!apiKey) {
    return { error: NextResponse.json({ error: "API Key no encontrada" }, { status: 404 }) }
  }
  return { apiKey }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const result = await getKeyAndCheckAdmin(id, session)
    if ("error" in result) return result.error

    const body = await request.json().catch(() => ({}))
    const isActive = body.isActive === false ? false : body.isActive === true

    await prisma.apiKey.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ success: true, isActive })
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json(
      { error: "Error al actualizar la API Key" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    const result = await getKeyAndCheckAdmin(id, session)
    if ("error" in result) return result.error

    await prisma.apiKey.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json(
      { error: "Error al eliminar la API Key" },
      { status: 500 }
    )
  }
}
