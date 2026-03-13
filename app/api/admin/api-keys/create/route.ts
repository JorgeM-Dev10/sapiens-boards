import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"
import {
  generateSecureKey,
  hashKey,
  keyPrefix,
} from "@/lib/api-key"

/**
 * POST /api/admin/api-keys/create
 * Solo admin. Body: { name }.
 * Crea una API Key nueva y la devuelve (solo se muestra al crearla).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === "string" ? body.name.trim() : ""
    if (!name) {
      return NextResponse.json(
        { error: "El campo 'name' es requerido" },
        { status: 400 }
      )
    }

    const key = generateSecureKey()
    const keyHash = hashKey(key)
    const prefix = keyPrefix(key)

    await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        keyPrefix: prefix,
        createdById: session.user.id,
      },
    })

    return NextResponse.json({
      name,
      key,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: "Error al crear la API Key" },
      { status: 500 }
    )
  }
}
