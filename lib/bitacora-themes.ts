/**
 * Paleta de temas para Bitácoras.
 * themeColor: identificador (para preset) o hex (para custom)
 * themeVariant: opcional, variante del preset
 */

export const BITACORA_THEMES = [
  { id: "neon-purple", label: "Neon Purple", primary: "#a855f7", secondary: "#c084fc", glow: "rgba(168, 85, 247, 0.5)" },
  { id: "deep-blue", label: "Deep Blue", primary: "#3b82f6", secondary: "#60a5fa", glow: "rgba(59, 130, 246, 0.5)" },
  { id: "emerald-green", label: "Emerald Green", primary: "#10b981", secondary: "#34d399", glow: "rgba(16, 185, 129, 0.5)" },
  { id: "crimson-red", label: "Crimson Red", primary: "#ef4444", secondary: "#f87171", glow: "rgba(239, 68, 68, 0.5)" },
  { id: "gold", label: "Gold", primary: "#eab308", secondary: "#facc15", glow: "rgba(234, 179, 8, 0.5)" },
  { id: "custom", label: "Personalizado (hex)", primary: "#6366f1", secondary: "#818cf8", glow: "rgba(99, 102, 241, 0.5)" },
] as const

export type ThemeId = typeof BITACORA_THEMES[number]["id"]

export function getThemeColors(themeColor: string | null | undefined): {
  primary: string
  secondary: string
  glow: string
} {
  if (!themeColor) {
    const def = BITACORA_THEMES[0] // Neon Purple por defecto
    return { primary: def.primary, secondary: def.secondary, glow: def.glow }
  }
  const preset = BITACORA_THEMES.find(t => t.id === themeColor)
  if (preset) return { primary: preset.primary, secondary: preset.secondary, glow: preset.glow }
  const hex = themeColor.startsWith("#") ? themeColor : `#${themeColor}`
  return { primary: hex, secondary: hex, glow: `${hex}80` }
}
