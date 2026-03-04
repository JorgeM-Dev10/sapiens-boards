/**
 * OpenRouter: evaluación de impacto de tareas (solo backend).
 * Filosofía: premiamos impacto real, no horas ni volumen.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
import { GAMIFICATION_CONFIG } from "./gamification-config"

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface ImpactBreakdown {
  economic: number
  strategic: number
  operational: number
  systemic: number
}

export interface ImpactEvaluation {
  impactLevel: ImpactLevel
  recommendedXP: number
  impactScore: number
  shortReasoning: string
  economicWeight?: number
  strategicWeight?: number
  operationalWeight?: number
  systemicWeight?: number
  breakdown?: ImpactBreakdown
}

export interface RecentImpact {
  title: string
  impactLevel: string
  impactScore: number
  xpGanado: number
}

export interface TaskContext {
  title: string
  description?: string | null
  category?: string | null
  difficulty?: number | null
  economicValue?: number | null
  resultAchieved?: string
  /** Tiempo invertido (solo informativo, no premiamos horas) */
  timeSpentMinutes?: number
  /** Rol del usuario si está disponible */
  userRole?: string
  /** Nivel/rango actual del usuario */
  currentRank?: string
  /** XP actual del usuario */
  currentXP?: number
  /** Historial reciente de impacto */
  recentImpactHistory?: RecentImpact[]
}

const IMPACT_LEVELS: ImpactLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

function clampImpactLevel(s: string): ImpactLevel {
  const u = s?.toUpperCase?.()
  if (IMPACT_LEVELS.includes(u as ImpactLevel)) return u as ImpactLevel
  return "MEDIUM"
}

function clampScore(n: number): number {
  if (typeof n !== "number" || isNaN(n)) return 50
  return Math.max(0, Math.min(100, Math.round(n)))
}

function clampXP(n: number): number {
  if (typeof n !== "number" || isNaN(n)) return 25
  const { XP_MIN_PER_TASK, XP_MAX_PER_TASK } = GAMIFICATION_CONFIG
  return Math.max(XP_MIN_PER_TASK, Math.min(XP_MAX_PER_TASK, Math.round(n)))
}

/**
 * Evalúa el impacto de una tarea completada y devuelve nivel, XP recomendado, score y razonamiento.
 * Si no hay API key o falla la llamada, devuelve valores por defecto.
 */
export async function evaluateTaskImpact(context: TaskContext): Promise<ImpactEvaluation> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey?.trim()) {
    return {
      impactLevel: "MEDIUM",
      recommendedXP: 25,
      impactScore: 50,
      shortReasoning: "Evaluación no disponible (falta OPENROUTER_API_KEY).",
    }
  }

  const recentHistory =
    context.recentImpactHistory?.length
      ? `\nHistorial reciente del usuario:\n${context.recentImpactHistory
          .slice(0, 5)
          .map(
            (h) =>
              `- "${h.title}" → ${h.impactLevel} (${h.impactScore} pts, ${h.xpGanado} XP)`
          )
          .join("\n")}`
      : ""

  const prompt = `Eres un evaluador de impacto para Sapiens (empresa tecnológica). 
IMPORTANTE: Una tarea puede NO generar dinero directo, pero aún así tener ALTO impacto estratégico, operativo o sistémico. Evalúa en MÚLTIPLES dimensiones.

Dimensiones a considerar:
1. Impacto Económico: ingreso, ahorro, valor monetario directo
2. Impacto Estratégico: habilitación futura, apertura de mercado, base estructural
3. Impacto Operativo: eficiencia, reducción de fricción, automatización
4. Impacto Sistémico: reducción de riesgo, arquitectura, escalabilidad, estabilidad

Si no hay valor económico declarado: NO penalices. Analiza: reducción de fricción, reducción de riesgo, mejora de eficiencia, alcance del cambio, a cuántas personas afecta.

NO premiamos horas ni volumen. Penaliza tareas triviales infladas.

Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto extra:
{
  "impactLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedXP": número 5-500 (proporcional al impacto real en TODAS las dimensiones),
  "impactScore": número 0-100 (ponderado por las 4 dimensiones),
  "shortReasoning": "explicación breve en español",
  "breakdown": {
    "economic": número 0-100,
    "strategic": número 0-100,
    "operational": número 0-100,
    "systemic": número 0-100
  }
}

Tarea: ${context.title}
${context.description ? `Descripción: ${context.description}` : ""}
${context.category ? `Categoría: ${context.category}` : ""}
${context.difficulty != null ? `Dificultad estimada (1-5): ${context.difficulty}` : ""}
${context.economicValue != null ? `Valor económico (MXN): ${context.economicValue}` : ""}
${context.resultAchieved ? `Resultado logrado: ${context.resultAchieved}` : "Resultado: completada"}
${context.currentRank ? `Usuario actual: rango ${context.currentRank}, ${context.currentXP ?? 0} XP` : ""}${recentHistory}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error("[openrouter] API error:", res.status, errText)
      return {
        impactLevel: "MEDIUM",
        recommendedXP: 25,
        impactScore: 50,
        shortReasoning: `Error de API: ${res.status}`,
      }
    }

    const data = await res.json()
    const content = data?.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return {
        impactLevel: "MEDIUM",
        recommendedXP: 25,
        impactScore: 50,
        shortReasoning: "Respuesta vacía del modelo.",
      }
    }

    const raw = JSON.parse(content.replace(/^```json\s*|\s*```$/g, "").trim())
    const clamp = (n: number) => (typeof n === "number" && !isNaN(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0)
    const breakdown = raw.breakdown && typeof raw.breakdown === "object"
      ? {
          economic: clamp(raw.breakdown.economic ?? raw.economicWeight),
          strategic: clamp(raw.breakdown.strategic ?? raw.strategicWeight),
          operational: clamp(raw.breakdown.operational ?? 0),
          systemic: clamp(raw.breakdown.systemic ?? 0),
        }
      : undefined

    return {
      impactLevel: clampImpactLevel(raw.impactLevel),
      recommendedXP: clampXP(Number(raw.recommendedXP ?? raw.xpAssigned)),
      impactScore: clampScore(Number(raw.impactScore)),
      shortReasoning:
        typeof raw.shortReasoning === "string"
          ? raw.shortReasoning.slice(0, 500)
          : (typeof raw.reasoning === "string" ? raw.reasoning.slice(0, 500) : "Sin razonamiento."),
      economicWeight: breakdown?.economic ?? (typeof raw.economicWeight === "number" ? clamp(raw.economicWeight) : undefined),
      strategicWeight: breakdown?.strategic ?? (typeof raw.strategicWeight === "number" ? clamp(raw.strategicWeight) : undefined),
      operationalWeight: breakdown?.operational,
      systemicWeight: breakdown?.systemic,
      breakdown,
    }
  } catch (e) {
    console.error("[openrouter] evaluateTaskImpact error:", e)
    return {
      impactLevel: "MEDIUM",
      recommendedXP: 25,
      impactScore: 50,
      shortReasoning: "Error al evaluar impacto.",
    }
  }
}
