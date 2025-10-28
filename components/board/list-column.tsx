"use client"

import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { ListWithTasks } from "@/types"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, MoreVertical, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ListColumnProps {
  list: ListWithTasks
  onUpdate: () => void
}

export function ListColumn({ list, onUpdate }: ListColumnProps) {
  const { toast } = useToast()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().split('T')[0],
    dueDate: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(list.title)

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: list.id,
  })

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsCreatingTask(true)

    try {
      // Convertir fechas a timezone de México (America/Mexico_City = UTC-6)
      const startDate = newTask.startDate ? new Date(newTask.startDate + 'T00:00:00-06:00') : null
      const dueDate = newTask.dueDate ? new Date(newTask.dueDate + 'T23:59:59-06:00') : null

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          listId: list.id,
          order: list.tasks.length,
          dueDate: dueDate,
        }),
      })

      if (response.ok) {
        setNewTask({
          title: "",
          description: "",
          startDate: new Date().toISOString().split('T')[0],
          dueDate: "",
        })
        setIsAddingTask(false)
        onUpdate()
        toast({
          title: "Tarea creada",
          description: "La tarea se ha creado exitosamente",
        })
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.error || "Error al crear la tarea")
      }
    } catch (error: any) {
      console.error("Error creating task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo crear la tarea",
      })
    } finally {
      setIsCreatingTask(false)
    }
  }

  const handleUpdateTitle = async () => {
    if (!title.trim() || title === list.title) {
      setIsEditing(false)
      return
    }

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      } else {
        throw new Error("Error al actualizar el título")
      }
    } catch (error) {
      console.error("Error updating list:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el título",
      })
      setTitle(list.title)
    }
  }

  const handleDeleteList = async () => {
    if (!confirm("¿Estás seguro de eliminar esta lista y todas sus tareas?")) {
      return
    }

    try {
      const response = await fetch(`/api/lists/${list.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onUpdate()
        toast({
          title: "Lista eliminada",
          description: "La lista se ha eliminado exitosamente",
        })
      } else {
        throw new Error("Error al eliminar la lista")
      }
    } catch (error) {
      console.error("Error deleting list:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la lista",
      })
    }
  }

  return (
    <div ref={setDroppableRef} className="flex-shrink-0 w-72">
      <Card className="h-full flex flex-col p-3 bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-3">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleUpdateTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateTitle()
                if (e.key === "Escape") {
                  setTitle(list.title)
                  setIsEditing(false)
                }
              }}
              className="h-8 bg-black border-gray-800 text-white"
              autoFocus
            />
          ) : (
            <h3
              className="font-semibold flex-1 cursor-pointer text-white"
              onClick={() => setIsEditing(true)}
            >
              {list.title}
            </h3>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDeleteList} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar lista
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          <SortableContext
            items={list.tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            {list.tasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={onUpdate} />
            ))}
          </SortableContext>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar tarea
        </Button>

        {/* Dialog para crear tarea */}
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea</DialogTitle>
              <DialogDescription className="text-gray-400">
                Agrega una nueva tarea a la lista "{list.title}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título *</Label>
                <Input
                  id="task-title"
                  placeholder="Ej: Terminar la plataforma"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Descripción</Label>
                <Textarea
                  id="task-description"
                  placeholder="Detalles de la tarea..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-startDate">Fecha de Inicio</Label>
                  <Input
                    id="task-startDate"
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, startDate: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                  <p className="text-xs text-gray-500">Timezone: México (GMT-6)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-dueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="task-dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingTask(false)
                  setNewTask({
                    title: "",
                    description: "",
                    startDate: new Date().toISOString().split('T')[0],
                    dueDate: "",
                  })
                }}
                className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddTask} 
                disabled={isCreatingTask}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingTask ? "Creando..." : "Crear Tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}



