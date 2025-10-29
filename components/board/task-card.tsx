"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TaskWithRelations } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Trash2, X } from "lucide-react"
import { getInitials, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface TaskCardProps {
  task: TaskWithRelations
  onUpdate?: () => void
}

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const { toast } = useToast()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState({
    title: task.title,
    description: task.description || "",
    image: task.image || "",
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
  })
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const [availableTags, setAvailableTags] = useState<any[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(task.tags?.map(t => t.tag.id) || [])
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    scale: isDragging ? 1.05 : 1,
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setAvailableTags(data)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleOpenDialog = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await fetchTags()
    setIsEditDialogOpen(true)
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTagName,
          color: newTagColor,
        }),
      })

      if (response.ok) {
        const tag = await response.json()
        setAvailableTags([...availableTags, tag])
        setSelectedTags([...selectedTags, tag.id])
        setNewTagName("")
        setNewTagColor("#3b82f6")
        toast({
          title: "Etiqueta creada",
          description: "La etiqueta se ha creado exitosamente",
        })
      }
    } catch (error) {
      console.error("Error creating tag:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la etiqueta",
      })
    }
  }

  const handleUpdateTask = async () => {
    if (!editedTask.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsEditing(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTask.title,
          description: editedTask.description,
          image: editedTask.image || null,
          dueDate: editedTask.dueDate || null,
          tagIds: selectedTags,
        }),
      })

      if (response.ok) {
        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado exitosamente",
        })
        setIsEditDialogOpen(false)
        if (onUpdate) onUpdate()
      } else {
        throw new Error("Error al actualizar la tarea")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la tarea",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId))
    } else {
      setSelectedTags([...selectedTags, tagId])
    }
  }

  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm("¿Estás seguro de que quieres eliminar esta etiqueta? Se eliminará de todas las tareas.")) {
      return
    }

    try {
      const response = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Etiqueta eliminada",
          description: "La etiqueta se ha eliminado exitosamente",
        })
        // Actualizar la lista de etiquetas
        await fetchTags()
        // Remover de las seleccionadas si estaba
        setSelectedTags(prev => prev.filter(id => id !== tagId))
      } else {
        throw new Error("Error al eliminar la etiqueta")
      }
    } catch (error) {
      console.error("Error deleting tag:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la etiqueta",
      })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!confirm("¿Estás seguro de eliminar esta tarea?")) {
      return
    }

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        if (onUpdate) onUpdate()
        toast({
          title: "Tarea eliminada",
          description: "La tarea se ha eliminado exitosamente",
        })
      } else {
        throw new Error("Error al eliminar la tarea")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la tarea",
      })
    }
  }

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <Card 
          className={`cursor-grab active:cursor-grabbing hover:shadow-xl hover:border-blue-500 transition-all duration-200 group bg-black border-gray-800 ${
            isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-2' : ''
          }`}
          onClick={handleOpenDialog}
        >
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium flex-1 text-white">{task.title}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>

            {task.image && (
              <div className="relative w-full h-40 rounded-md overflow-hidden bg-gray-900">
                <img
                  src={task.image}
                  alt={task.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map(({ tag }) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              {task.dueDate && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(task.dueDate)}
                </div>
              )}

              {task.assigned && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assigned.image || ""} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assigned.name || "U")}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription className="text-gray-400">
            Actualiza los detalles de la tarea
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={editedTask.title}
              onChange={(e) =>
                setEditedTask({ ...editedTask, title: e.target.value })
              }
              className="bg-black border-gray-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={editedTask.description}
              onChange={(e) =>
                setEditedTask({ ...editedTask, description: e.target.value })
              }
              className="bg-black border-gray-800 text-white"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-image">URL de Imagen</Label>
            <Input
              id="edit-image"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={editedTask.image}
              onChange={(e) =>
                setEditedTask({ ...editedTask, image: e.target.value })
              }
              className="bg-black border-gray-800 text-white"
            />
            <p className="text-xs text-gray-500">Opcional: URL de una imagen para la tarea</p>
            {editedTask.image && (
              <div className="relative w-full h-40 rounded-md overflow-hidden bg-gray-900 border border-gray-800">
                <img
                  src={editedTask.image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = ''
                    e.currentTarget.alt = 'Error al cargar imagen'
                  }}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-dueDate">Fecha de Vencimiento</Label>
            <Input
              id="edit-dueDate"
              type="date"
              value={editedTask.dueDate}
              onChange={(e) =>
                setEditedTask({ ...editedTask, dueDate: e.target.value })
              }
              className="bg-black border-gray-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-black border border-gray-800 rounded-md min-h-[50px]">
              {availableTags.map((tag) => (
                <div key={tag.id} className="relative group/tag">
                  <Badge
                    className="cursor-pointer pr-8"
                    style={{
                      backgroundColor: selectedTags.includes(tag.id) ? tag.color : tag.color + "40",
                      color: "white",
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-1 -top-1 h-5 w-5 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover/tag:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteTag(tag.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-white" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Crear Nueva Etiqueta</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de etiqueta"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="bg-black border-gray-800 text-white flex-1"
              />
              <Input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="bg-black border-gray-800 w-20"
              />
              <Button
                onClick={handleCreateTag}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(false)}
            className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateTask}
            disabled={isEditing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isEditing ? "Actualizando..." : "Actualizar Tarea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}



