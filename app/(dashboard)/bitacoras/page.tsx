"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Pencil, Trash2, FileText, Clock, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
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

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
  order: number
  boardId: string | null
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

// Componente para tarjeta sortable
function SortableBitacoraCard({ bitacora, onEdit, onDelete, onClick }: {
  bitacora: Bitacora
  onEdit: (bitacora: Bitacora, e: React.MouseEvent) => void
  onDelete: (bitacoraId: string, e: React.MouseEvent) => void
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: bitacora.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

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

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={`cursor-pointer border-2 border-gray-800 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all group overflow-hidden relative h-[28rem] ${
          isDragging ? 'ring-2 ring-blue-500 scale-105' : ''
        }`}
        style={{
          backgroundImage: bitacora.image ? `url(${bitacora.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: bitacora.image ? undefined : '#1a1a1a',
        }}
        onClick={onClick}
      >
        {/* Overlay con gradiente más pronunciado */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
        
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
          <CardContent className="bg-gradient-to-t from-black/90 via-black/80 to-black/70 backdrop-blur-md rounded-t-2xl mt-auto p-4 border-t border-white/10">
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
                    <div
                      className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 h-full rounded-full transition-all duration-500 shadow-lg shadow-yellow-500/50"
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
                        })()}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-blue-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Horas</span>
                </div>
                <p className="text-white font-bold text-lg">{bitacora.stats.totalHours.toFixed(1)}h</p>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-green-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-gray-400">Tareas</span>
                </div>
                <p className="text-white font-bold text-lg">{bitacora.stats.totalTasks}</p>
              </div>
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Sesiones</span>
                </div>
                <p className="text-white font-bold text-lg">{bitacora.stats.totalSessions}</p>
              </div>
            </div>
          </CardContent>
        </div>
        
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-2 z-20 bg-black/70 backdrop-blur-md rounded-lg border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-6 h-6 flex flex-col gap-1 justify-center">
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function BitacorasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
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
  })
  const [editBitacora, setEditBitacora] = useState({
    title: "",
    description: "",
    image: "",
    boardId: undefined as string | undefined,
  })
  const [availableBoards, setAvailableBoards] = useState<Array<{ id: string, title: string }>>([])
  const [allBoards, setAllBoards] = useState<Array<{ id: string, title: string }>>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
        setBitacoras(data)
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
        setNewBitacora({ title: "", description: "", image: "", boardId: undefined })
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const oldIndex = bitacoras.findIndex((b) => b.id === active.id)
    const newIndex = bitacoras.findIndex((b) => b.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null)
      return
    }

    const newBitacoras = [...bitacoras]
    const [moved] = newBitacoras.splice(oldIndex, 1)
    newBitacoras.splice(newIndex, 0, moved)

    // Actualizar orden
    const updates = newBitacoras.map((bitacora, index) => ({
      id: bitacora.id,
      order: index,
    }))

    try {
      await Promise.all(
        updates.map((update) =>
          fetch(`/api/bitacoras/${update.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ order: update.order }),
          })
        )
      )
      setBitacoras(newBitacoras)
    } catch (error) {
      console.error("Error reordering bitacoras:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al reordenar las bitácoras",
      })
      fetchBitacoras()
    }

    setActiveId(null)
  }

  const activeBitacora = activeId
    ? bitacoras.find((b) => b.id === activeId)
    : null

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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
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
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <SortableContext items={bitacoras.map((b) => b.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bitacoras.map((bitacora) => (
                    <SortableBitacoraCard
                      key={bitacora.id}
                      bitacora={bitacora}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onClick={() => router.push(`/bitacoras/${bitacora.id}`)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeBitacora ? (
                  <div className="opacity-50">
                    <SortableBitacoraCard
                      bitacora={activeBitacora}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      onClick={() => {}}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
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

