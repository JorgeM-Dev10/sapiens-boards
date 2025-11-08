"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react"
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

interface Board {
  id: string
  title: string
  description: string | null
  image: string | null
  order: number
  createdAt: string
  lists: any[]
}

const getTaskCount = (board: Board) => {
  return board.lists.reduce((total, list) => total + (list.tasks?.length || 0), 0)
}

// Componente para tarjeta sortable
function SortableBoardCard({ board, onEdit, onDelete, onClick }: {
  board: Board
  onEdit: (board: Board, e: React.MouseEvent) => void
  onDelete: (boardId: string, e: React.MouseEvent) => void
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card
        className={`cursor-pointer border-gray-800 hover:border-blue-500 hover:shadow-xl transition-all group overflow-hidden relative h-80 ${
          isDragging ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          backgroundImage: board.image ? `url(${board.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: board.image ? undefined : '#1a1a1a',
        }}
        onClick={onClick}
      >
        {/* Overlay semi-transparente para el contenido */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        
        {/* Contenido con fondo semi-transparente */}
        <div className="relative z-10 h-full flex flex-col">
          <CardHeader className="flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-white drop-shadow-lg">{board.title}</CardTitle>
                {board.description && (
                  <CardDescription className="text-gray-200 mt-1 drop-shadow-md line-clamp-2">{board.description}</CardDescription>
                )}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-blue-400 hover:bg-white/20 opacity-80 hover:opacity-100 backdrop-blur-sm"
                  onClick={(e) => onEdit(board, e)}
                  title="Editar tablero"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:text-red-400 hover:bg-white/20 opacity-80 hover:opacity-100 backdrop-blur-sm"
                  onClick={(e) => onDelete(board.id, e)}
                  title="Eliminar tablero"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-black/40 backdrop-blur-sm rounded-lg mt-auto">
            <div className="flex items-center justify-between text-sm text-white font-medium">
              <span className="drop-shadow-md">{board.lists.length} listas</span>
              <span className="drop-shadow-md">{getTaskCount(board)} tareas</span>
            </div>
          </CardContent>
        </div>
        
        {/* Handle de drag */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-2 z-20 bg-black/50 backdrop-blur-sm rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-6 h-6 flex flex-col gap-1 justify-center">
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function RoadmapsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingBoard, setEditingBoard] = useState<Board | null>(null)
  const [newBoard, setNewBoard] = useState({
    title: "",
    description: "",
    image: "",
  })
  const [editBoard, setEditBoard] = useState({
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
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const response = await fetch("/api/boards")
      if (response.ok) {
        const data = await response.json()
        setBoards(data)
      }
    } catch (error) {
      console.error("Error fetching boards:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los tableros",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBoard = async () => {
    if (!newBoard.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newBoard),
      })

      if (response.ok) {
        const board = await response.json()
        toast({
          title: "Tablero creado",
          description: "Haz clic en el tablero para abrirlo",
        })
        setIsCreateDialogOpen(false)
        setNewBoard({ title: "", description: "", image: "" })
        fetchBoards() // Recargar la lista de tableros
      } else {
        throw new Error("Error al crear el tablero")
      }
    } catch (error) {
      console.error("Error creating board:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el tablero",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditBoard = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBoard(board)
    setEditBoard({
      title: board.title,
      description: board.description || "",
      image: board.image || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateBoard = async () => {
    if (!editingBoard || !editBoard.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsEditing(true)

    try {
      const response = await fetch(`/api/boards/${editingBoard.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editBoard.title,
          description: editBoard.description || null,
          image: editBoard.image || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Tablero actualizado",
          description: "El tablero se ha actualizado exitosamente",
        })
        setIsEditDialogOpen(false)
        setEditingBoard(null)
        setEditBoard({ title: "", description: "", image: "" })
        fetchBoards()
      } else {
        throw new Error("Error al actualizar el tablero")
      }
    } catch (error) {
      console.error("Error updating board:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el tablero",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteBoard = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("¿Estás seguro de eliminar este tablero?")) {
      return
    }

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Tablero eliminado",
          description: "El tablero se ha eliminado exitosamente",
        })
        fetchBoards()
      } else {
        throw new Error("Error al eliminar el tablero")
      }
    } catch (error) {
      console.error("Error deleting board:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el tablero",
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

    const activeId = active.id as string
    const overId = over.id as string

    const oldIndex = boards.findIndex((board) => board.id === activeId)
    const newIndex = boards.findIndex((board) => board.id === overId)

    if (oldIndex === -1 || newIndex === -1) {
      setActiveId(null)
      return
    }

    // Reordenar localmente
    const newBoards = [...boards]
    const [movedBoard] = newBoards.splice(oldIndex, 1)
    newBoards.splice(newIndex, 0, movedBoard)
    setBoards(newBoards)

    // Actualizar en el servidor
    try {
      const boardIds = newBoards.map((board) => board.id)
      const response = await fetch("/api/boards/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardIds }),
      })

      if (!response.ok) {
        throw new Error("Error al actualizar el orden")
      }
    } catch (error) {
      console.error("Error reordering boards:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el orden de los tableros",
      })
      // Revertir cambios
      fetchBoards()
    }

    setActiveId(null)
  }

  const activeBoard = activeId ? boards.find((board) => board.id === activeId) : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        action={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-900 border border-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Tablero
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Tablero</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Crea un nuevo tablero para organizar tus tareas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Mi Proyecto"
                    value={newBoard.title}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, title: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del tablero..."
                    value={newBoard.description}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, description: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">URL de Imagen (opcional)</Label>
                  <Input
                    id="image"
                    placeholder="Clic derecho en imagen > Copiar dirección de imagen"
                    value={newBoard.image}
                    onChange={(e) =>
                      setNewBoard({ ...newBoard, image: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    💡 Tip: En Google, haz clic derecho en la imagen y selecciona "Copiar dirección de imagen" (no "Copiar URL")
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateBoard} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Tablero"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Diálogo de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar Tablero</DialogTitle>
            <DialogDescription className="text-gray-400">
              Modifica el nombre, descripción o URL de la imagen del tablero
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input
                id="edit-title"
                placeholder="Mi Proyecto"
                value={editBoard.title}
                onChange={(e) =>
                  setEditBoard({ ...editBoard, title: e.target.value })
                }
                className="bg-black border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción (opcional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Descripción del tablero..."
                value={editBoard.description}
                onChange={(e) =>
                  setEditBoard({ ...editBoard, description: e.target.value })
                }
                className="bg-black border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">URL de Imagen (opcional)</Label>
              <Input
                id="edit-image"
                placeholder="Clic derecho en imagen > Copiar dirección de imagen"
                value={editBoard.image}
                onChange={(e) =>
                  setEditBoard({ ...editBoard, image: e.target.value })
                }
                className="bg-black border-gray-800 text-white"
              />
              <p className="text-xs text-gray-500">
                💡 Tip: En Google, haz clic derecho en la imagen y selecciona "Copiar dirección de imagen" (no "Copiar URL")
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingBoard(null)
                setEditBoard({ title: "", description: "", image: "" })
              }}
              className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateBoard} disabled={isEditing} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-2">Roadmaps</h1>
        <p className="text-gray-400 mb-6">Gestiona tus proyectos y tareas</p>

        {boards.length === 0 ? (
          <Card className="border-dashed bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">No tienes tableros aún</CardTitle>
              <CardDescription className="text-gray-400">
                Crea tu primer tablero para empezar a organizar tus tareas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Crear Primer Tablero
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={boards.map((board) => board.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {boards.map((board) => (
                  <SortableBoardCard
                    key={board.id}
                    board={board}
                    onEdit={handleEditBoard}
                    onDelete={handleDeleteBoard}
                    onClick={() => router.push(`/roadmaps/${board.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeBoard ? (
                <Card 
                  className="cursor-pointer border-blue-500 shadow-xl opacity-95 w-80 h-80"
                  style={{
                    backgroundImage: activeBoard.image ? `url(${activeBoard.image})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: activeBoard.image ? undefined : '#1a1a1a',
                  }}
                >
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    <CardHeader className="flex-1 flex flex-col justify-between">
                      <CardTitle className="text-white drop-shadow-lg">{activeBoard.title}</CardTitle>
                      {activeBoard.description && (
                        <CardDescription className="text-gray-200 drop-shadow-md line-clamp-2">{activeBoard.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="bg-black/40 backdrop-blur-sm rounded-lg mt-auto">
                      <div className="flex items-center justify-between text-sm text-white font-medium">
                        <span className="drop-shadow-md">{activeBoard.lists.length} listas</span>
                        <span className="drop-shadow-md">{getTaskCount(activeBoard)} tareas</span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </div>
  )
}

