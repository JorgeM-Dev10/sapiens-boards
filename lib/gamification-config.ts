/**
 * Configuración del sistema de gamificación.
 * XP min/max por tarea, reglas anti-abuse.
 */

export const GAMIFICATION_CONFIG = {
  /** XP mínimo base por tarea completada (aunque IA devuelva menos) */
  XP_MIN_PER_TASK: 5,
  /** XP máximo por tarea (límite de seguridad) */
  XP_MAX_PER_TASK: 500,
  /** Número de evaluaciones recientes a enviar a la IA como contexto */
  RECENT_IMPACT_HISTORY_SIZE: 5,
} as const
