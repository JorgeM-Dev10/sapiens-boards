"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Pencil, Trash2, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import { BitacoraAnimatedBackground } from "@/components/bitacoras/bitacora-animated-background"
import { BITACORA_THEMES, getThemeColors } from "@/lib/bitacora-themes"

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
  order: number
  boardId: string | null
  themeColor?: string | null
  themeVariant?: string | null
  createdAt: string
  avatar: {
    level: number
    experience: number
    totalHours: number
    totalTasks: number
    totalSessions: number
    avatarStyle: string
    rank: string
    avatarImageUrl: string | null
  } | null
  board?: {
    id: string
    title: string
  } | null
  stats: {
    totalHours: number
    totalTasks: number
    totalSessions: number
  }
}

// Componente para tarjeta de bitácora
function BitacoraCard({ bitacora, rankPosition, onEdit, onDelete, onClick }: {
  bitacora: Bitacora
  rankPosition: number // 1, 2, 3, etc.
  onEdit: (bitacora: Bitacora, e: React.MouseEvent) => void
  onDelete: (bitacoraId: string, e: React.MouseEvent) => void
  onClick: () => void
}) {

  const getLevelColor = (level: number) => {
    if (level >= 50) return "text-purple-400"
    if (level >= 30) return "text-blue-400"
    if (level >= 15) return "text-green-400"
    if (level >= 5) return "text-yellow-400"
    return "text-gray-400"
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

  const getRankColorClass = (rank: string) => {
    if (rank === "Leyenda") return "text-purple-400 border-purple-400 bg-gradient-to-br from-purple-500/30 to-purple-600/20"
    if (rank === "Épico") return "text-blue-400 border-blue-400 bg-gradient-to-br from-blue-500/30 to-blue-600/20"
    if (rank === "Avanzado") return "text-green-400 border-green-400 bg-gradient-to-br from-green-500/30 to-green-600/20"
    if (rank === "Intermedio") return "text-yellow-400 border-yellow-400 bg-gradient-to-br from-yellow-500/30 to-yellow-600/20"
    return "text-gray-400 border-gray-400 bg-gradient-to-br from-gray-500/30 to-gray-600/20"
  }

  const getRankBadgeColor = (rank: string) => {
    if (rank === "Leyenda") return "bg-purple-500/20 text-purple-300 border-purple-400"
    if (rank === "Épico") return "bg-blue-500/20 text-blue-300 border-blue-400"
    if (rank === "Avanzado") return "bg-green-500/20 text-green-300 border-green-400"
    if (rank === "Intermedio") return "bg-yellow-500/20 text-yellow-300 border-yellow-400"
    return "bg-gray-500/20 text-gray-300 border-gray-400"
  }

  // Generar partículas: top 3 o cards con theme
  const generateAuraParticles = () => {
    if (rankPosition <= 3) {
      const particleCount = rankPosition === 1 ? 20 : rankPosition === 2 ? 15 : 10
      const particles = []
      for (let i = 0; i < particleCount; i++) {
        const side = Math.floor(i / (particleCount / 4))
        const position = (i % (particleCount / 4)) / (particleCount / 4)
        let x = 0, y = 0
        if (side === 0) { x = position * 100; y = -8 }
        else if (side === 1) { x = 100 + 8; y = position * 100 }
        else if (side === 2) { x = (1 - position) * 100; y = 100 + 8 }
        else { x = -8; y = (1 - position) * 100 }
        particles.push({ x, y, side, delay: i * 0.1 })
      }
      return particles
    }
    if (bitacora.themeColor) {
      return Array.from({ length: 8 }, (_, i) => ({
        x: (i * 12) % 100,
        y: i < 4 ? -8 : 100 + 8,
        side: 0,
        delay: i * 0.15,
      }))
    }
    return []
  }

  const auraParticles = generateAuraParticles()

  // Colores de aura: usar theme de bitácora si existe, si no según posición en ranking
  const getAuraColor = () => {
    if (bitacora.themeColor) {
      const c = getThemeColors(bitacora.themeColor)
      return {
        primary: c.primary,
        secondary: c.secondary,
        glow: c.glow,
        particle: "",
        particleStyle: { backgroundColor: c.primary },
      }
    }
    if (rankPosition === 1) {
      return {
        primary: "rgba(147, 51, 234, 0.8)",
        secondary: "rgba(192, 132, 252, 0.6)",
        glow: "rgba(168, 85, 247, 0.4)",
        particle: "bg-purple-400",
        particleStyle: {} as React.CSSProperties,
      }
    } else if (rankPosition === 2) {
      return {
        primary: "rgba(59, 130, 246, 0.7)",
        secondary: "rgba(96, 165, 250, 0.5)",
        glow: "rgba(59, 130, 246, 0.3)",
        particle: "bg-blue-400",
        particleStyle: {} as React.CSSProperties,
      }
    } else if (rankPosition === 3) {
      return {
        primary: "rgba(34, 197, 94, 0.6)",
        secondary: "rgba(74, 222, 128, 0.4)",
        glow: "rgba(34, 197, 94, 0.25)",
        particle: "bg-green-400",
        particleStyle: {} as React.CSSProperties,
      }
    }
    return null
  }

  const auraColors = getAuraColor()

  return (
    <div className="relative">
      {/* Marco de aura / glow: top 3 por ranking, o cualquier card con themeColor */}
      {(rankPosition <= 3 || bitacora.themeColor) && auraColors && (
        <>
          {/* Partículas de aura alrededor del perímetro */}
          {auraParticles.map((particle, i) => (
            <motion.div
              key={`aura-particle-${i}`}
              className={`absolute rounded-full blur-sm ${auraColors.particle}`}
              style={{
                width: rankPosition === 1 ? "8px" : rankPosition === 2 ? "6px" : "5px",
                height: rankPosition === 1 ? "8px" : rankPosition === 2 ? "6px" : "5px",
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                transform: "translate(-50%, -50%)",
                ...auraColors.particleStyle,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
                boxShadow: [
                  `0 0 ${rankPosition === 1 ? "12px" : rankPosition === 2 ? "8px" : "6px"} ${auraColors.primary}`,
                  `0 0 ${rankPosition === 1 ? "20px" : rankPosition === 2 ? "14px" : "10px"} ${auraColors.secondary}`,
                  `0 0 ${rankPosition === 1 ? "12px" : rankPosition === 2 ? "8px" : "6px"} ${auraColors.primary}`,
                ],
              }}
              transition={{
                duration: 2 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut",
              }}
            />
          ))}
          
          {/* Líneas de aura conectando las partículas (marco) */}
          <motion.svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: "100%", height: "100%" }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.path
              d={`M 0,0 L 100,0 L 100,100 L 0,100 Z`}
              fill="none"
              stroke={auraColors.primary}
              strokeWidth={rankPosition === 1 ? "3" : rankPosition === 2 ? "2" : "1.5"}
              strokeDasharray="10 5"
              strokeLinecap="round"
              animate={{
                strokeDashoffset: [0, 15],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                filter: `blur(${rankPosition === 1 ? "2px" : rankPosition === 2 ? "1.5px" : "1px"})`,
              }}
            />
          </motion.svg>

          {/* Aura exterior pulsante (glow alrededor) */}
          <motion.div
            className="absolute -inset-3 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${auraColors.glow} 0%, transparent 70%)`,
              filter: "blur(15px)",
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.08, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}
      
      <motion.div
        className="relative"
        animate={
          (rankPosition <= 3 || bitacora.themeColor) && auraColors
            ? {
                boxShadow: [
                  `0 0 ${rankPosition === 1 ? "40px" : rankPosition === 2 ? "30px" : "20px"} ${auraColors.primary}, 0 0 ${rankPosition === 1 ? "80px" : rankPosition === 2 ? "60px" : "40px"} ${auraColors.glow}`,
                  `0 0 ${rankPosition === 1 ? "60px" : rankPosition === 2 ? "45px" : "30px"} ${auraColors.secondary}, 0 0 ${rankPosition === 1 ? "100px" : rankPosition === 2 ? "75px" : "50px"} ${auraColors.glow}`,
                  `0 0 ${rankPosition === 1 ? "40px" : rankPosition === 2 ? "30px" : "20px"} ${auraColors.primary}, 0 0 ${rankPosition === 1 ? "80px" : rankPosition === 2 ? "60px" : "40px"} ${auraColors.glow}`,
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Card
          className={`cursor-pointer border-2 transition-all duration-300 group overflow-visible relative h-[28rem] backdrop-blur-md
            ${(rankPosition <= 3 || bitacora.themeColor) && auraColors ? "border-transparent" : "border-gray-800/50"}
            hover:scale-[1.02] hover:shadow-2xl
          `}
          style={{
            backgroundImage: bitacora.image ? `url(${bitacora.image})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: bitacora.image ? undefined : "rgba(26, 26, 26, 0.6)",
            boxShadow: (rankPosition <= 3 || bitacora.themeColor) && auraColors
              ? `0 4px 24px rgba(0,0,0,0.4), 0 0 40px ${auraColors.glow}`
              : "0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.05)",
          }}
          onClick={onClick}
        >
        {/* Overlay con gradiente más sutil para mostrar más la imagen */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/50"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader className="flex-1 flex flex-col justify-between p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white drop-shadow-lg text-xl font-bold mb-2">
                  {bitacora.title}
                </CardTitle>
                {bitacora.description && (
                  <CardDescription className="text-gray-200 mt-1 drop-shadow-md line-clamp-2 text-sm">{bitacora.description}</CardDescription>
                )}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-blue-400 hover:bg-white/30 opacity-90 hover:opacity-100 backdrop-blur-md border border-white/20"
                  onClick={(e) => onEdit(bitacora, e)}
                  title="Editar bitácora"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-red-400 hover:bg-red-500/30 opacity-90 hover:opacity-100 backdrop-blur-md border border-white/20"
                  onClick={(e) => onDelete(bitacora.id, e)}
                  title="Eliminar bitácora"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-gradient-to-t from-black/70 via-black/60 to-black/40 backdrop-blur-sm rounded-t-2xl mt-auto p-4 border-t border-white/20">
            {bitacora.avatar && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className={`h-28 w-28 rounded-full border-3 flex items-center justify-center overflow-hidden shadow-lg relative ${getRankColorClass(bitacora.avatar.rank || "Principiante")}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      animate={{ 
                        scale: [1, 1.03, 1],
                        boxShadow: [
                          "0 4px 15px rgba(0, 0, 0, 0.3)",
                          "0 6px 20px rgba(59, 130, 246, 0.4)",
                          "0 4px 15px rgba(0, 0, 0, 0.3)"
                        ]
                      }}
                      transition={{ 
                        scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                        type: "spring",
                        stiffness: 300
                      }}
                    >
                      {(() => {
                        const imageUrl = getAvatarImageUrl(bitacora.avatar.rank || "Principiante", bitacora.avatar.avatarImageUrl)
                        return imageUrl ? (
                          <>
                            <motion.img 
                              src={imageUrl} 
                              alt={bitacora.avatar.rank || "Principiante"}
                              className="w-full h-full object-contain p-1"
                              animate={{ 
                                scale: [1, 1.02, 1],
                                opacity: [1, 0.98, 1]
                              }}
                              transition={{ 
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                            />
                            <motion.div 
                              className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/25 to-transparent pointer-events-none"
                              animate={{ rotate: 360 }}
                              transition={{ 
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                              }}
                            />
                          </>
                        ) : (
                          <span className="text-4xl">{getAvatarEmoji(bitacora.avatar.rank || "Principiante")}</span>
                        )
                      })()}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold text-lg">{bitacora.avatar.rank || "Principiante"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-300">
                        <span>Nivel {bitacora.avatar.level}</span>
                        <span className="text-yellow-400 font-bold">• {bitacora.avatar.experience} XP</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Progreso al siguiente nivel</span>
                    <span className="text-yellow-400 font-semibold">
                      {(() => {
                        const xp = bitacora.avatar.experience
                        let nextThreshold = 100
                        if (xp < 100) nextThreshold = 100
                        else if (xp < 200) nextThreshold = 200
                        else if (xp < 300) nextThreshold = 300
                        else if (xp < 500) nextThreshold = 500
                        else if (xp < 1000) nextThreshold = 1000
                        else if (xp < 1500) nextThreshold = 1500
                        else if (xp < 2000) nextThreshold = 2000
                        else if (xp < 3000) nextThreshold = 3000
                        else if (xp < 4000) nextThreshold = 4000
                        else if (xp < 5000) nextThreshold = 5000
                        else if (xp < 6500) nextThreshold = 6500
                        else if (xp < 8000) nextThreshold = 8000
                        else if (xp < 10000) nextThreshold = 10000
                        else if (xp < 30000) nextThreshold = 30000
                        else if (xp < 50000) nextThreshold = 50000
                        else nextThreshold = 100000
                        const progress = Math.min(100, ((xp % (nextThreshold / 10)) / (nextThreshold / 10)) * 100)
                        return `${Math.round(progress)}%`
                      })()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800/70 rounded-full h-3 overflow-hidden border border-gray-700/50 shadow-inner">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      initial={false}
                      animate={{
                        background: bitacora.themeColor
                          ? [
                              `linear-gradient(90deg, ${getThemeColors(bitacora.themeColor).primary} 0%, ${getThemeColors(bitacora.themeColor).secondary} 50%, ${getThemeColors(bitacora.themeColor).primary} 100%)`,
                              `linear-gradient(90deg, ${getThemeColors(bitacora.themeColor).secondary} 0%, ${getThemeColors(bitacora.themeColor).primary} 50%, ${getThemeColors(bitacora.themeColor).secondary} 100%)`,
                              `linear-gradient(90deg, ${getThemeColors(bitacora.themeColor).primary} 0%, ${getThemeColors(bitacora.themeColor).secondary} 50%, ${getThemeColors(bitacora.themeColor).primary} 100%)`,
                            ]
                          : [
                              "linear-gradient(90deg, #eab308 0%, #facc15 50%, #eab308 100%)",
                              "linear-gradient(90deg, #facc15 0%, #eab308 50%, #facc15 100%)",
                              "linear-gradient(90deg, #eab308 0%, #facc15 50%, #eab308 100%)",
                            ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{
                        width: `${(() => {
                          const xp = bitacora.avatar.experience
                          let nextThreshold = 500
                          if (xp < 500) nextThreshold = 500
                          else if (xp < 2000) nextThreshold = 2000
                          else if (xp < 5000) nextThreshold = 5000
                          else if (xp < 10000) nextThreshold = 10000
                          else return 100
                          const currentLevelStart = xp < 500 ? 0 : xp < 2000 ? 500 : xp < 5000 ? 2000 : xp < 10000 ? 5000 : 10000
                          return Math.min(100, ((xp - currentLevelStart) / (nextThreshold - currentLevelStart)) * 100)
                        })()}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
      </motion.div>
    </div>
  )
}

export default function BitacorasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingBitacora, setEditingBitacora] = useState<Bitacora | null>(null)
  const [newBitacora, setNewBitacora] = useState({
    title: "",
    description: "",
    image: "",
    boardId: undefined as string | undefined,
    themeColor: "neon-purple" as string,
  })
  const [editBitacora, setEditBitacora] = useState({
    title: "",
    description: "",
    image: "",
    boardId: undefined as string | undefined,
    themeColor: "neon-purple" as string,
  })
  const [availableBoards, setAvailableBoards] = useState<Array<{ id: string, title: string }>>([])
  const [allBoards, setAllBoards] = useState<Array<{ id: string, title: string }>>([])

  useEffect(() => {
    fetchBitacoras()
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards")
      if (response.ok) {
        const data = await response.json()
        setAllBoards(data.map((b: any) => ({ id: b.id, title: b.title })))
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
    }
  }

  const fetchBitacoras = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/bitacoras")
      if (response.ok) {
        const data = await response.json()
        // Ordenar por totalHours descendente (ranking)
        const sorted = data.sort((a: Bitacora, b: Bitacora) => {
          const hoursA = a.stats?.totalHours || 0
          const hoursB = b.stats?.totalHours || 0
          return hoursB - hoursA
        })
        setBitacoras(sorted)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudieron cargar las bitácoras",
        })
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

  const handleCreate = async () => {
    if (!newBitacora.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        ...newBitacora,
        boardId: newBitacora.boardId || null,
      }
      const response = await fetch("/api/bitacoras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Bitácora creada correctamente",
        })
        setNewBitacora({ title: "", description: "", image: "", boardId: undefined, themeColor: "neon-purple" })
        setIsCreateDialogOpen(false)
        fetchBitacoras()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al crear la bitácora",
        })
      }
    } catch (error) {
      console.error("Error creating bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear la bitácora",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async (bitacora: Bitacora, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setEditingBitacora(bitacora)
      
      // Obtener bitácoras para ver qué roadmaps ya están asignados
      const response = await fetch("/api/bitacoras")
      const bitacorasData = response.ok ? await response.json() : []
      const assignedBoardIds = bitacorasData
        .filter((b: any) => b.id !== bitacora.id && b.boardId)
        .map((b: any) => b.boardId)
      
      // Filtrar roadmaps disponibles (excluir los ya asignados, excepto el de esta bitácora)
      const available = allBoards.filter(b => 
        !assignedBoardIds.includes(b.id) || b.id === (bitacora as any).boardId
      )
      setAvailableBoards(available)
      
      setEditBitacora({
        title: bitacora.title,
        description: bitacora.description || "",
        image: bitacora.image || "",
        boardId: (bitacora as any).boardId || undefined,
        themeColor: (bitacora as any).themeColor || "neon-purple",
      })
      setIsEditDialogOpen(true)
    } catch (error) {
      console.error("Error preparing edit dialog:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al abrir el diálogo de edición",
      })
    }
  }

  const handleUpdate = async () => {
    if (!editingBitacora || !editBitacora.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsEditing(true)
    try {
      const payload = {
        ...editBitacora,
        boardId: editBitacora.boardId || null,
      }
      const response = await fetch(`/api/bitacoras/${editingBitacora.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Bitácora actualizada correctamente",
        })
        setIsEditDialogOpen(false)
        setEditingBitacora(null)
        fetchBitacoras()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al actualizar la bitácora",
        })
      }
    } catch (error) {
      console.error("Error updating bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar la bitácora",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async (bitacoraId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta bitácora?")) {
      return
    }

    try {
      const response = await fetch(`/api/bitacoras/${bitacoraId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Bitácora eliminada correctamente",
        })
        fetchBitacoras()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al eliminar la bitácora",
        })
      }
    } catch (error) {
      console.error("Error deleting bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar la bitácora",
      })
    }
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

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          aria-hidden
        >
          <BitacoraAnimatedBackground />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Bitácoras</h1>
            <Dialog 
              open={isCreateDialogOpen} 
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (open) {
                  // Cuando se abre el diálogo, calcular roadmaps disponibles
                  const assignedBoardIds = bitacoras
                    .filter((b: any) => b.boardId)
                    .map((b: any) => b.boardId)
                  const available = allBoards.filter(b => !assignedBoardIds.includes(b.id))
                  setAvailableBoards(available)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Bitácora
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Bitácora</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Crea un tablero personal para registrar tu trabajo diario
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newBitacora.title}
                      onChange={(e) =>
                        setNewBitacora({ ...newBitacora, title: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Mi Bitácora 2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newBitacora.description}
                      onChange={(e) =>
                        setNewBitacora({ ...newBitacora, description: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Descripción opcional..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">URL de Imagen</Label>
                    <Input
                      id="image"
                      value={newBitacora.image}
                      onChange={(e) =>
                        setNewBitacora({ ...newBitacora, image: e.target.value })
                      }
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Tema de color</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {BITACORA_THEMES.filter(t => t.id !== "custom").map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setNewBitacora({ ...newBitacora, themeColor: theme.id })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                            newBitacora.themeColor === theme.id
                              ? "border-white bg-white/10"
                              : "border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: theme.primary }}
                          />
                          <span>{theme.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="boardId">Roadmap a Conectar</Label>
                    <Select
                      value={newBitacora.boardId || "none"}
                      onValueChange={(value) => {
                        setNewBitacora({ 
                          ...newBitacora, 
                          boardId: value === "none" ? undefined : value 
                        })
                      }}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue placeholder="Selecciona un roadmap (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-gray-800">
                        <SelectItem value="none">Sin roadmap</SelectItem>
                        {availableBoards.length > 0 ? (
                          availableBoards.map((board) => (
                            <SelectItem key={board.id} value={board.id}>
                              {board.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No hay roadmaps disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">
                      Al conectar un roadmap, las tareas completadas se registrarán automáticamente en esta bitácora
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreating ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {bitacoras.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg mb-2">No tienes bitácoras aún</p>
              <p className="text-sm">Crea tu primera bitácora para empezar a registrar tu trabajo</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bitacoras.map((bitacora, index) => (
                <BitacoraCard
                  key={bitacora.id}
                  bitacora={bitacora}
                  rankPosition={index + 1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onClick={() => router.push(`/bitacoras/${bitacora.id}`)}
                />
              ))}
            </div>
          )}

          {/* Dialog de edición */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Editar Bitácora</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Actualiza la información de tu bitácora
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Título *</Label>
                  <Input
                    id="edit-title"
                    value={editBitacora.title}
                    onChange={(e) =>
                      setEditBitacora({ ...editBitacora, title: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={editBitacora.description}
                    onChange={(e) =>
                      setEditBitacora({ ...editBitacora, description: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-image">URL de Imagen</Label>
                  <Input
                    id="edit-image"
                    value={editBitacora.image}
                    onChange={(e) =>
                      setEditBitacora({ ...editBitacora, image: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label>Tema de color</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {BITACORA_THEMES.filter(t => t.id !== "custom").map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setEditBitacora({ ...editBitacora, themeColor: theme.id })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                          editBitacora.themeColor === theme.id
                            ? "border-white bg-white/10"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <span>{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-boardId">Roadmap a Conectar</Label>
                  <Select
                    value={editBitacora.boardId || "none"}
                    onValueChange={(value) => {
                      setEditBitacora({ 
                        ...editBitacora, 
                        boardId: value === "none" ? undefined : value 
                      })
                    }}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Selecciona un roadmap (opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800">
                      <SelectItem value="none">Sin roadmap</SelectItem>
                      {availableBoards.length > 0 ? (
                        availableBoards.map((board) => (
                          <SelectItem key={board.id} value={board.id}>
                            {board.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No hay roadmaps disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    Al conectar un roadmap, las tareas completadas se registrarán automáticamente en esta bitácora
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isEditing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isEditing ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

