"use client"

import { useEffect, useState } from "react"
import { Plus, Building2, DollarSign, Clock, CheckCircle, Pencil, Trash2, Eye, Receipt, TrendingUp, Wallet, BarChart3, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface CompanyExpense {
  id: string
  amount: number
  category: string
  description: string | null
  createdAt: string
}

interface Client {
  id: string
  name: string
  description: string | null
  icon: string | null
  logoUrl?: string | null
  phase: string
  totalAmount: number
  paidAmount: number
  pendingAmount?: number
  paymentStatus?: "Pending" | "Paid"
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

const expenseCategories = [
  "Software",
  "Infraestructura",
  "Marketing",
  "Nómina",
  "Servicios",
  "Otros",
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
    logoUrl: "",
    phase: "PLANIFICACIÓN",
    totalAmount: "0",
    paidAmount: "0",
  })
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [expenses, setExpenses] = useState<CompanyExpense[]>([])
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false)
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false)
  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "",
    description: "",
  })
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(null)
  const [isEditExpenseDialogOpen, setIsEditExpenseDialogOpen] = useState(false)
  const [isExpenseUpdating, setIsExpenseUpdating] = useState(false)

  useEffect(() => {
    fetchClients()
    fetchExpenses()
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

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/company-expenses")
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
    }
  }

  const handleRegisterExpense = async () => {
    if (!newExpense.amount || !newExpense.category.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Monto y categoría son requeridos",
      })
      return
    }
    setIsExpenseSubmitting(true)
    try {
      const response = await fetch("/api/company-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description || undefined,
        }),
      })
      if (response.ok) {
        toast({ title: "Gasto registrado", description: "El gasto se ha guardado correctamente" })
        setIsExpenseDialogOpen(false)
        setNewExpense({ amount: "", category: "", description: "" })
        fetchExpenses()
      } else {
        const err = await response.json()
        throw new Error(err.error || "Error al registrar")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo registrar el gasto",
      })
    } finally {
      setIsExpenseSubmitting(false)
    }
  }

  const handleEditExpenseClick = (exp: CompanyExpense) => {
    setEditingExpense(exp)
    setIsEditExpenseDialogOpen(true)
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    if (editingExpense.amount === undefined || editingExpense.amount === null || !editingExpense.category?.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Monto y categoría son requeridos",
      })
      return
    }
    setIsExpenseUpdating(true)
    try {
      const response = await fetch(`/api/company-expenses/${editingExpense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: editingExpense.amount,
          category: editingExpense.category,
          description: editingExpense.description ?? undefined,
        }),
      })
      if (response.ok) {
        toast({ title: "Gasto actualizado", description: "El gasto se ha actualizado correctamente" })
        setIsEditExpenseDialogOpen(false)
        setEditingExpense(null)
        fetchExpenses()
      } else {
        const err = await response.json()
        throw new Error(err.error || "Error al actualizar")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el gasto",
      })
    } finally {
      setIsExpenseUpdating(false)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return
    try {
      const response = await fetch(`/api/company-expenses/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Gasto eliminado", description: "El gasto se ha eliminado" })
        fetchExpenses()
      } else {
        const err = await response.json()
        throw new Error(err.error || "Error al eliminar")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el gasto",
      })
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
          logoUrl: "",
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
          logoUrl: editingClient.logoUrl ?? undefined,
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

  // Métricas desde BD (nada hardcodeado)
  const totalIngresado = clients.reduce((sum, c) => sum + c.paidAmount, 0)
  const ingresoRestanteTotal = clients.reduce((sum, c) => sum + (c.pendingAmount ?? c.totalAmount - c.paidAmount), 0)
  const valorTotalPortafolio = clients.reduce((sum, c) => sum + c.totalAmount, 0)
  const gastosTotales = expenses.reduce((sum, e) => sum + e.amount, 0)
  const revenueNeto = totalIngresado - gastosTotales
  const margenNetoPct = totalIngresado > 0 ? (revenueNeto / totalIngresado) * 100 : 0
  const clienteMasRentable = clients.length > 0
    ? clients.reduce((best, c) => (c.totalAmount > (best?.totalAmount ?? 0) ? c : best), clients[0])
    : null

  const stats = {
    totalClients: clients.length,
    totalRevenue: totalIngresado,
    activeProjects: clients.filter(c => c.phase !== "COMPLETADO").length,
    completed: clients.filter(c => c.phase === "COMPLETADO").length,
    ingresoRestanteTotal,
    valorTotalPortafolio,
    gastosTotales,
    revenueNeto,
    margenNetoPct,
    clienteMasRentable,
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
                  <Label htmlFor="logoUrl">Logo (URL de imagen)</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    placeholder="https://ejemplo.com/logo.png"
                    value={newClient.logoUrl}
                    onChange={(e) =>
                      setNewClient({ ...newClient, logoUrl: e.target.value })
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
                <Label htmlFor="edit-logoUrl">Logo (URL de imagen)</Label>
                <Input
                  id="edit-logoUrl"
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={editingClient.logoUrl || ""}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, logoUrl: e.target.value })
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

        {/* Stats Cards - Orden: 1 a 10 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">${stats.valorTotalPortafolio.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">VALOR PORTAFOLIO</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">INGRESOS TOTALES</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Wallet className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">${stats.ingresoRestanteTotal.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">INGRESO RESTANTE</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stats.revenueNeto >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                  <BarChart3 className={`h-5 w-5 ${stats.revenueNeto >= 0 ? "text-green-500" : "text-red-500"}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${stats.revenueNeto >= 0 ? "text-green-400" : "text-red-400"}`}>
                    ${stats.revenueNeto.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">REVENUE NETO</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.totalClients}</p>
                  <p className="text-xs text-gray-400">TOTAL CLIENTES</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.activeProjects}</p>
                  <p className="text-xs text-gray-400">PROYECTOS ACTIVOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.completed}</p>
                  <p className="text-xs text-gray-400">COMPLETADOS</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Receipt className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">${stats.gastosTotales.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">GASTOS TOTALES</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stats.margenNetoPct.toFixed(1)}%</p>
                  <p className="text-xs text-gray-400">MARGEN NETO</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Award className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">CLIENTE MÁS RENTABLE</p>
                  <p className="text-sm font-bold text-white truncate">
                    {stats.clienteMasRentable
                      ? `${stats.clienteMasRentable.name} — $${stats.clienteMasRentable.totalAmount.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const pending = client.pendingAmount ?? client.totalAmount - client.paidAmount
            const status = client.paymentStatus ?? (pending > 0 ? "Pending" : "Paid")
            return (
            <Card
              key={client.id}
              className={`border-gray-800 hover:border-gray-700 transition-colors overflow-hidden relative ${client.logoUrl ? "" : "bg-[#1a1a1a]"}`}
            >
              {client.logoUrl && (
                <>
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      backgroundImage: `url(${client.logoUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: 0.24,
                      filter: "brightness(0.9) contrast(1.05)",
                    }}
                  />
                  <div className="absolute inset-0 z-[1] bg-black/60" />
                </>
              )}
              <div className={client.logoUrl ? "relative z-10" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {!client.logoUrl && (
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-white">{client.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold text-white rounded ${getPhaseColor(client.phase)}`}>
                          {client.phase}
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          status === "Paid"
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}>
                          {status === "Paid" ? "Paid" : "Pending"}
                        </span>
                      </div>
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
                    <span className="text-gray-400">Total del Proyecto:</span>
                    <span className="text-white font-bold">
                      ${client.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pagado:</span>
                    <span className="text-white font-bold">
                      ${client.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Pendiente por pagar:</span>
                    <span className="text-white font-bold">
                      ${pending.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
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
              </div>
            </Card>
          )})}
        </div>

        {/* Sección financiera: Gastos */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Gastos de la empresa</h2>
            <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-900 border border-white">
                  <Receipt className="mr-2 h-4 w-4" />
                  Registrar Gasto
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Registrar Gasto</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Gasto operativo de la empresa (Software, Infraestructura, etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="exp-amount">Monto</Label>
                    <Input
                      id="exp-amount"
                      type="number"
                      placeholder="0"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-category">Categoría</Label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}
                    >
                      <SelectTrigger className="bg-black border-gray-800 text-white">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp-desc">Descripción (opcional)</Label>
                    <Textarea
                      id="exp-desc"
                      placeholder="Ej: Cursor Pro, Railway..."
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="bg-black border-gray-800 text-white"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsExpenseDialogOpen(false)}
                    className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleRegisterExpense} disabled={isExpenseSubmitting}>
                    {isExpenseSubmitting ? "Guardando..." : "Registrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {/* Edit Expense Dialog */}
          <Dialog open={isEditExpenseDialogOpen} onOpenChange={setIsEditExpenseDialogOpen}>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Editar Gasto</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Modifica el gasto registrado
                </DialogDescription>
              </DialogHeader>
              {editingExpense && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Monto</Label>
                    <Input
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select
                      value={editingExpense.category}
                      onValueChange={(v) => setEditingExpense({ ...editingExpense, category: v })}
                    >
                      <SelectTrigger className="bg-black border-gray-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción (opcional)</Label>
                    <Textarea
                      value={editingExpense.description || ""}
                      onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                      className="bg-black border-gray-800 text-white"
                      rows={2}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => { setIsEditExpenseDialogOpen(false); setEditingExpense(null) }}
                  className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                >
                  Cancelar
                </Button>
                <Button onClick={handleUpdateExpense} disabled={isExpenseUpdating}>
                  {isExpenseUpdating ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Gastos recientes</CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Ordenados por fecha (más reciente primero)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No hay gastos registrados. Usa &quot;Registrar Gasto&quot; para agregar uno.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/50 border border-gray-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">${exp.amount.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm truncate">{exp.description || exp.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300">{exp.category}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(exp.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-blue-400"
                          onClick={() => handleEditExpenseClick(exp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-400"
                          onClick={() => handleDeleteExpense(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

