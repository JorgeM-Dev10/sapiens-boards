import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tags = await prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Error al obtener las etiquetas" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name || !color) {
      return NextResponse.json(
        { error: "El nombre y color son requeridos" },
        { status: 400 }
      )
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        color,
      },
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Error al crear la etiqueta" },
      { status: 500 }
    )
  }
}










