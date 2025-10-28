"use client"

import { useEffect, useState } from "react"
import { Plus, Building2, DollarSign, Clock, CheckCircle, Pencil, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Client {
  id: string
  name: string
  description: string | null
  icon: string | null
  phase: string
  totalAmount: number
  paidAmount: number
  createdAt: string
  timelines: any[]
}

const phases = [
  { value: "PLANIFICACIÓN", label: "PLANIFICACIÓN", color: "bg-orange-500" },
  { value: "DESARROLLO", label: "DESARROLLO", color: "bg-blue-500" },
  { value: "PRUEBAS", label: "PRUEBAS", color: "bg-purple-500" },
  { value: "DESPLIEGUE", label: "DESPLIEGUE", color: "bg-green-700" },
  { value: "COMPLETADO", label: "COMPLETADO", color: "bg-green-500" },
]

export default function ClientsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newClient, setNewClient] = useState({
    name: "",
    description: "",
    icon: "",
    phase: "PLANIFICACIÓN",
    totalAmount: "0",
    paidAmount: "0",
  })
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los clientes",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateClient = async () => {
    if (!newClient.name.trim() || !newClient.totalAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y monto total son requeridos",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClient),
      })

      if (response.ok) {
        toast({
          title: "Cliente creado",
          description: "El cliente se ha creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewClient({
          name: "",
          description: "",
          icon: "",
          phase: "PLANIFICACIÓN",
          totalAmount: "0",
          paidAmount: "0",
        })
        fetchClients()
      } else {
        throw new Error("Error al crear el cliente")
      }
    } catch (error) {
      console.error("Error creating client:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el cliente",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (client: Client) => {
    setEditingClient(client)
    setIsEditDialogOpen(true)
  }

  const handleUpdateClient = async () => {
    if (!editingClient) return

    if (!editingClient.name.trim() || !editingClient.totalAmount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre y monto total son requeridos",
      })
      return
    }

    setIsEditing(true)

    try {
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingClient.name,
          description: editingClient.description,
          phase: editingClient.phase,
          totalAmount: editingClient.totalAmount,
          paidAmount: editingClient.paidAmount,
        }),
      })

      if (response.ok) {
        toast({
          title: "Cliente actualizado",
          description: "El cliente se ha actualizado exitosamente",
        })
        setIsEditDialogOpen(false)
        setEditingClient(null)
        fetchClients()
      } else {
        throw new Error("Error al actualizar el cliente")
      }
    } catch (error) {
      console.error("Error updating client:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el cliente",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Cliente eliminado",
          description: "El cliente se ha eliminado exitosamente",
        })
        fetchClients()
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el cliente",
      })
    }
  }

  const getPhaseColor = (phase: string) => {
    return phases.find(p => p.value === phase)?.color || "bg-gray-500"
  }

  const getProgressPercentage = (paid: number, total: number) => {
    return total > 0 ? (paid / total) * 100 : 0
  }

  // Estadísticas
  const stats = {
    totalClients: clients.length,
    totalRevenue: clients.reduce((sum, c) => sum + c.paidAmount, 0),
    activeProjects: clients.filter(c => c.phase !== "COMPLETADO").length,
    completed: clients.filter(c => c.phase === "COMPLETADO").length,
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        action={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-900 border border-white">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Cliente</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Agrega un nuevo cliente al sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Cliente</Label>
                  <Input
                    id="name"
                    placeholder="Ej: CORE"
                    value={newClient.name}
                    onChange={(e) =>
                      setNewClient({ ...newClient, name: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción del proyecto..."
                    value={newClient.description}
                    onChange={(e) =>
                      setNewClient({ ...newClient, description: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase">Estado del Proyecto</Label>
                  <Select
                    value={newClient.phase}
                    onValueChange={(value) =>
                      setNewClient({ ...newClient, phase: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue placeholder="Selecciona una fase" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {phases.map((phase) => (
                        <SelectItem key={phase.value} value={phase.value}>
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${phase.color}`}></span>
                          {phase.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Monto Total</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      placeholder="350000"
                      value={newClient.totalAmount}
                      onChange={(e) =>
                        setNewClient({ ...newClient, totalAmount: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paidAmount">Monto Pagado</Label>
                    <Input
                      id="paidAmount"
                      type="number"
                      placeholder="175000"
                      value={newClient.paidAmount}
                      onChange={(e) =>
                        setNewClient({ ...newClient, paidAmount: e.target.value })
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
                <Button onClick={handleCreateClient} disabled={isCreating}>
                  {isCreating ? "Creando..." : "Crear Cliente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Edit Client Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription className="text-gray-400">
              Actualiza la información del cliente
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre del Cliente</Label>
                <Input
                  id="edit-name"
                  placeholder="Ej: CORE"
                  value={editingClient.name}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, name: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Descripción del proyecto..."
                  value={editingClient.description || ""}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, description: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phase">Estado del Proyecto</Label>
                <Select
                  value={editingClient.phase}
                  onValueChange={(value) =>
                    setEditingClient({ ...editingClient, phase: value })
                  }
                >
                  <SelectTrigger className="bg-black border-gray-800 text-white">
                    <SelectValue placeholder="Selecciona una fase" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                    {phases.map((phase) => (
                      <SelectItem key={phase.value} value={phase.value}>
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${phase.color}`}></span>
                        {phase.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalAmount">Monto Total</Label>
                  <Input
                    id="edit-totalAmount"
                    type="number"
                    placeholder="350000"
                    value={editingClient.totalAmount}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, totalAmount: parseFloat(e.target.value) })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paidAmount">Monto Pagado</Label>
                  <Input
                    id="edit-paidAmount"
                    type="number"
                    placeholder="175000"
                    value={editingClient.paidAmount}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, paidAmount: parseFloat(e.target.value) })
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
                setEditingClient(null)
              }}
              className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateClient} disabled={isEditing} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Actualizando..." : "Actualizar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Gestión de Clientes</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalClients}</p>
                  <p className="text-sm text-gray-400">TOTAL CLIENTES</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">INGRESOS TOTALES</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.activeProjects}</p>
                  <p className="text-sm text-gray-400">PROYECTOS ACTIVOS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.completed}</p>
                  <p className="text-sm text-gray-400">COMPLETADOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => (
            <Card key={client.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{client.name}</CardTitle>
                      <span className={`inline-block mt-1 px-2 py-1 text-xs font-semibold text-white rounded ${getPhaseColor(client.phase)}`}>
                        {client.phase}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {client.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">TOTAL DEL PROYECTO:</span>
                    <span className="text-white font-bold">
                      ${client.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">PAGADO:</span>
                    <span className="text-white font-bold">
                      ${client.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${getProgressPercentage(client.paidAmount, client.totalAmount)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/clients/${client.id}`)}
                    className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Timeline
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditClick(client)
                      }}
                      className="text-gray-400 hover:text-blue-400 hover:bg-blue-600/10 transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClient(client.id)
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

