"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Calendar as CalendarIcon, Clock, CheckCircle, FileText, TrendingUp, Award, Pencil, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
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
import { XPNotification } from "@/components/gamification/xp-notification"

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
    rank: string
    avatarImageUrl: string | null
  } | null
  workSessions: WorkSession[]
}

export default function BitacoraPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacora, setBitacora] = useState<Bitacora | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistroDialogOpen, setIsRegistroDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null)
  const [xpNotification, setXpNotification] = useState<{
    xpGained: number
    totalXP: number
    levelUp: boolean
    rankUp: string | null
  } | null>(null)
  const [registroForm, setRegistroForm] = useState({
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

  const handleSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!registroForm.startTime || !registroForm.endTime) {
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
          date: registroForm.date,
          startTime: registroForm.startTime,
          endTime: registroForm.endTime,
          tasksCompleted: registroForm.tasksCompleted || 0,
          description: registroForm.description || null,
          workType: registroForm.workType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Calcular si hubo subida de nivel o rango
        const levelUp = data.newLevel > data.previousLevel
        const rankUp = data.newRank !== data.previousRank ? data.newRank : null
        
        // Mostrar notificación de XP
        if (data.xpGained > 0) {
          setXpNotification({
            xpGained: data.xpGained,
            totalXP: data.previousXP + data.xpGained,
            levelUp,
            rankUp,
          })
        }
        
        toast({
          title: "Éxito",
          description: `Registro guardado! +${data.xpGained || 0} XP ganados`,
        })
        setIsRegistroDialogOpen(false)
        setRegistroForm({
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
          description: error.error || "Error al registrar el trabajo",
        })
      }
    } catch (error) {
      console.error("Error submitting registro:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al registrar el trabajo",
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

  // Función para obtener la URL de la imagen del avatar según el rango
  const getAvatarImageUrl = (rank: string, avatarImageUrl: string | null): string | null => {
    // Si hay una URL configurada, usarla
    if (avatarImageUrl) return avatarImageUrl
    
    // Si no hay URL, retornar null para usar emoji como fallback
    return null
  }

  // Función para obtener emoji como fallback cuando no hay imagen
  const getAvatarEmoji = (rank: string) => {
    if (rank === "Leyenda") return "👑"
    if (rank === "Épico") return "⭐"
    if (rank === "Avanzado") return "🔥"
    if (rank === "Intermedio") return "💪"
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
      {xpNotification && (
        <XPNotification
          xpGained={xpNotification.xpGained}
          totalXP={xpNotification.totalXP}
          levelUp={xpNotification.levelUp}
          rankUp={xpNotification.rankUp || undefined}
          onClose={() => setXpNotification(null)}
        />
      )}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          {/* Sistema de XP - Documentación */}
          <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl flex-shrink-0">
                  ⭐
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg mb-2">Sistema de Experiencia (XP)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-black/40 rounded-lg p-3 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold">Por Hora</span>
                      </div>
                      <p className="text-gray-300">1 XP por cada hora trabajada</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-green-400 font-semibold">Por Tarea</span>
                      </div>
                      <p className="text-gray-300">10 XP por cada tarea completada</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3 border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-purple-400" />
                        <span className="text-purple-400 font-semibold">Por Sesión</span>
                      </div>
                      <p className="text-gray-300">5 XP por cada registro de trabajo</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400">
                      <span className="text-yellow-400 font-semibold">Niveles:</span> Principiante (0-499 XP) • Intermedio (500-1999 XP) • Avanzado (2000-4999 XP) • Épico (5000-9999 XP) • Leyenda (10000+ XP)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Header con Avatar */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className={`relative h-32 w-32 rounded-full border-4 flex items-center justify-center overflow-hidden shadow-2xl ${bitacora.avatar ? getAvatarColor(bitacora.avatar.avatarStyle) : 'text-gray-400 border-gray-400'}`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 30px rgba(59, 130, 246, 0.8)",
                    "0 0 20px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{ 
                  boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  scale: { type: "spring", stiffness: 300 }
                }}
              >
                {bitacora.avatar ? (
                  (() => {
                    const imageUrl = getAvatarImageUrl(bitacora.avatar.rank, bitacora.avatar.avatarImageUrl)
                    return imageUrl ? (
                      <>
                        <motion.img 
                          src={imageUrl} 
                          alt={bitacora.avatar.rank}
                          className="w-full h-full object-contain p-1.5"
                          animate={{ 
                            scale: [1, 1.03, 1],
                            opacity: [1, 0.95, 1]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        {/* Efecto de brillo rotativo */}
                        <motion.div 
                          className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/30 to-transparent pointer-events-none"
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                        />
                      </>
                    ) : (
                      <span className="text-4xl">{getAvatarEmoji(bitacora.avatar.rank)}</span>
                    )
                  })()
                ) : (
                  <span className="text-4xl">🌱</span>
                )}
              </motion.div>
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
            <Dialog open={isRegistroDialogOpen} onOpenChange={setIsRegistroDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar Trabajo
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Trabajo Diario</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Registra tu trabajo del día
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitRegistro}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Fecha *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={registroForm.date}
                        onChange={(e) => setRegistroForm({ ...registroForm, date: e.target.value })}
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
                          value={registroForm.startTime}
                          onChange={(e) => setRegistroForm({ ...registroForm, startTime: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime">Hora Fin *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={registroForm.endTime}
                          onChange={(e) => setRegistroForm({ ...registroForm, endTime: e.target.value })}
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
                        value={registroForm.tasksCompleted}
                        onChange={(e) => setRegistroForm({ ...registroForm, tasksCompleted: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workType">Tipo de Trabajo</Label>
                      <Select
                        value={registroForm.workType}
                        onValueChange={(value) => setRegistroForm({ ...registroForm, workType: value })}
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
                        value={registroForm.description}
                        onChange={(e) => setRegistroForm({ ...registroForm, description: e.target.value })}
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
                      onClick={() => setIsRegistroDialogOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? "Guardando..." : "Guardar Registro"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Dialog de Edición */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Editar Registro de Trabajo</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Modifica los datos del registro
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  if (!editingSession) return
                  
                  setIsSubmitting(true)
                  try {
                    const response = await fetch(`/api/work-sessions/${editingSession.id}`, {
                      method: "PATCH",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        date: registroForm.date,
                        startTime: registroForm.startTime,
                        endTime: registroForm.endTime,
                        tasksCompleted: registroForm.tasksCompleted || 0,
                        description: registroForm.description || null,
                        workType: registroForm.workType,
                      }),
                    })

                    if (response.ok) {
                      toast({
                        title: "Éxito",
                        description: "Registro actualizado",
                      })
                      setIsEditDialogOpen(false)
                      setEditingSession(null)
                      fetchBitacora()
                    } else {
                      const error = await response.json()
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error.error || "Error al actualizar el registro",
                      })
                    }
                  } catch (error) {
                    console.error("Error updating registro:", error)
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Error al actualizar el registro",
                    })
                  } finally {
                    setIsSubmitting(false)
                  }
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-date">Fecha *</Label>
                      <Input
                        id="edit-date"
                        type="date"
                        value={registroForm.date}
                        onChange={(e) => setRegistroForm({ ...registroForm, date: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-startTime">Hora Inicio *</Label>
                        <Input
                          id="edit-startTime"
                          type="time"
                          value={registroForm.startTime}
                          onChange={(e) => setRegistroForm({ ...registroForm, startTime: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-endTime">Hora Fin *</Label>
                        <Input
                          id="edit-endTime"
                          type="time"
                          value={registroForm.endTime}
                          onChange={(e) => setRegistroForm({ ...registroForm, endTime: e.target.value })}
                          className="bg-gray-900 border-gray-700 text-white"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="edit-tasksCompleted">Tareas Completadas</Label>
                      <Input
                        id="edit-tasksCompleted"
                        type="number"
                        min="0"
                        value={registroForm.tasksCompleted}
                        onChange={(e) => setRegistroForm({ ...registroForm, tasksCompleted: parseInt(e.target.value) || 0 })}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-workType">Tipo de Trabajo</Label>
                      <Select
                        value={registroForm.workType}
                        onValueChange={(value) => setRegistroForm({ ...registroForm, workType: value })}
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
                      <Label htmlFor="edit-description">¿Qué trabajaste hoy? *</Label>
                      <Textarea
                        id="edit-description"
                        value={registroForm.description}
                        onChange={(e) => setRegistroForm({ ...registroForm, description: e.target.value })}
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
                      onClick={() => {
                        setIsEditDialogOpen(false)
                        setEditingSession(null)
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? "Guardando..." : "Guardar Cambios"}
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
                    <CardTitle className="text-white">Calendario de Registros</CardTitle>
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
                            <div className="flex-1">
                              <span className="text-white text-sm font-medium">
                                {session.startTime} - {session.endTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400 text-sm font-bold">
                                {(session.durationMinutes / 60).toFixed(1)}h
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                                onClick={() => {
                                  setEditingSession(session)
                                  setRegistroForm({
                                    date: session.date.split('T')[0],
                                    startTime: session.startTime,
                                    endTime: session.endTime,
                                    tasksCompleted: session.tasksCompleted,
                                    description: session.description || "",
                                    workType: session.workType,
                                  })
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                onClick={async () => {
                                  if (!confirm("¿Estás seguro de eliminar este registro?")) return
                                  try {
                                    const response = await fetch(`/api/work-sessions/${session.id}`, {
                                      method: "DELETE",
                                    })
                                    if (response.ok) {
                                      toast({
                                        title: "Éxito",
                                        description: "Registro eliminado",
                                      })
                                      fetchBitacora()
                                    } else {
                                      throw new Error("Error al eliminar")
                                    }
                                  } catch (error) {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: "No se pudo eliminar el registro",
                                    })
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                      <p>No hay registros para este día</p>
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setRegistroForm({
                            ...registroForm,
                            date: format(selectedDate, 'yyyy-MM-dd'),
                          })
                          setIsRegistroDialogOpen(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Registrar Trabajo
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

