/**
 * Lógica central de gamificación por impacto.
 * XP = suma de BitacoraEntry.xpGanado (evaluado por IA).
 * Horas/sesiones = métricas secundarias, NO generan XP.
 */

import { prisma } from "@/lib/prisma"
import { getRankByExperience } from "@/lib/sapiens-ranks"

export async function recomputeBitacoraAvatar(bitacoraBoardId: string) {
  const bitacora = await prisma.bitacoraBoard.findUnique({
    where: { id: bitacoraBoardId },
    include: { avatar: true, entries: true, workSessions: true },
  })
  if (!bitacora) return

  // XP únicamente por impacto (BitacoraEntry evaluado por IA)
  const experience = bitacora.entries.reduce((sum, e) => sum + e.xpGanado, 0)

  // Métricas secundarias (horas, sesiones) - no generan XP
  const totalHours = bitacora.workSessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
  const totalTasks = bitacora.workSessions.reduce((sum, s) => sum + s.tasksCompleted, 0)
  const totalSessions = bitacora.workSessions.length

  const sapiensRank = getRankByExperience(experience)
  const level = Math.floor(experience / 100) + 1

  const avatarData = {
    level,
    experience,
    totalHours,
    totalTasks,
    totalSessions,
    avatarStyle: sapiensRank.avatarStyle,
    rank: sapiensRank.id,
    avatarImageUrl: sapiensRank.avatarImageUrl,
  }

  if (bitacora.avatar) {
    await prisma.bitacoraAvatar.update({
      where: { id: bitacora.avatar.id },
      data: avatarData,
    })
  } else {
    await prisma.bitacoraAvatar.create({
      data: { bitacoraBoardId, ...avatarData },
    })
  }
}
