/**
 * OpenRouter: evaluación de impacto de tareas (solo backend).
 * Filosofía: premiamos impacto real, no horas ni volumen.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
import { GAMIFICATION_CONFIG } from "./gamification-config"

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface ImpactEvaluation {
  impactLevel: ImpactLevel
  recommendedXP: number
  impactScore: number
  shortReasoning: string
  economicWeight?: number
  strategicWeight?: number
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

  const prompt = `Eres un evaluador de impacto para Sapiens (empresa tecnológica enfocada en impacto y revenue). 
Premiamos impacto real: económico, estratégico, operativo, sistémico, innovación, optimización.
NO premiamos horas ni volumen. No sobrevalores tareas repetitivas. Penaliza tareas triviales infladas.

Responde ÚNICAMENTE con un JSON válido, sin markdown ni texto extra:
{
  "impactLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "recommendedXP": número 5-500 (proporcional al impacto real),
  "impactScore": número 0-100,
  "shortReasoning": "explicación breve en español",
  "economicWeight": número 0-100 (peso del impacto económico),
  "strategicWeight": número 0-100 (peso del impacto estratégico)
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
        max_tokens: 300,
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
    return {
      impactLevel: clampImpactLevel(raw.impactLevel),
      recommendedXP: clampXP(Number(raw.recommendedXP)),
      impactScore: clampScore(Number(raw.impactScore)),
      shortReasoning:
        typeof raw.shortReasoning === "string"
          ? raw.shortReasoning.slice(0, 500)
          : "Sin razonamiento.",
      economicWeight: typeof raw.economicWeight === "number" ? Math.max(0, Math.min(100, raw.economicWeight)) : undefined,
      strategicWeight: typeof raw.strategicWeight === "number" ? Math.max(0, Math.min(100, raw.strategicWeight)) : undefined,
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
