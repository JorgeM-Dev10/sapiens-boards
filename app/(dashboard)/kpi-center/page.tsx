"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  BarChart3, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  Activity
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
  const [activeView, setActiveView] = useState<"OVERVIEW" | "PERSON" | "CLIENT">("OVERVIEW")
  const [sessions, setSessions] = useState<WorkSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedBoardId, setSelectedBoardId] = useState<string>("")
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [boards, setBoards] = useState<Array<{ id: string; title: string }>>([])
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
    fetchBoards()
  }, [selectedUserId, selectedBoardId])

  useEffect(() => {
    fetchUsers()
  }, [sessions])

  useEffect(() => {
    calculateKPIs()
  }, [sessions])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (selectedUserId) params.append("userId", selectedUserId)
      if (selectedBoardId) params.append("boardId", selectedBoardId)
      
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

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards")
      if (response.ok) {
        const data = await response.json()
        setBoards(data)
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
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
              onClick={() => setActiveView("PERSON")}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeView === "PERSON"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              Por Persona
            </button>
            <button
              onClick={() => setActiveView("CLIENT")}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeView === "CLIENT"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Por Cliente
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex gap-4">
            {activeView === "PERSON" && (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-[250px] bg-[#1a1a1a] border-gray-800 text-white">
                  <SelectValue placeholder="Seleccionar persona" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-800">
                  <SelectItem value="">Todas las personas</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeView === "CLIENT" && (
              <Select value={selectedBoardId} onValueChange={setSelectedBoardId}>
                <SelectTrigger className="w-[250px] bg-[#1a1a1a] border-gray-800 text-white">
                  <SelectValue placeholder="Seleccionar cliente/board" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-800">
                  <SelectItem value="">Todos los clientes</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.title}
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
              {activeView === "PERSON" && (
                <PersonView 
                  sessions={sessions || []} 
                  selectedUserId={selectedUserId}
                  users={users}
                />
              )}
              {activeView === "CLIENT" && (
                <ClientView 
                  sessions={sessions || []} 
                  selectedBoardId={selectedBoardId}
                  boards={boards}
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
              <Building2 className="h-12 w-12 mb-2 opacity-50" />
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

// Vista por Persona
function PersonView({ 
  sessions, 
  selectedUserId,
  users 
}: { 
  sessions: WorkSession[]
  selectedUserId: string
  users: Array<{ id: string; name: string }>
}) {
  const filteredSessions = selectedUserId
    ? sessions.filter(s => s && s.userId === selectedUserId)
    : sessions.filter(s => s != null)

  const userStats = new Map<string, {
    userId: string
    userName: string
    totalHours: number
    tasksCompleted: number
    sessionsCount: number
    boards: Map<string, { boardId: string; boardTitle: string; hours: number }>
  }>()

  filteredSessions.forEach(s => {
    if (!s || !s.user || !s.board) return
    
    const stats = userStats.get(s.userId) || {
      userId: s.userId,
      userName: s.user.name || "Usuario desconocido",
      totalHours: 0,
      tasksCompleted: 0,
      sessionsCount: 0,
      boards: new Map()
    }
    
    stats.totalHours += (s.durationMinutes || 0) / 60
    stats.tasksCompleted += s.tasksCompleted || 0
    stats.sessionsCount += 1

    const boardHours = stats.boards.get(s.boardId) || {
      boardId: s.boardId,
      boardTitle: s.board.title || "Board desconocido",
      hours: 0
    }
    boardHours.hours += (s.durationMinutes || 0) / 60
    stats.boards.set(s.boardId, boardHours)

    userStats.set(s.userId, stats)
  })

  const statsArray = Array.from(userStats.values())

  if (statsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="h-16 w-16 mb-4 opacity-50" />
        <p>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {statsArray.map((stats) => (
        <Card key={stats.userId} className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{stats.userName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Horas Totales</p>
                <p className="text-2xl font-bold text-white">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tareas Completadas</p>
                <p className="text-2xl font-bold text-white">{stats.tasksCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Sesiones</p>
                <p className="text-2xl font-bold text-white">{stats.sessionsCount}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-3">Tiempo por Cliente/Proyecto</p>
              <div className="space-y-2">
                {Array.from(stats.boards.values())
                  .sort((a, b) => b.hours - a.hours)
                  .map((board) => (
                    <div key={board.boardId} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                      <p className="text-white text-sm">{board.boardTitle}</p>
                      <p className="text-white font-medium">{board.hours.toFixed(1)}h</p>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Vista por Cliente
function ClientView({ 
  sessions, 
  selectedBoardId,
  boards 
}: { 
  sessions: WorkSession[]
  selectedBoardId: string
  boards: Array<{ id: string; title: string }>
}) {
  const filteredSessions = selectedBoardId
    ? sessions.filter(s => s && s.boardId === selectedBoardId)
    : sessions.filter(s => s != null)

  const boardStats = new Map<string, {
    boardId: string
    boardTitle: string
    totalHours: number
    tasksCompleted: number
    sessionsCount: number
    people: Map<string, { userId: string; userName: string; hours: number }>
  }>()

  filteredSessions.forEach(s => {
    if (!s || !s.user || !s.board) return
    
    const stats = boardStats.get(s.boardId) || {
      boardId: s.boardId,
      boardTitle: s.board.title || "Board desconocido",
      totalHours: 0,
      tasksCompleted: 0,
      sessionsCount: 0,
      people: new Map()
    }
    
    stats.totalHours += (s.durationMinutes || 0) / 60
    stats.tasksCompleted += s.tasksCompleted || 0
    stats.sessionsCount += 1

    const personHours = stats.people.get(s.userId) || {
      userId: s.userId,
      userName: s.user.name || "Usuario desconocido",
      hours: 0
    }
    personHours.hours += (s.durationMinutes || 0) / 60
    stats.people.set(s.userId, personHours)

    boardStats.set(s.boardId, stats)
  })

  const statsArray = Array.from(boardStats.values()).sort((a, b) => b.totalHours - a.totalHours)

  if (statsArray.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Building2 className="h-16 w-16 mb-4 opacity-50" />
        <p>No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {statsArray.map((stats) => (
        <Card key={stats.boardId} className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{stats.boardTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Horas Totales</p>
                <p className="text-2xl font-bold text-white">{stats.totalHours.toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Tareas Completadas</p>
                <p className="text-2xl font-bold text-white">{stats.tasksCompleted}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Sesiones</p>
                <p className="text-2xl font-bold text-white">{stats.sessionsCount}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-3">Horas por Persona</p>
              <div className="space-y-2">
                {Array.from(stats.people.values())
                  .sort((a, b) => b.hours - a.hours)
                  .map((person) => (
                    <div key={person.userId} className="flex items-center justify-between p-2 bg-gray-900 rounded">
                      <p className="text-white text-sm">{person.userName}</p>
                      <p className="text-white font-medium">{person.hours.toFixed(1)}h</p>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

