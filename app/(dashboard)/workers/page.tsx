"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface Worker {
  id: string
  name: string
  type: string
  responsibilities: string
  status: string
  salary: number
  paymentType: string
  percentage: number | null
  startDate: string
  paymentDate: number | null
  createdAt: string
}

const workerTypes = [
  { value: "HUMAN", label: "Humano" },
  { value: "AI", label: "IA" },
]

const paymentTypes = [
  { value: "FIXED", label: "Salario Fijo" },
  { value: "PERCENTAGE", label: "Porcentaje" },
  { value: "HYBRID", label: "Híbrido (Fijo + Porcentaje)" },
]

export default function WorkersPage() {
  const { toast } = useToast()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [newWorker, setNewWorker] = useState({
    name: "",
    type: "HUMAN",
    responsibilities: "",
    status: "",
    salary: "0",
    paymentType: "FIXED",
    percentage: "",
    startDate: new Date().toISOString().split('T')[0],
    paymentDate: "",
  })

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/workers")
      if (response.ok) {
        const data = await response.json()
        setWorkers(data)
      }
    } catch (error) {
      console.error("Error fetching workers:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los empleados",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorker = async () => {
    if (!newWorker.name.trim() || !newWorker.status.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y estatus son requeridos",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newWorker,
          salary: parseFloat(newWorker.salary) || 0,
          percentage: newWorker.percentage ? parseFloat(newWorker.percentage) : null,
          paymentDate: newWorker.paymentDate ? parseInt(newWorker.paymentDate) : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Empleado creado",
          description: "El empleado se ha creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewWorker({
          name: "",
          type: "HUMAN",
          responsibilities: "",
          status: "",
          salary: "0",
          paymentType: "FIXED",
          percentage: "",
          startDate: new Date().toISOString().split('T')[0],
          paymentDate: "",
        })
        fetchWorkers()
      } else {
        throw new Error("Error al crear el empleado")
      }
    } catch (error) {
      console.error("Error creating worker:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el empleado",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (worker: Worker) => {
    setEditingWorker({
      ...worker,
      startDate: new Date(worker.startDate).toISOString().split('T')[0],
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateWorker = async () => {
    if (!editingWorker) return

    setIsEditing(true)

    try {
      const response = await fetch(`/api/workers/${editingWorker.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingWorker,
          salary: typeof editingWorker.salary === 'string' ? parseFloat(editingWorker.salary) : editingWorker.salary,
        }),
      })

      if (response.ok) {
        toast({
          title: "Empleado actualizado",
          description: "El empleado se ha actualizado exitosamente",
        })
        setIsEditDialogOpen(false)
        setEditingWorker(null)
        fetchWorkers()
      } else {
        throw new Error("Error al actualizar el empleado")
      }
    } catch (error) {
      console.error("Error updating worker:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el empleado",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteWorker = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este empleado?")) {
      return
    }

    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Empleado eliminado",
          description: "El empleado se ha eliminado exitosamente",
        })
        fetchWorkers()
      }
    } catch (error) {
      console.error("Error deleting worker:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el empleado",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatSalary = (worker: Worker) => {
    if (worker.paymentType === "PERCENTAGE") {
      return `${worker.percentage}%`
    } else if (worker.paymentType === "HYBRID") {
      return `$${worker.salary.toLocaleString()} + ${worker.percentage}%`
    } else {
      return `$${worker.salary.toLocaleString()}`
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Cargando...</p>
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
                Nuevo Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Registra un nuevo empleado humano o IA worker
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: Carlos Davila"
                    value={newWorker.name}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, name: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newWorker.type}
                    onValueChange={(value) =>
                      setNewWorker({ ...newWorker, type: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {workerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsibilities">Responsabilidades</Label>
                  <Textarea
                    id="responsibilities"
                    placeholder="Ej: Dirigir al equipo de trabajo, Conseguir clientes enterprise..."
                    value={newWorker.responsibilities}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, responsibilities: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estatus</Label>
                  <Input
                    id="status"
                    placeholder="Ej: Founder, Early Employee, Employee..."
                    value={newWorker.status}
                    onChange={(e) =>
                      setNewWorker({ ...newWorker, status: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Tipo de Pago</Label>
                  <Select
                    value={newWorker.paymentType}
                    onValueChange={(value) =>
                      setNewWorker({ ...newWorker, paymentType: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {paymentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(newWorker.paymentType === "FIXED" || newWorker.paymentType === "HYBRID") && (
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salario / Costo Mensual</Label>
                      <Input
                        id="salary"
                        type="number"
                        placeholder="6500"
                        value={newWorker.salary}
                        onChange={(e) =>
                          setNewWorker({ ...newWorker, salary: e.target.value })
                        }
                        className="bg-black border-gray-800 text-white"
                      />
                    </div>
                  )}
                  {(newWorker.paymentType === "PERCENTAGE" || newWorker.paymentType === "HYBRID") && (
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Porcentaje (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        placeholder="10"
                        value={newWorker.percentage}
                        onChange={(e) =>
                          setNewWorker({ ...newWorker, percentage: e.target.value })
                        }
                        className="bg-black border-gray-800 text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Ingreso</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newWorker.startDate}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, startDate: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Día de Pago (1-31)</Label>
                    <Input
                      id="paymentDate"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="15"
                      value={newWorker.paymentDate}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, paymentDate: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
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
                <Button onClick={handleCreateWorker} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? "Creando..." : "Crear Empleado"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Gestión de Empleados</h1>

        {workers.length === 0 ? (
          <Card className="border-dashed bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">No tienes empleados registrados</p>
              <p className="text-sm text-gray-500 mt-2">
                Agrega tu primer empleado o IA worker
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left p-4 text-gray-400 font-semibold">NOMBRE</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">TIPO Y RESPONSABILIDADES</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">ESTATUS</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">SALARIO</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">FECHA CREACIÓN</th>
                  <th className="text-left p-4 text-gray-400 font-semibold">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => (
                  <tr key={worker.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {worker.type === "AI" ? (
                          <Bot className="h-5 w-5 text-blue-500" />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="text-white font-medium">{worker.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-400">
                        <span className="text-white">{worker.type === "AI" ? "IA" : "Humano"}</span> - {worker.responsibilities}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{worker.status}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-green-500 font-semibold">{formatSalary(worker)}</span>
                    </td>
                    <td className="p-4 text-gray-400">{formatDate(worker.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(worker)}
                          className="text-gray-400 hover:text-white hover:bg-gray-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteWorker(worker.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Worker Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription className="text-gray-400">
              Actualiza la información del empleado
            </DialogDescription>
          </DialogHeader>
          {editingWorker && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingWorker.name}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, name: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select
                  value={editingWorker.type}
                  onValueChange={(value) =>
                    setEditingWorker({ ...editingWorker, type: value })
                  }
                >
                  <SelectTrigger className="bg-black border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                    {workerTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-responsibilities">Responsabilidades</Label>
                <Textarea
                  id="edit-responsibilities"
                  value={editingWorker.responsibilities}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, responsibilities: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estatus</Label>
                <Input
                  id="edit-status"
                  value={editingWorker.status}
                  onChange={(e) =>
                    setEditingWorker({ ...editingWorker, status: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-paymentType">Tipo de Pago</Label>
                <Select
                  value={editingWorker.paymentType}
                  onValueChange={(value) =>
                    setEditingWorker({ ...editingWorker, paymentType: value })
                  }
                >
                  <SelectTrigger className="bg-black border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                    {paymentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(editingWorker.paymentType === "FIXED" || editingWorker.paymentType === "HYBRID") && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-salary">Salario / Costo Mensual</Label>
                    <Input
                      id="edit-salary"
                      type="number"
                      value={editingWorker.salary}
                      onChange={(e) =>
                        setEditingWorker({ ...editingWorker, salary: parseFloat(e.target.value) })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                )}
                {(editingWorker.paymentType === "PERCENTAGE" || editingWorker.paymentType === "HYBRID") && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-percentage">Porcentaje (%)</Label>
                    <Input
                      id="edit-percentage"
                      type="number"
                      value={editingWorker.percentage || ""}
                      onChange={(e) =>
                        setEditingWorker({ ...editingWorker, percentage: parseFloat(e.target.value) })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Fecha de Ingreso</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editingWorker.startDate}
                    onChange={(e) =>
                      setEditingWorker({ ...editingWorker, startDate: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentDate">Día de Pago (1-31)</Label>
                  <Input
                    id="edit-paymentDate"
                    type="number"
                    min="1"
                    max="31"
                    value={editingWorker.paymentDate || ""}
                    onChange={(e) =>
                      setEditingWorker({ ...editingWorker, paymentDate: parseInt(e.target.value) })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingWorker(null)
              }}
              className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateWorker} disabled={isEditing} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Actualizando..." : "Actualizar Empleado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



