/**
 * OpenRouter: evaluación de impacto de tareas (solo backend).
 * Usar variable de entorno OPENROUTER_API_KEY.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

export interface ImpactEvaluation {
  impactLevel: ImpactLevel
  recommendedXP: number
  impactScore: number
  shortReasoning: string
}

export interface TaskContext {
  title: string
  description?: string | null
  category?: string | null
  difficulty?: number | null
  economicValue?: number | null
  resultAchieved?: string
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
  if (typeof n !== "number" || isNaN(n)) return 10
  return Math.max(0, Math.min(9999, Math.round(n)))
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

  const prompt = `Eres un evaluador de impacto para una empresa de software. Evalúa la tarea completada y responde ÚNICAMENTE con un JSON válido, sin markdown ni texto extra, con estas claves exactas:
- impactLevel: uno de "LOW", "MEDIUM", "HIGH", "CRITICAL"
- recommendedXP: número entero 0-500 (más impacto = más XP)
- impactScore: número entero 0-100 (importancia estratégica y económica)
- shortReasoning: una frase breve en español explicando por qué

Tarea: ${context.title}
${context.description ? `Descripción: ${context.description}` : ""}
${context.category ? `Categoría: ${context.category}` : ""}
${context.difficulty != null ? `Dificultad estimada (1-5): ${context.difficulty}` : ""}
${context.economicValue != null ? `Valor económico (MXN): ${context.economicValue}` : ""}
${context.resultAchieved ? `Resultado logrado: ${context.resultAchieved}` : "Resultado: completada"}`

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
