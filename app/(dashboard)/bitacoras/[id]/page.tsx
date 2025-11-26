"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Calendar as CalendarIcon, Clock, CheckCircle, FileText, TrendingUp, Award } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface WorkSession {
  id: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  tasksCompleted: number
  description: string | null
  workType: string
  createdAt: string
}

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
  user: {
    id: string
    name: string
    email: string
  }
  avatar: {
    id: string
    level: number
    experience: number
    totalHours: number
    totalTasks: number
    totalSessions: number
    avatarStyle: string
  } | null
  workSessions: WorkSession[]
}

export default function BitacoraPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacora, setBitacora] = useState<Bitacora | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [commitForm, setCommitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "17:00",
    tasksCompleted: 0,
    description: "",
    workType: "dev",
  })

  useEffect(() => {
    fetchBitacora()
  }, [params.id])

  const fetchBitacora = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/bitacoras/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setBitacora(data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la bitácora",
        })
        router.push("/bitacoras")
      }
    } catch (error) {
      console.error("Error fetching bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la bitácora",
      })
      router.push("/bitacoras")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitCommit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!commitForm.startTime || !commitForm.endTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Las horas de inicio y fin son requeridas",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/work-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bitacoraBoardId: params.id,
          date: commitForm.date,
          startTime: commitForm.startTime,
          endTime: commitForm.endTime,
          tasksCompleted: commitForm.tasksCompleted || 0,
          description: commitForm.description || null,
          workType: commitForm.workType,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Commit registrado correctamente",
        })
        setIsCommitDialogOpen(false)
        setCommitForm({
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00",
          endTime: "17:00",
          tasksCompleted: 0,
          description: "",
          workType: "dev",
        })
        fetchBitacora()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al registrar el commit",
        })
      }
    } catch (error) {
      console.error("Error submitting commit:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al registrar el commit",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSessionsForDate = (date: Date) => {
    if (!bitacora) return []
    const dateStr = format(date, 'yyyy-MM-dd')
    return bitacora.workSessions.filter(s => {
      const sessionDate = format(parseISO(s.date), 'yyyy-MM-dd')
      return sessionDate === dateStr
    })
  }

  const getTotalHoursForDate = (date: Date) => {
    const sessions = getSessionsForDate(date)
    return sessions.reduce((sum, s) => sum + s.durationMinutes / 60, 0)
  }

  const getAvatarEmoji = (style: string, level: number) => {
    if (style === "legend") return "👑"
    if (style === "master") return "⭐"
    if (style === "expert") return "🔥"
    if (style === "advanced") return "💪"
    if (style === "intermediate") return "🚀"
    return "🌱"
  }

  const getAvatarColor = (style: string) => {
    if (style === "legend") return "text-purple-400 border-purple-400"
    if (style === "master") return "text-blue-400 border-blue-400"
    if (style === "expert") return "text-green-400 border-green-400"
    if (style === "advanced") return "text-yellow-400 border-yellow-400"
    if (style === "intermediate") return "text-orange-400 border-orange-400"
    return "text-gray-400 border-gray-400"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (!bitacora) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Bitácora no encontrada</p>
        </div>
      </div>
    )
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const selectedDateSessions = getSessionsForDate(selectedDate)
  const selectedDateHours = getTotalHoursForDate(selectedDate)

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Header con Avatar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-20 w-20 rounded-full border-4 flex items-center justify-center text-4xl ${bitacora.avatar ? getAvatarColor(bitacora.avatar.avatarStyle) : 'text-gray-400 border-gray-400'}`}>
                {bitacora.avatar ? getAvatarEmoji(bitacora.avatar.avatarStyle, bitacora.avatar.level) : "🌱"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{bitacora.title}</h1>
                {bitacora.description && (
                  <p className="text-gray-400 mt-1">{bitacora.description}</p>
                )}
                {bitacora.avatar && (
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-400">Nivel {bitacora.avatar.level}</span>
                    <span className={`font-bold ${getAvatarColor(bitacora.avatar.avatarStyle).split(' ')[0]}`}>
                      {bitacora.avatar.avatarStyle.toUpperCase()}
                    </span>
                    <span className="text-gray-400">{bitacora.avatar.experience} XP</span>
                  </div>
                )}
              </div>
            </div>
            <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Commit
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Commit Diario</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Registra tu trabajo del día
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitCommit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={commitForm.date}
                        onChange={(e) => setCommitForm({ ...commitForm, date: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startTime">Hora Inicio *</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={commitForm.startTime}
                          onChange={(e) => setCommitForm({ ...commitForm, startTime: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">Hora Fin *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={commitForm.endTime}
                          onChange={(e) => setCommitForm({ ...commitForm, endTime: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tasksCompleted">Tareas Completadas</Label>
                      <Input
                        id="tasksCompleted"
                        type="number"
                        min="0"
                        value={commitForm.tasksCompleted}
                        onChange={(e) => setCommitForm({ ...commitForm, tasksCompleted: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workType">Tipo de Trabajo</Label>
                      <Select
                        value={commitForm.workType}
                        onValueChange={(value) => setCommitForm({ ...commitForm, workType: value })}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-gray-800">
                          <SelectItem value="dev">Desarrollo</SelectItem>
                          <SelectItem value="diseño">Diseño</SelectItem>
                          <SelectItem value="ops">Operaciones</SelectItem>
                          <SelectItem value="calls">Llamadas/Reuniones</SelectItem>
                          <SelectItem value="testing">Testing</SelectItem>
                          <SelectItem value="documentation">Documentación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">¿Qué trabajaste hoy? *</Label>
                      <Textarea
                        id="description"
                        value={commitForm.description}
                        onChange={(e) => setCommitForm({ ...commitForm, description: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="Describe qué trabajaste durante esta sesión..."
                        rows={4}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsCommitDialogOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? "Guardando..." : "Guardar Commit"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Estadísticas */}
          {bitacora.avatar && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Horas Totales</p>
                      <p className="text-2xl font-bold text-white">{bitacora.avatar.totalHours.toFixed(1)}h</p>
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
                      <p className="text-2xl font-bold text-white">{bitacora.avatar.totalTasks}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Sesiones</p>
                      <p className="text-2xl font-bold text-white">{bitacora.avatar.totalSessions}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Experiencia</p>
                      <p className="text-2xl font-bold text-white">{bitacora.avatar.experience} XP</p>
                    </div>
                    <Award className="h-8 w-8 text-yellow-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendario */}
            <div className="lg:col-span-2">
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Calendario de Commits</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="text-white hover:bg-gray-800"
                      >
                        ←
                      </Button>
                      <span className="text-white font-medium min-w-[150px] text-center">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="text-white hover:bg-gray-800"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-sm text-gray-400 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day) => {
                      const hours = getTotalHoursForDate(day)
                      const hasSessions = getSessionsForDate(day).length > 0
                      const isSelected = isSameDay(day, selectedDate)
                      const isToday = isSameDay(day, new Date())

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            aspect-square p-2 rounded-lg border-2 transition-all
                            ${isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-gray-800 hover:border-gray-700'}
                            ${isToday ? 'ring-2 ring-green-500' : ''}
                            ${hasSessions ? 'bg-green-500/20' : 'bg-gray-900'}
                          `}
                        >
                          <div className="text-white text-sm font-medium">
                            {format(day, 'd')}
                          </div>
                          {hours > 0 && (
                            <div className="text-xs text-green-400 mt-1">
                              {hours.toFixed(1)}h
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detalles del día seleccionado */}
            <div>
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDateHours > 0 ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-900 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold">Total del día</span>
                          <span className="text-blue-400 font-bold">{selectedDateHours.toFixed(1)}h</span>
                        </div>
                      </div>
                      {selectedDateSessions.map((session) => (
                        <div key={session.id} className="p-3 bg-gray-900 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white text-sm font-medium">
                              {session.startTime} - {session.endTime}
                            </span>
                            <span className="text-blue-400 text-sm font-bold">
                              {(session.durationMinutes / 60).toFixed(1)}h
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mb-1 capitalize">
                            {session.workType}
                          </div>
                          {session.description && (
                            <div className="text-sm text-gray-300 mt-2">
                              {session.description}
                            </div>
                          )}
                          {session.tasksCompleted > 0 && (
                            <div className="text-xs text-green-400 mt-2">
                              ✓ {session.tasksCompleted} tarea{session.tasksCompleted !== 1 ? 's' : ''} completada{session.tasksCompleted !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No hay commits registrados para este día</p>
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setCommitForm({
                            ...commitForm,
                            date: format(selectedDate, 'yyyy-MM-dd'),
                          })
                          setIsCommitDialogOpen(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Commit
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

