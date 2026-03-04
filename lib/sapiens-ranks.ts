/**
 * SISTEMA DE RANGOS SAPIENS
 * 5 rangos según XP acumulado. Cada rango tiene identidad visual y perks.
 */

export const SAPIENS_RANKS = [
  {
    id: "INITIUM",
    label: "Initium",
    subtitle: "El que entra al juego.",
    minXP: 0,
    maxXP: 999,
    color: "text-gray-400",
    borderColor: "border-gray-500",
    badgeClass: "bg-gray-500/20 text-gray-300 border-gray-500",
    bgColor: "from-gray-800/50 to-gray-900/50",
    glow: "rgba(59, 130, 246, 0.3)",
    gradientColor: "#3b82f6",
    avatarStyle: "initium",
    avatarImageUrl: "https://i.imgur.com/ZhsrnvR.png",
    emoji: "🌱",
  },
  {
    id: "EXECUTOR",
    label: "Executor",
    subtitle: "El que convierte intención en resultado.",
    minXP: 1000,
    maxXP: 2999,
    color: "text-blue-400",
    borderColor: "border-blue-500",
    badgeClass: "bg-blue-500/20 text-blue-300 border-blue-500",
    bgColor: "from-blue-900/30 to-blue-950/50",
    glow: "rgba(59, 130, 246, 0.5)",
    gradientColor: "#3b82f6",
    avatarStyle: "executor",
    avatarImageUrl: "https://i.imgur.com/8sfE7ue.png",
    emoji: "⚡",
  },
  {
    id: "STRATEGOS",
    label: "Strategos",
    subtitle: "El que piensa en consecuencias.",
    minXP: 3000,
    maxXP: 6999,
    color: "text-emerald-400",
    borderColor: "border-emerald-500",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500",
    bgColor: "from-emerald-900/30 to-emerald-950/50",
    glow: "rgba(16, 185, 129, 0.5)",
    gradientColor: "#10b981",
    avatarStyle: "strategos",
    avatarImageUrl: "https://i.imgur.com/3oUQA6l.png",
    emoji: "🎯",
  },
  {
    id: "ARCHITECTUS",
    label: "Architectus",
    subtitle: "El que diseña el futuro.",
    minXP: 7000,
    maxXP: 14999,
    color: "text-amber-400",
    borderColor: "border-amber-500",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500",
    bgColor: "from-amber-900/30 to-amber-950/50",
    glow: "rgba(245, 158, 11, 0.6)",
    gradientColor: "#eab308",
    avatarStyle: "architectus",
    avatarImageUrl: "https://i.imgur.com/CCuILkk.png",
    emoji: "🏛️",
  },
  {
    id: "PRIMUS",
    label: "Primus",
    subtitle: "El que altera la estructura.",
    minXP: 15000,
    maxXP: Infinity,
    color: "text-yellow-200",
    borderColor: "border-yellow-300",
    badgeClass: "bg-yellow-500/20 text-yellow-200 border-yellow-300",
    bgColor: "from-yellow-600/20 to-amber-900/40",
    glow: "rgba(253, 224, 71, 0.7)",
    gradientColor: "#fde047",
    avatarStyle: "primus",
    avatarImageUrl: "https://i.imgur.com/5WDwPXs.png",
    emoji: "👑",
  },
] as const

export type SapiensRankId = (typeof SAPIENS_RANKS)[number]["id"]

export function getRankById(id: string) {
  return SAPIENS_RANKS.find((r) => r.id === id) ?? SAPIENS_RANKS[0]
}

export function getRankByExperience(xp: number) {
  for (let i = SAPIENS_RANKS.length - 1; i >= 0; i--) {
    if (xp >= SAPIENS_RANKS[i].minXP) return SAPIENS_RANKS[i]
  }
  return SAPIENS_RANKS[0]
}

export function getProgressToNextRank(xp: number): { progress: number; nextRank: typeof SAPIENS_RANKS[number] | null; currentMin: number; nextMin: number } {
  const current = getRankByExperience(xp)
  const nextIndex = SAPIENS_RANKS.findIndex((r) => r.id === current.id) + 1
  const nextRank = nextIndex < SAPIENS_RANKS.length ? SAPIENS_RANKS[nextIndex] : null

  if (!nextRank) {
    return { progress: 100, nextRank: null, currentMin: current.minXP, nextMin: current.maxXP }
  }

  const xpInCurrentRank = xp - current.minXP
  const xpNeededForNext = nextRank.minXP - current.minXP
  const progress = Math.min(100, (xpInCurrentRank / xpNeededForNext) * 100)

  return { progress, nextRank, currentMin: current.minXP, nextMin: nextRank.minXP }
}
