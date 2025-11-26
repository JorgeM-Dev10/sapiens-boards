"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Pencil, Trash2, FileText, Clock, CheckCircle } from "lucide-react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
  order: number
  createdAt: string
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

  const getAvatarEmoji = (style: string) => {
    if (style === "legend") return "👑"
    if (style === "master") return "⭐"
    if (style === "expert") return "🔥"
    if (style === "advanced") return "💪"
    if (style === "intermediate") return "🚀"
    return "🌱"
  }

  const getAvatarColorClass = (style: string) => {
    if (style === "legend") return "text-purple-400 border-purple-400 bg-purple-500/20"
    if (style === "master") return "text-blue-400 border-blue-400 bg-blue-500/20"
    if (style === "expert") return "text-green-400 border-green-400 bg-green-500/20"
    if (style === "advanced") return "text-yellow-400 border-yellow-400 bg-yellow-500/20"
    if (style === "intermediate") return "text-orange-400 border-orange-400 bg-orange-500/20"
    return "text-gray-400 border-gray-400 bg-gray-500/20"
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={`cursor-pointer border-2 border-gray-800 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all group overflow-hidden relative h-96 ${
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
                <CardTitle className="text-white drop-shadow-lg text-xl font-bold flex items-center gap-2 mb-2">
                  {bitacora.avatar && (
                    <span className="text-3xl">{getAvatarEmoji(bitacora.avatar.avatarStyle)}</span>
                  )}
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
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center text-xl ${getAvatarColorClass(bitacora.avatar.avatarStyle)}`}>
                      {getAvatarEmoji(bitacora.avatar.avatarStyle)}
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">Nivel {bitacora.avatar.level}</span>
                      <span className={`block text-xs font-semibold ${getLevelColor(bitacora.avatar.level)}`}>
                        {bitacora.avatar.avatarStyle.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-bold text-sm">{bitacora.avatar.experience} XP</span>
                  </div>
                </div>
                <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden border border-gray-700">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full transition-all shadow-lg shadow-blue-500/50"
                    style={{ width: `${Math.min((bitacora.avatar.experience % 1000) / 10, 100)}%` }}
                  />
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
  })
  const [editBitacora, setEditBitacora] = useState({
    title: "",
    description: "",
    image: "",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
      const response = await fetch("/api/bitacoras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBitacora),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Bitácora creada correctamente",
        })
        setNewBitacora({ title: "", description: "", image: "" })
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

  const handleEdit = (bitacora: Bitacora, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBitacora(bitacora)
    setEditBitacora({
      title: bitacora.title,
      description: bitacora.description || "",
      image: bitacora.image || "",
    })
    setIsEditDialogOpen(true)
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
      const response = await fetch(`/api/bitacoras/${editingBitacora.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editBitacora),
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

