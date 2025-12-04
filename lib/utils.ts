import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Calcula la XP de una tarea basada en horas trabajadas y dificultad
 * @param hours - Horas trabajadas (1 XP por hora)
 * @param difficulty - Dificultad: "FACIL" (5 XP), "MEDIA" (10 XP), "DIFICIL" (20 XP)
 * @returns Total de XP
 */
export function calculateTaskXP(hours: number | null | undefined, difficulty: string | null | undefined): number {
  const hoursXP = (hours || 0) * 1
  let difficultyXP = 0
  
  if (difficulty === "FACIL") {
    difficultyXP = 5
  } else if (difficulty === "MEDIA") {
    difficultyXP = 10
  } else if (difficulty === "DIFICIL") {
    difficultyXP = 20
  }
  
  return hoursXP + difficultyXP
}



