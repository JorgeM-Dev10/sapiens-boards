import { NextResponse } from "next/server"
import { getAuthUserId } from "@/lib/auth-api"
import { prisma } from "@/lib/prisma"
import { evaluateTaskImpact } from "@/lib/openrouter"
import { recomputeBitacoraAvatar } from "@/lib/gamification"

/**
 * Registra impacto por mensaje libre. La IA evalúa y asigna XP.
 * POST body: { message: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUserId(request)
    if (auth instanceof NextResponse) return auth
    const userId = auth.userId

    const { id } = await params
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "El mensaje es requerido" },
        { status: 400 }
      )
    }

    const bitacora = await prisma.bitacoraBoard.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        avatar: true,
        entries: {
          include: { task: { select: { title: true, impactLevel: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!bitacora) {
      return NextResponse.json(
        { error: "Bitácora no encontrada" },
        { status: 404 }
      )
    }

    const recentImpactHistory = bitacora.entries.map((e) => ({
      title: e.task?.title ?? "Registro manual",
      impactLevel: e.task?.impactLevel ?? "MEDIUM",
      impactScore: e.impactScore ?? 50,
      xpGanado: e.xpGanado,
    }))

    const evaluation = await evaluateTaskImpact({
      title: "Registro de impacto",
      description: message.trim(),
      resultAchieved: message.trim(),
      currentRank: bitacora.avatar?.rank ?? undefined,
      currentXP: bitacora.avatar?.experience ?? undefined,
      recentImpactHistory:
        recentImpactHistory.length ? recentImpactHistory : undefined,
    })

    const previousXP = bitacora.avatar?.experience ?? 0
    const previousRank = bitacora.avatar?.rank ?? "INITIUM"

    await prisma.bitacoraEntry.create({
      data: {
        bitacoraBoardId: bitacora.id,
        taskId: null,
        xpGanado: evaluation.recommendedXP,
        impactScore: evaluation.impactScore,
        aiReasoning: evaluation.shortReasoning,
      },
    })

    await recomputeBitacoraAvatar(bitacora.id)

    const bitacoraAfter = await prisma.bitacoraBoard.findUnique({
      where: { id: bitacora.id },
      include: { avatar: true },
    })
    const totalXP = bitacoraAfter?.avatar?.experience ?? previousXP + evaluation.recommendedXP
    const newRank = bitacoraAfter?.avatar?.rank ?? previousRank

    return NextResponse.json({
      xpGained: evaluation.recommendedXP,
      totalXP,
      previousXP,
      levelUp: Math.floor(totalXP / 100) > Math.floor(previousXP / 100),
      rankUp: newRank !== previousRank ? newRank : null,
      impactLevel: evaluation.impactLevel,
    })
  } catch (error) {
    console.error("[log-impact] Error:", error)
    return NextResponse.json(
      { error: "Error al registrar el impacto" },
      { status: 500 }
    )
  }
}
