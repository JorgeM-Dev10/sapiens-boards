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
  Award
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
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
}

export default function KPICenterPage() {
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

  const getAvatarEmoji = (style: string) => {
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

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              KPI Center
            </h1>
            <Button
              onClick={() => router.push("/bitacoras")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver Todas las Bitácoras
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Cargando bitácoras...</p>
            </div>
          ) : bitacoras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">No tienes bitácoras aún</p>
              <p className="text-sm mb-4">Crea bitácoras para registrar tu trabajo diario y ver tus estadísticas</p>
              <Button
                onClick={() => router.push("/bitacoras")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear Primera Bitácora
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bitacoras.map((bitacora) => (
                <Card
                  key={bitacora.id}
                  className="bg-[#1a1a1a] border-gray-800 hover:border-blue-500 transition-all cursor-pointer"
                  onClick={() => router.push(`/bitacoras/${bitacora.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {bitacora.avatar && (
                        <div className={`h-12 w-12 rounded-full border-4 flex items-center justify-center text-2xl ${getAvatarColor(bitacora.avatar.avatarStyle)}`}>
                          {getAvatarEmoji(bitacora.avatar.avatarStyle)}
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {bitacora.title}
                        </CardTitle>
                        {bitacora.description && (
                          <p className="text-gray-400 text-sm mt-1">{bitacora.description}</p>
                        )}
                      </div>
                    </div>
                    {bitacora.avatar && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-semibold">Nivel {bitacora.avatar.level}</span>
                          <span className={`text-sm font-bold ${getAvatarColor(bitacora.avatar.avatarStyle).split(' ')[0]}`}>
                            {bitacora.avatar.avatarStyle.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((bitacora.avatar.experience % 1000) / 10, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{bitacora.avatar.experience} XP</p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400 mb-1">Horas</p>
                        <p className="text-white font-bold text-lg">{bitacora.stats.totalHours.toFixed(1)}h</p>
                      </div>
                      <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400 mb-1">Tareas</p>
                        <p className="text-white font-bold text-lg">{bitacora.stats.totalTasks}</p>
                      </div>
                      <div className="text-center p-3 bg-gray-900 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-400 mb-1">Sesiones</p>
                        <p className="text-white font-bold text-lg">{bitacora.stats.totalSessions}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
