"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Clock, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RegisterWorkSessionDialogProps {
  boardId: string
  boardLists: Array<{ id: string; title: string }>
  onSuccess?: () => void
}

export function RegisterWorkSessionDialog({ 
  boardId, 
  boardLists,
  onSuccess 
}: RegisterWorkSessionDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: "09:00",
    endTime: "17:00",
    listId: "",
    tasksCompleted: 0,
    description: "",
    workType: "dev",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.startTime || !formData.endTime) {
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
          boardId,
          listId: formData.listId || null,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          tasksCompleted: parseInt(formData.tasksCompleted.toString()) || 0,
          description: formData.description || null,
          workType: formData.workType,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Jornada registrada correctamente",
        })
        setIsOpen(false)
        setFormData({
          date: new Date().toISOString().split('T')[0],
          startTime: "09:00",
          endTime: "17:00",
          listId: "",
          tasksCompleted: 0,
          description: "",
          workType: "dev",
        })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al registrar la jornada",
        })
      }
    } catch (error) {
      console.error("Error registering work session:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al registrar la jornada",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Clock className="mr-2 h-4 w-4" />
          Registrar Jornada
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Jornada de Trabajo</DialogTitle>
          <DialogDescription className="text-gray-400">
            Registra el tiempo trabajado en este proyecto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date">Fecha *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora Fin *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="listId">Lista (opcional)</Label>
              <Select
                value={formData.listId}
                onValueChange={(value) => setFormData({ ...formData, listId: value })}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Seleccionar lista" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-800">
                  <SelectItem value="">Ninguna</SelectItem>
                  {boardLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tasksCompleted">Tareas Completadas</Label>
              <Input
                id="tasksCompleted"
                type="number"
                min="0"
                value={formData.tasksCompleted}
                onChange={(e) => setFormData({ ...formData, tasksCompleted: parseInt(e.target.value) || 0 })}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="workType">Tipo de Trabajo</Label>
              <Select
                value={formData.workType}
                onValueChange={(value) => setFormData({ ...formData, workType: value })}
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
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="¿En qué trabajaste?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}





