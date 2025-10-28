import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    // Primero eliminar las relaciones en _TaskTags
    await prisma.$executeRaw`DELETE FROM "_TaskTags" WHERE "tagId" = ${id}`

    // Luego eliminar el tag
    await prisma.tag.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Etiqueta eliminada exitosamente" })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Error al eliminar la etiqueta" },
      { status: 500 }
    )
  }
}

