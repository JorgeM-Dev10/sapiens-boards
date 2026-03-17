import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/api-keys
 * Solo admin. Lista API Keys: name, key (parcial), active, createdAt.
 * Nunca devuelve la key completa.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
    }

    const keys = await prisma.apiKey.findMany({
      where: { createdById: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    })

    return NextResponse.json(
      keys.map((k) => ({
        id: k.id,
        name: k.name,
        key: k.keyPrefix,
        active: k.isActive,
        createdAt: k.createdAt,
        lastUsedAt: k.lastUsedAt,
      }))
    )
  } catch (error) {
    console.error("Error listing API keys:", error)
    return NextResponse.json(
      { error: "Error al listar API Keys" },
      { status: 500 }
    )
  }
}
