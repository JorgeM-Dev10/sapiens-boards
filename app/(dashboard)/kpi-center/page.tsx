"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  BarChart3, 
  Users, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Activity,
  FileText,
  Briefcase
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface WorkSession {
  id: string
  userId: string
  boardId: string
  listId: string | null
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  tasksCompleted: number
  description: string | null
  workType: string
  user: {
    id: string
    name: string
    email: string
  }
  board: {
    id: string
    title: string
  }
  list: {
    id: string
    title: string
  } | null
}

interface KPIData {
  totalHoursToday: number
  totalHoursWeek: number
  totalHoursMonth: number
  tasksCompletedToday: number
  tasksCompletedWeek: number
  averageHoursPerPerson: number
  topClients: Array<{ boardId: string; boardTitle: string; hours: number }>
  hoursByPerson: Array<{ userId: string; userName: string; hours: number }>
  hoursByDay: Array<{ date: string; hours: number }>
  hoursByWorkType: Array<{ type: string; hours: number }>
}

export default function KPICenterPage() {
  const { toast } = useToast()
  const [activeView, setActiveView] = useState<"OVERVIEW" | "BITACORAS">("OVERVIEW")
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [kpiData, setKpiData] = useState<KPIData>({
    totalHoursToday: 0,
    totalHoursWeek: 0,
    totalHoursMonth: 0,
    tasksCompletedToday: 0,
    tasksCompletedWeek: 0,
    averageHoursPerPerson: 0,
    topClients: [],
    hoursByPerson: [],
    hoursByDay: [],
    hoursByWorkType: [],
  })

  useEffect(() => {
    fetchSessions()
  }, [selectedUserId])

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      fetchUsers()
    } else {
      setUsers([])
    }
  }, [sessions])

  useEffect(() => {
    calculateKPIs()
  }, [sessions])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedUserId) params.append("userId", selectedUserId)
      
      // Últimos 30 días por defecto
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      params.append("startDate", startDate.toISOString())
      params.append("endDate", endDate.toISOString())

      const response = await fetch(`/api/work-sessions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las sesiones",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      // Obtener usuarios únicos de las sesiones
      const uniqueUsers = new Map<string, { id: string; name: string }>()
      if (sessions && sessions.length > 0) {
        sessions.forEach(s => {
          if (s && s.user && s.userId && !uniqueUsers.has(s.userId)) {
            uniqueUsers.set(s.userId, {
              id: s.userId,
              name: s.user.name || "Usuario desconocido"
            })
          }
        })
      }
      setUsers(Array.from(uniqueUsers.values()))
    } catch (error) {
      console.error("Error fetching users:", error)
      setUsers([])
    }
  }


  const calculateKPIs = () => {
    if (!sessions || sessions.length === 0) {
      setKpiData({
        totalHoursToday: 0,
        totalHoursWeek: 0,
        totalHoursMonth: 0,
        tasksCompletedToday: 0,
        tasksCompletedWeek: 0,
        averageHoursPerPerson: 0,
        topClients: [],
        hoursByPerson: [],
        hoursByDay: [],
        hoursByWorkType: [],
      })
      return
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Filtrar sesiones válidas
    const validSessions = sessions.filter(s => s && s.date && s.durationMinutes != null)
    
    const todaySessions = validSessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= today
    })

    const weekSessions = validSessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= weekAgo
    })

    const monthSessions = validSessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= monthAgo
    })

    // Calcular horas
    const totalHoursToday = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60
    const totalHoursWeek = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60
    const totalHoursMonth = monthSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60

    // Tareas completadas
    const tasksCompletedToday = todaySessions.reduce((sum, s) => sum + s.tasksCompleted, 0)
    const tasksCompletedWeek = weekSessions.reduce((sum, s) => sum + s.tasksCompleted, 0)

    // Horas por persona
    const hoursByPersonMap = new Map<string, { userId: string; userName: string; hours: number }>()
    validSessions.forEach(s => {
      if (!s.user) return
      const hours = (s.durationMinutes || 0) / 60
      const existing = hoursByPersonMap.get(s.userId)
      if (existing) {
        existing.hours += hours
      } else {
        hoursByPersonMap.set(s.userId, {
          userId: s.userId,
          userName: s.user.name || "Usuario desconocido",
          hours
        })
      }
    })
    const hoursByPerson = Array.from(hoursByPersonMap.values()).sort((a, b) => b.hours - a.hours)

    // Promedio de horas por persona
    const averageHoursPerPerson = hoursByPerson.length > 0
      ? hoursByPerson.reduce((sum, p) => sum + p.hours, 0) / hoursByPerson.length
      : 0

    // Top clientes/boards
    const hoursByBoardMap = new Map<string, { boardId: string; boardTitle: string; hours: number }>()
    validSessions.forEach(s => {
      if (!s.board) return
      const hours = (s.durationMinutes || 0) / 60
      const existing = hoursByBoardMap.get(s.boardId)
      if (existing) {
        existing.hours += hours
      } else {
        hoursByBoardMap.set(s.boardId, {
          boardId: s.boardId,
          boardTitle: s.board.title || "Board desconocido",
          hours
        })
      }
    })
    const topClients = Array.from(hoursByBoardMap.values())
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5)

    // Horas por día (últimos 7 días)
    const hoursByDayMap = new Map<string, number>()
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    })
    last7Days.forEach(date => hoursByDayMap.set(date, 0))
    
    weekSessions.forEach(s => {
      if (!s || !s.date) return
      const date = new Date(s.date).toISOString().split('T')[0]
      const existing = hoursByDayMap.get(date) || 0
      hoursByDayMap.set(date, existing + (s.durationMinutes || 0) / 60)
    })
    const hoursByDay = Array.from(hoursByDayMap.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Horas por tipo de trabajo
    const hoursByWorkTypeMap = new Map<string, number>()
    validSessions.forEach(s => {
      const hours = (s.durationMinutes || 0) / 60
      const workType = s.workType || "dev"
      const existing = hoursByWorkTypeMap.get(workType) || 0
      hoursByWorkTypeMap.set(workType, existing + hours)
    })
    const hoursByWorkType = Array.from(hoursByWorkTypeMap.entries())
      .map(([type, hours]) => ({ type, hours }))
      .sort((a, b) => b.hours - a.hours)

    setKpiData({
      totalHoursToday,
      totalHoursWeek,
      totalHoursMonth,
      tasksCompletedToday,
      tasksCompletedWeek,
      averageHoursPerPerson,
      topClients,
      hoursByPerson,
      hoursByDay,
      hoursByWorkType,
    })
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">KPI Center</h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveView("OVERVIEW")}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeView === "OVERVIEW"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Resumen General
            </button>
            <button
              onClick={() => setActiveView("BITACORAS")}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeView === "BITACORAS"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              Bitácoras
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex gap-4">
            {activeView === "BITACORAS" && (
              <Select value={selectedUserId || ""} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[250px] bg-[#1a1a1a] border-gray-800 text-white">
                  <SelectValue placeholder="Seleccionar persona" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-800">
                  <SelectItem value="">Todas las personas</SelectItem>
                  {users && users.length > 0 && users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || "Usuario sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Cargando datos...</p>
            </div>
          ) : (
            <>
              {activeView === "OVERVIEW" && (
                <OverviewView kpiData={kpiData} />
              )}
              {activeView === "BITACORAS" && (
                <BitacorasView 
                  sessions={sessions || []} 
                  selectedUserId={selectedUserId}
                  users={users}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Vista de Resumen General
function OverviewView({ kpiData }: { kpiData: KPIData }) {
  const hasData = kpiData.totalHoursWeek > 0 || kpiData.topClients.length > 0 || kpiData.hoursByPerson.length > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <BarChart3 className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg mb-2">No hay datos aún</p>
        <p className="text-sm">Registra jornadas de trabajo desde los boards para ver estadísticas aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Horas Hoy</p>
                <p className="text-2xl font-bold text-white">{kpiData.totalHoursToday.toFixed(1)}h</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Horas Esta Semana</p>
                <p className="text-2xl font-bold text-white">{kpiData.totalHoursWeek.toFixed(1)}h</p>
              </div>
              <Calendar className="h-8 w-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tareas Completadas</p>
                <p className="text-2xl font-bold text-white">{kpiData.tasksCompletedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-1">Promedio por Persona</p>
                <p className="text-2xl font-bold text-white">{kpiData.averageHoursPerPerson.toFixed(1)}h</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Top 5 Clientes/Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          {kpiData.topClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Briefcase className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay datos de clientes aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpiData.topClients.map((client, index) => (
                <div key={client.boardId} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{client.boardTitle}</p>
                      <p className="text-xs text-gray-400">{client.hours.toFixed(1)} horas</p>
                    </div>
                  </div>
                  <div className="w-32 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${kpiData.topClients[0]?.hours > 0 ? (client.hours / kpiData.topClients[0].hours) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horas por Persona */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Horas por Persona (Últimos 30 días)</CardTitle>
        </CardHeader>
        <CardContent>
          {kpiData.hoursByPerson.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Users className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay datos de personas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpiData.hoursByPerson.slice(0, 10).map((person) => (
                <div key={person.userId} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <p className="text-white font-medium">{person.userName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white font-bold">{person.hours.toFixed(1)}h</p>
                    <div className="w-32 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(person.hours / (kpiData.hoursByPerson[0]?.hours || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horas por Día */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Horas por Día (Últimos 7 días)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {kpiData.hoursByDay.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gray-800 rounded-t flex flex-col justify-end" style={{ height: '200px' }}>
                  <div
                    className="bg-blue-500 rounded-t transition-all"
                    style={{ 
                      height: `${(day.hours / Math.max(...kpiData.hoursByDay.map(d => d.hours), 1)) * 100}%`,
                      minHeight: day.hours > 0 ? '4px' : '0'
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  {new Date(day.date).toLocaleDateString('es-ES', { weekday: 'short' })}
                </p>
                <p className="text-xs text-white font-medium">{day.hours.toFixed(1)}h</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Horas por Tipo de Trabajo */}
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Horas por Tipo de Trabajo</CardTitle>
        </CardHeader>
        <CardContent>
          {kpiData.hoursByWorkType.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Activity className="h-12 w-12 mb-2 opacity-50" />
              <p>No hay datos de tipos de trabajo aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpiData.hoursByWorkType.map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-purple-400" />
                    <p className="text-white font-medium capitalize">{type.type}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white font-bold">{type.hours.toFixed(1)}h</p>
                    <div className="w-32 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${(type.hours / (kpiData.hoursByWorkType[0]?.hours || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Vista de Bitácoras
function BitacorasView({ 
  sessions, 
  selectedUserId,
  users 
}: { 
  sessions: WorkSession[]
  selectedUserId: string
  users: Array<{ id: string; name: string }>
}) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <p>No hay sesiones de trabajo registradas</p>
        <p className="text-sm mt-2">Registra jornadas desde los boards para ver bitácoras</p>
      </div>
    )
  }

  const filteredSessions = selectedUserId
    ? sessions.filter(s => s && s.userId === selectedUserId)
    : sessions.filter(s => s != null)

  // Agrupar sesiones por usuario
  const userSessionsMap = new Map<string, WorkSession[]>()
  filteredSessions.forEach(s => {
    if (!s || !s.user) return
    const userSessions = userSessionsMap.get(s.userId) || []
    userSessions.push(s)
    userSessionsMap.set(s.userId, userSessions)
  })

  // Ordenar sesiones por fecha (más recientes primero)
  userSessionsMap.forEach((sessions, userId) => {
    sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  })

  const usersArray = Array.from(userSessionsMap.keys()).map(userId => {
    const sessions = userSessionsMap.get(userId) || []
    const firstSession = sessions[0]
    return {
      userId,
      userName: firstSession?.user?.name || "Usuario desconocido",
      sessions
    }
  })

  if (usersArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <FileText className="h-16 w-16 mb-4 opacity-50" />
        <p>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {usersArray.map(({ userId, userName, sessions: userSessions }) => {
        // Calcular estadísticas del usuario
        const totalHours = userSessions.reduce((sum, s) => sum + (s.durationMinutes || 0) / 60, 0)
        const totalTasks = userSessions.reduce((sum, s) => sum + (s.tasksCompleted || 0), 0)
        
        // Agrupar por proyecto
        const projectsMap = new Map<string, { boardId: string; boardTitle: string; hours: number; sessions: WorkSession[] }>()
        userSessions.forEach(s => {
          if (!s.board) return
          const project = projectsMap.get(s.boardId) || {
            boardId: s.boardId,
            boardTitle: s.board.title || "Proyecto desconocido",
            hours: 0,
            sessions: []
          }
          project.hours += (s.durationMinutes || 0) / 60
          project.sessions.push(s)
          projectsMap.set(s.boardId, project)
        })

        // Agrupar por día
        const daysMap = new Map<string, { date: string; hours: number; sessions: WorkSession[] }>()
        userSessions.forEach(s => {
          if (!s.date) return
          const dateStr = new Date(s.date).toISOString().split('T')[0]
          const day = daysMap.get(dateStr) || {
            date: dateStr,
            hours: 0,
            sessions: []
          }
          day.hours += (s.durationMinutes || 0) / 60
          day.sessions.push(s)
          daysMap.set(dateStr, day)
        })

        const projects = Array.from(projectsMap.values()).sort((a, b) => b.hours - a.hours)
        const days = Array.from(daysMap.values()).sort((a, b) => b.date.localeCompare(a.date))

        return (
          <Card key={userId} className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {userName}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {totalHours.toFixed(1)}h totales
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {totalTasks} tareas
                  </span>
                  <span>{userSessions.length} sesiones</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Proyectos trabajados */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Proyectos Trabajados
                </p>
                <div className="space-y-2">
                  {projects.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay proyectos registrados</p>
                  ) : (
                    projects.map((project) => (
                      <div key={project.boardId} className="p-3 bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">{project.boardTitle}</p>
                          <p className="text-white font-bold">{project.hours.toFixed(1)}h</p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {project.sessions.length} sesión{project.sessions.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actividad por día */}
              <div>
                <p className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Actividad por Día
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {days.length === 0 ? (
                    <p className="text-gray-500 text-sm">No hay actividad registrada</p>
                  ) : (
                    days.map((day) => (
                      <div key={day.date} className="p-3 bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">
                            {new Date(day.date).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-white font-bold">{day.hours.toFixed(1)}h</p>
                        </div>
                        <div className="space-y-1 mt-2">
                          {day.sessions.map((session) => (
                            <div key={session.id} className="text-xs text-gray-400 pl-2 border-l-2 border-gray-700">
                              <div className="flex items-center justify-between">
                                <span>
                                  {session.startTime} - {session.endTime}
                                </span>
                                <span className="flex items-center gap-2">
                                  <span className="capitalize">{session.workType}</span>
                                  <span>•</span>
                                  <span>{(session.durationMinutes || 0) / 60}h</span>
                                </span>
                              </div>
                              {session.board && (
                                <div className="text-gray-500 mt-1">
                                  {session.board.title}
                                </div>
                              )}
                              {session.description && (
                                <div className="text-gray-400 mt-1 italic">
                                  {session.description}
                                </div>
                              )}
                              {session.tasksCompleted > 0 && (
                                <div className="text-green-400 mt-1">
                                  ✓ {session.tasksCompleted} tarea{session.tasksCompleted !== 1 ? 's' : ''} completada{session.tasksCompleted !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


