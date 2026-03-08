"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  BarChart3, 
  FileText,
  Clock,
  CheckCircle,
  Award,
  TrendingUp,
  Calendar,
  Activity,
  Trophy
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Bitacora {
  id: string
  title: string
  description: string | null
  avatar: {
    level: number
    experience: number
    totalHours: number
    totalTasks: number
    totalSessions: number
    avatarStyle: string
  } | null
  stats: {
    totalHours: number
    totalTasks: number
    totalSessions: number
  }
  impactStats?: {
    impactScorePromedio: number
    criticalCount: number
    economicValue: number
  }
  workSessions: Array<{
    date: string
    durationMinutes: number
    tasksCompleted: number
    workType: string
  }>
}

export default function EstadisticasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState("30")

  useEffect(() => {
    fetchBitacoras()
  }, [])

  const fetchBitacoras = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/bitacoras")
      if (response.ok) {
        const data = await response.json()
        setBitacoras(data)
      }
    } catch (error) {
      console.error("Error fetching bitacoras:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las bitácoras",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const period = Number(periodDays)

  const formatLocalDateKey = (input: Date) => {
    const y = input.getFullYear()
    const m = String(input.getMonth() + 1).padStart(2, "0")
    const d = String(input.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const totalStats = useMemo(() => {
    const totalHours = bitacoras.reduce((sum, b) => sum + b.stats.totalHours, 0)
    const totalTasks = bitacoras.reduce((sum, b) => sum + b.stats.totalTasks, 0)
    const totalSessions = bitacoras.reduce((sum, b) => sum + b.stats.totalSessions, 0)
    const totalExperience = bitacoras.reduce((sum, b) => sum + (b.avatar?.experience || 0), 0)
    const impactScorePromedio =
      bitacoras.length > 0
        ? bitacoras.reduce((sum, b) => sum + (b.impactStats?.impactScorePromedio ?? 0), 0) / bitacoras.length
        : 0
    const criticalCount = bitacoras.reduce((sum, b) => sum + (b.impactStats?.criticalCount ?? 0), 0)
    const economicValue = bitacoras.reduce((sum, b) => sum + (b.impactStats?.economicValue ?? 0), 0)

    return {
      totalHours,
      totalTasks,
      totalSessions,
      totalExperience,
      impactScorePromedio: Math.round(impactScorePromedio),
      criticalCount,
      economicValue,
      productivityPerSession: totalSessions > 0 ? totalTasks / totalSessions : 0,
      avgHoursPerSession: totalSessions > 0 ? totalHours / totalSessions : 0,
    }
  }, [bitacoras])

  const dayRange = useMemo(() => {
    return Array.from({ length: period }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (period - 1 - i))
      return formatLocalDateKey(date)
    })
  }, [period])

  const activityByDay = useMemo(() => {
    return dayRange.map((day) => {
      let hours = 0
      let tasks = 0

      bitacoras.forEach((bitacora) => {
        bitacora.workSessions.forEach((session) => {
          if (formatLocalDateKey(new Date(session.date)) !== day) return
          hours += session.durationMinutes / 60
          tasks += session.tasksCompleted || 0
        })
      })

      return { day, hours, tasks }
    })
  }, [bitacoras, dayRange])

  const ranking = useMemo(() => {
    return [...bitacoras]
      .map((b) => ({
        id: b.id,
        title: b.title,
        xp: b.avatar?.experience ?? 0,
        impact: b.impactStats?.impactScorePromedio ?? 0,
        commits: b.stats.totalSessions,
        economic: b.impactStats?.economicValue ?? 0,
      }))
      .sort((a, b) => b.xp - a.xp)
  }, [bitacoras])

  const topActive = useMemo(() => {
    return [...bitacoras]
      .map((b) => ({
        id: b.id,
        title: b.title,
        sessions: b.stats.totalSessions,
        tasks: b.stats.totalTasks,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5)
  }, [bitacoras])

  const maxHours = Math.max(...activityByDay.map((d) => d.hours), 1)
  const maxTasks = Math.max(...activityByDay.map((d) => d.tasks), 1)
  const periodLabel = period === 7 ? "7 días" : period === 30 ? "30 días" : "90 días"

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Estadísticas Globales
            </h1>
            <div className="flex items-center gap-2">
              <Select value={periodDays} onValueChange={setPeriodDays}>
                <SelectTrigger className="w-[140px] border-gray-700 bg-[#161616]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => router.push("/bitacoras")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Perfiles
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Cargando estadísticas...</p>
            </div>
          ) : bitacoras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <BarChart3 className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">No hay bitácoras aún</p>
              <p className="text-sm mb-4">Crea bitácoras y registra commits para ver estadísticas</p>
              <Button
                onClick={() => router.push("/bitacoras")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear primer perfil
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">XP total equipo</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalExperience} XP</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Impacto global</p>
                        <p className="text-2xl font-bold text-white">{totalStats.impactScorePromedio}</p>
                        <p className="text-xs text-emerald-400/80 mt-0.5">score promedio</p>
                      </div>
                      <Activity className="h-8 w-8 text-cyan-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Tareas completadas</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalTasks}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Commits de trabajo</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalSessions}</p>
                      </div>
                      <FileText className="h-8 w-8 text-purple-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Horas registradas</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalHours.toFixed(1)}h</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a]/80 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Valor económico</p>
                        <p className="text-2xl font-bold text-green-400">
                          ${totalStats.economicValue.toLocaleString("es-MX")}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-emerald-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a]/80 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Critical detectadas</p>
                        <p className="text-2xl font-bold text-amber-400">{totalStats.criticalCount}</p>
                      </div>
                      <TargetIcon />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a]/80 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Productividad</p>
                        <p className="text-2xl font-bold text-white">
                          {totalStats.productivityPerSession.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">tareas por commit</p>
                      </div>
                      <Trophy className="h-8 w-8 text-indigo-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a]/80 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Horas por commit</p>
                        <p className="text-2xl font-bold text-white">
                          {totalStats.avgHoursPerSession.toFixed(1)}h
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-emerald-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Actividad del equipo ({periodLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 py-6">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Horas por día</p>
                    <div className="flex h-44 items-end justify-between gap-2">
                      {activityByDay.map((day) => {
                        const barHeight = day.hours > 0 ? Math.max((day.hours / maxHours) * 100, 4) : 2
                        return (
                          <div key={`h-${day.day}`} className="flex flex-1 flex-col items-center justify-end gap-1">
                            <div className="text-[10px] font-semibold text-blue-300">{day.hours.toFixed(1)}h</div>
                            <div className="relative w-full overflow-hidden rounded-t-md bg-gray-800/70" style={{ height: "90%" }}>
                              <div
                                className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(day.day).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wider text-gray-400">Tareas por día</p>
                    <div className="flex h-44 items-end justify-between gap-2">
                      {activityByDay.map((day) => {
                        const barHeight = day.tasks > 0 ? Math.max((day.tasks / maxTasks) * 100, 4) : 2
                        return (
                          <div key={`t-${day.day}`} className="flex flex-1 flex-col items-center justify-end gap-1">
                            <div className="text-[10px] font-semibold text-emerald-300">{day.tasks}</div>
                            <div className="relative w-full overflow-hidden rounded-t-md bg-gray-800/70" style={{ height: "90%" }}>
                              <div
                                className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-green-400"
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(day.day).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-gray-800 bg-[#1a1a1a]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      Ranking de contribución
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ranking.slice(0, 8).map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-gray-800 bg-black/40 p-3"
                        >
                          <div>
                            <p className="font-medium text-white">
                              #{index + 1} {item.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              Impacto {item.impact} • Commits {item.commits}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-300">{item.xp} XP</p>
                            <p className="text-xs text-gray-500">
                              ${item.economic.toLocaleString("es-MX")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-[#1a1a1a]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      Bitácoras más activas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topActive.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-gray-800 bg-black/40 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="text-sm text-blue-300">{item.sessions} commits</p>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              style={{
                                width: `${ranking.length ? (item.sessions / Math.max(...topActive.map((i) => i.sessions), 1)) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-500">{item.tasks} tareas completadas</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-500/40 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-200">
                    Este dashboard muestra <strong>análisis global del equipo</strong>. El detalle individual, historial
                    completo y progreso gamificado viven en cada perfil de <strong>Bitácora</strong>.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TargetIcon() {
  return <Activity className="h-8 w-8 text-amber-400 opacity-50" />
}
