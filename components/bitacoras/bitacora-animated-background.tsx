"use client"

import { motion } from "framer-motion"

type LevelIntensity = "principiante" | "intermedio" | "avanzado" | "epico" | "leyenda"

const LEVEL_OPACITY: Record<LevelIntensity, number> = {
  principiante: 0.3,
  intermedio: 0.45,
  avanzado: 0.6,
  epico: 0.75,
  leyenda: 1,
}

function getLevelFromRank(rank: string | null | undefined): LevelIntensity {
  if (!rank) return "principiante"
  const r = rank.toLowerCase()
  if (r.includes("leyenda")) return "leyenda"
  if (r.includes("épico") || r.includes("epico")) return "epico"
  if (r.includes("avanzado")) return "avanzado"
  if (r.includes("intermedio")) return "intermedio"
  return "principiante"
}

interface BitacoraAnimatedBackgroundProps {
  themeColor?: string | null
  rank?: string | null
  className?: string
  children?: React.ReactNode
}

/** Convierte hex a rgb para uso en gradients */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return "99, 102, 241"
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}

const DEFAULT_RGB = "168, 85, 247" // purple

export function BitacoraAnimatedBackground({
  themeColor,
  rank,
  className = "",
  children,
}: BitacoraAnimatedBackgroundProps) {
  const level = getLevelFromRank(rank)
  const intensity = LEVEL_OPACITY[level]
  const rgb = themeColor && themeColor.startsWith("#") ? hexToRgb(themeColor) : DEFAULT_RGB
  const isLeyenda = level === "leyenda"
  const isEpico = level === "epico"

  return (
    <div className={`relative min-h-full overflow-hidden ${className}`}>
      {/* Gradiente dinámico animado */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(${rgb}, ${0.15 * intensity}) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(${rgb}, ${0.1 * intensity}) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(${rgb}, ${0.05 * intensity}) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)
          `,
        }}
        animate={{
          opacity: [0.9, 1, 0.9],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Aurora / energy flow sutil */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse 100% 60% at 50% 100%, rgba(${rgb}, ${0.2 * intensity}) 0%, transparent 60%)`,
          filter: "blur(40px)",
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Partículas suaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              left: `${(i * 7) % 100}%`,
              top: `${(i * 11) % 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Leyenda/Épico: animación más marcada */}
      {(isLeyenda || isEpico) && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(${rgb}, ${0.08 * intensity}) 0%, transparent 50%)`,
            filter: "blur(60px)",
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.98, 1.02, 0.98],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Light noise overlay cinematic */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {children && <div className="relative z-10">{children}</div>}
    </div>
  )
}
