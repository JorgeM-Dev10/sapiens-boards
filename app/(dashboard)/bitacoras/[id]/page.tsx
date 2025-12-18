"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  ArrowLeft,
  Clock,
  CheckCircle,
  Award,
  FileText,
  Calendar
} from "lucide-react"
import { formatDate, calculateTaskXP } from "@/lib/utils"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  hours: number | null
  difficulty: string | null
  dueDate: Date | null
  createdAt: Date
  tags: {
    tag: {
      id: string
      name: string
      color: string
    }
  }[]
}

interface BitacoraDetail {
  id: string
  title: string
  description: string | null
  image: string | null
  tasks: Task[]
  stats: {
    totalHours: number
    totalTasks: number
    totalXP: number
  }
  avatar: {
    level: number
    experience: number
    avatarStyle: string
  }
}

export default function BitacoraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [bitacora, setBitacora] = useState<BitacoraDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchBitacora(params.id as string)
    }
  }, [params.id])

  const fetchBitacora = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/bitacoras/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBitacora(data)
      } else {
        throw new Error("Error al cargar bitácora")
      }
    } catch (error) {
      console.error("Error fetching bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la bitácora",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyLabel = (difficulty: string | null) => {
    if (difficulty === "FACIL") return "Fácil"
    if (difficulty === "MEDIA") return "Media"
    if (difficulty === "DIFICIL") return "Difícil"
    return "Sin dificultad"
  }

  const getDifficultyColor = (difficulty: string | null) => {
    if (difficulty === "FACIL") return "bg-green-500/20 text-green-400 border-green-500/30"
    if (difficulty === "MEDIA") return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    if (difficulty === "DIFICIL") return "bg-red-500/20 text-red-400 border-red-500/30"
    return "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Cargando bitácora...</p>
        </div>
      </div>
    )
  }

  if (!bitacora) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 mb-4">Bitácora no encontrada</p>
            <Button
              onClick={() => router.push("/bitacoras")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Bitácoras
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <Button
            onClick={() => router.push("/bitacoras")}
            variant="ghost"
            className="mb-6 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Bitácoras
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{bitacora.title}</h1>
            {bitacora.description && (
              <p className="text-gray-400">{bitacora.description}</p>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Horas Totales</p>
                    <p className="text-white text-2xl font-bold">{bitacora.stats.totalHours.toFixed(1)}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Tareas</p>
                    <p className="text-white text-2xl font-bold">{bitacora.stats.totalTasks}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">XP Total</p>
                    <p className="text-white text-2xl font-bold">{bitacora.stats.totalXP}</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Tareas */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Tareas</h2>
            {bitacora.tasks.length === 0 ? (
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-400">No hay tareas en esta bitácora</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bitacora.tasks.map((task) => {
                  const taskXP = calculateTaskXP(task.hours, task.difficulty)
                  return (
                    <Card
                      key={task.id}
                      className={`bg-[#1a1a1a] border-gray-800 ${
                        task.status === "completed" ? "border-green-500/30" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-white font-semibold">{task.title}</h3>
                              {task.status === "completed" && (
                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                  Completada
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-gray-400 text-sm mb-3">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {task.hours && (
                                <div className="flex items-center gap-1 text-xs text-blue-400">
                                  <Clock className="h-3 w-3" />
                                  {task.hours}h
                                </div>
                              )}
                              {task.difficulty && (
                                <span className={`px-2 py-1 text-xs rounded border ${getDifficultyColor(task.difficulty)}`}>
                                  {getDifficultyLabel(task.difficulty)}
                                </span>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </div>
                              )}
                              {taskXP > 0 && (
                                <div className="flex items-center gap-1 text-xs text-yellow-400 font-semibold">
                                  <Award className="h-3 w-3" />
                                  {taskXP} XP
                                </div>
                              )}
                            </div>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.map(({ tag }) => (
                                  <span
                                    key={tag.id}
                                    className="px-2 py-1 text-xs rounded"
                                    style={{
                                      backgroundColor: tag.color + "20",
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



