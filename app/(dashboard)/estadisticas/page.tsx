"use client"

import { useEffect, useState } from "react"
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
  Activity
} from "lucide-react"
import { useRouter } from "next/navigation"

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

  // Calcular estadísticas agregadas
  const totalStats = {
    totalHours: bitacoras.reduce((sum, b) => sum + b.stats.totalHours, 0),
    totalTasks: bitacoras.reduce((sum, b) => sum + b.stats.totalTasks, 0),
    totalSessions: bitacoras.reduce((sum, b) => sum + b.stats.totalSessions, 0),
    totalExperience: bitacoras.reduce((sum, b) => sum + (b.avatar?.experience || 0), 0),
    averageLevel: bitacoras.length > 0
      ? bitacoras.reduce((sum, b) => sum + (b.avatar?.level || 1), 0) / bitacoras.length
      : 0,
  }

  // Horas por día (últimos 7 días)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  const hoursByDay = last7Days.map(date => {
    const hours = bitacoras.reduce((sum, bitacora) => {
      return sum + bitacora.workSessions
        .filter(s => new Date(s.date).toISOString().split('T')[0] === date)
        .reduce((s, session) => s + session.durationMinutes / 60, 0)
    }, 0)
    return { date, hours }
  })

  const maxHours = Math.max(...hoursByDay.map(d => d.hours), 1)

  // Horas por tipo de trabajo
  const hoursByWorkType = new Map<string, number>()
  bitacoras.forEach(bitacora => {
    bitacora.workSessions.forEach(session => {
      const hours = session.durationMinutes / 60
      const existing = hoursByWorkType.get(session.workType) || 0
      hoursByWorkType.set(session.workType, existing + hours)
    })
  })

  const workTypeArray = Array.from(hoursByWorkType.entries())
    .map(([type, hours]) => ({ type, hours }))
    .sort((a, b) => b.hours - a.hours)

  const maxWorkTypeHours = Math.max(...workTypeArray.map(w => w.hours), 1)

  // Horas por bitácora
  const hoursByBitacora = bitacoras
    .map(b => ({ title: b.title, hours: b.stats.totalHours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)

  const maxBitacoraHours = Math.max(...hoursByBitacora.map(b => b.hours), 1)

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Estadísticas
            </h1>
            <Button
              onClick={() => router.push("/bitacoras")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver Bitácoras
            </Button>
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
                Crear Primera Bitácora
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPIs principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Horas Totales</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalHours.toFixed(1)}h</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Tareas Completadas</p>
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
                        <p className="text-xs text-gray-400 mb-1">Sesiones Totales</p>
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
                        <p className="text-xs text-gray-400 mb-1">Experiencia Total</p>
                        <p className="text-2xl font-bold text-white">{totalStats.totalExperience} XP</p>
                      </div>
                      <Award className="h-8 w-8 text-yellow-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráfica de horas por día */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Horas por Día (Últimos 7 días)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-center gap-3 h-32">
                    {hoursByDay.map((day) => (
                      <div key={day.date} className="flex flex-col items-center gap-1.5" style={{ width: '60px' }}>
                        <div className="w-full bg-gray-800/50 rounded-t flex flex-col justify-end relative group" style={{ height: '120px', maxWidth: '50px' }}>
                          <div
                            className="bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-500 hover:via-blue-400 hover:to-blue-300 cursor-pointer shadow-lg shadow-blue-500/30 w-full"
                            style={{ 
                              height: `${(day.hours / maxHours) * 100}%`,
                              minHeight: day.hours > 0 ? '3px' : '0'
                            }}
                          />
                          {day.hours > 0 && (
                            <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900/95 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-gray-700 whitespace-nowrap z-10 shadow-lg">
                              {day.hours.toFixed(1)}h
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium text-center">
                          {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                        </p>
                        <p className="text-xs text-white font-semibold">{day.hours.toFixed(1)}h</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Horas por tipo de trabajo */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Horas por Tipo de Trabajo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workTypeArray.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <Activity className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay datos de tipos de trabajo</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workTypeArray.map((type) => (
                          <div key={type.type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium capitalize">{type.type}</span>
                              <span className="text-white font-bold">{type.hours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                              <div
                                className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400 h-full rounded-full transition-all shadow-lg shadow-purple-500/30"
                                style={{ width: `${(type.hours / maxWorkTypeHours) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Bitácoras */}
                <Card className="bg-[#1a1a1a] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Top Bitácoras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hoursByBitacora.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                        <FileText className="h-12 w-12 mb-2 opacity-50" />
                        <p>No hay datos de bitácoras</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {hoursByBitacora.map((bitacora, index) => (
                          <div key={bitacora.title} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/20 border border-blue-400/50 flex items-center justify-center text-blue-300 font-bold text-xs shadow-lg">
                                  {index + 1}
                                </div>
                                <span className="text-white font-medium">{bitacora.title}</span>
                              </div>
                              <span className="text-white font-bold">{bitacora.hours.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-gray-700/50">
                              <div
                                className="bg-gradient-to-r from-green-600 via-green-500 to-green-400 h-full rounded-full transition-all shadow-lg shadow-green-500/30"
                                style={{ width: `${(bitacora.hours / maxBitacoraHours) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lista de bitácoras */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Todas las Bitácoras</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bitacoras.map((bitacora) => (
                      <Card
                        key={bitacora.id}
                        className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-all cursor-pointer"
                        onClick={() => router.push(`/bitacoras/${bitacora.id}`)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-semibold">{bitacora.title}</h3>
                            {bitacora.avatar && (
                              <span className="text-xs text-blue-400 font-bold">
                                Nivel {bitacora.avatar.level}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Horas</p>
                              <p className="text-white font-bold">{bitacora.stats.totalHours.toFixed(1)}h</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Tareas</p>
                              <p className="text-white font-bold">{bitacora.stats.totalTasks}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-400 text-xs">Sesiones</p>
                              <p className="text-white font-bold">{bitacora.stats.totalSessions}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
