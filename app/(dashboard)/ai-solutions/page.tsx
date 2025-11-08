"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Bot, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface AISolution {
  id: string
  name: string
  description: string | null
  category: string
  type: string
  price: number | null
  features: string | null
  icon: string | null
  isActive: boolean
  createdAt: string
  bundleItems?: any[]
}

const categories = [
  { value: "VENTAS", label: "Ventas", color: "bg-blue-500" },
  { value: "PROJECT_MANAGEMENT", label: "Project Management", color: "bg-purple-500" },
  { value: "ADMINISTRATIVA", label: "Administrativa", color: "bg-green-500" },
  { value: "OTRA", label: "Otra", color: "bg-gray-500" },
]

export default function AISolutionsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "BUNDLE">("INDIVIDUAL")
  const [solutions, setSolutions] = useState<AISolution[]>([])
  const [allSolutions, setAllSolutions] = useState<AISolution[]>([]) // Para seleccionar en bundles
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSolution, setEditingSolution] = useState<AISolution | null>(null)
  const [newSolution, setNewSolution] = useState({
    name: "",
    description: "",
    category: "VENTAS",
    type: activeTab,
    price: "",
    features: "",
    icon: "",
    solutionIds: [] as string[], // Para bundles
  })

  useEffect(() => {
    fetchSolutions()
    fetchAllSolutions()
  }, [activeTab])

  const fetchSolutions = async () => {
    try {
      const response = await fetch(`/api/ai-solutions?type=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setSolutions(data)
      }
    } catch (error) {
      console.error("Error fetching solutions:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las soluciones",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllSolutions = async () => {
    try {
      const response = await fetch("/api/ai-solutions?type=INDIVIDUAL")
      if (response.ok) {
        const data = await response.json()
        setAllSolutions(data)
      }
    } catch (error) {
      console.error("Error fetching all solutions:", error)
    }
  }

  const handleCreateSolution = async () => {
    if (!newSolution.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre es requerido",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/ai-solutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newSolution,
          price: newSolution.price ? parseFloat(newSolution.price) : null,
          type: activeTab,
        }),
      })

      if (response.ok) {
        toast({
          title: "Solución creada",
          description: "La solución se ha creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewSolution({
          name: "",
          description: "",
          category: "VENTAS",
          type: activeTab,
          price: "",
          features: "",
          icon: "",
          solutionIds: [],
        })
        fetchSolutions()
      } else {
        throw new Error("Error al crear la solución")
      }
    } catch (error) {
      console.error("Error creating solution:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la solución",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = (solution: AISolution) => {
    setEditingSolution({
      ...solution,
      bundleItems: solution.bundleItems || [],
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateSolution = async () => {
    if (!editingSolution) return

    setIsEditing(true)

    try {
      const response = await fetch(`/api/ai-solutions/${editingSolution.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingSolution),
      })

      if (response.ok) {
        toast({
          title: "Solución actualizada",
          description: "La solución se ha actualizado exitosamente",
        })
        setIsEditDialogOpen(false)
        setEditingSolution(null)
        fetchSolutions()
      } else {
        throw new Error("Error al actualizar la solución")
      }
    } catch (error) {
      console.error("Error updating solution:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar la solución",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteSolution = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta solución?")) {
      return
    }

    try {
      const response = await fetch(`/api/ai-solutions/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Solución eliminada",
          description: "La solución se ha eliminado exitosamente",
        })
        fetchSolutions()
      }
    } catch (error) {
      console.error("Error deleting solution:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la solución",
      })
    }
  }

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || "bg-gray-500"
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category
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
                Nueva Solución
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {activeTab === "INDIVIDUAL" ? "Nueva Solución Individual" : "Nuevo Paquete de Soluciones"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {activeTab === "INDIVIDUAL" 
                    ? "Crea una nueva solución de IA individual" 
                    : "Crea un paquete que incluya múltiples soluciones"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    placeholder="Ej: AI Executive"
                    value={newSolution.name}
                    onChange={(e) =>
                      setNewSolution({ ...newSolution, name: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Descripción de la solución..."
                    value={newSolution.description}
                    onChange={(e) =>
                      setNewSolution({ ...newSolution, description: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newSolution.category}
                    onValueChange={(value) =>
                      setNewSolution({ ...newSolution, category: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {activeTab === "INDIVIDUAL" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="price">Precio (opcional)</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="2500"
                        value={newSolution.price}
                        onChange={(e) =>
                          setNewSolution({ ...newSolution, price: e.target.value })
                        }
                        className="bg-black border-gray-800 text-white"
                      />
                    </div>
                <div className="space-y-2">
                  <Label htmlFor="features">Características (opcional)</Label>
                  <Textarea
                    id="features"
                    placeholder="Características separadas por comas..."
                    value={newSolution.features}
                    onChange={(e) =>
                      setNewSolution({ ...newSolution, features: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">URL de Imagen (opcional)</Label>
                  <Input
                    id="icon"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={newSolution.icon}
                    onChange={(e) =>
                      setNewSolution({ ...newSolution, icon: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    💡 Clic derecho en imagen → Copiar dirección de imagen
                  </p>
                </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateSolution} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? "Creando..." : "Crear Solución"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Catálogo de Soluciones AI</h1>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-800">
          <button
            onClick={() => {
              setActiveTab("INDIVIDUAL")
              setIsLoading(true)
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "INDIVIDUAL"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Bot className="inline-block mr-2 h-4 w-4" />
            Soluciones Individuales
          </button>
          <button
            onClick={() => {
              setActiveTab("BUNDLE")
              setIsLoading(true)
            }}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === "BUNDLE"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Package className="inline-block mr-2 h-4 w-4" />
            Paquetes
          </button>
        </div>

        {solutions.length === 0 ? (
          <Card className="border-dashed bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-8 text-center">
              <p className="text-gray-400">
                No tienes {activeTab === "INDIVIDUAL" ? "soluciones individuales" : "paquetes"} registrados
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Agrega {activeTab === "INDIVIDUAL" ? "tu primera solución" : "tu primer paquete"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution) => (
              <Card key={solution.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-center mb-4 h-64 overflow-hidden bg-gray-900 rounded-lg">
                    {solution.icon ? (
                      <img 
                        src={solution.icon} 
                        alt={solution.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Si falla la imagen, mostrar icono por defecto
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement!.innerHTML = activeTab === "INDIVIDUAL" 
                            ? '<svg class="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'
                            : '<svg class="h-24 w-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                        }}
                      />
                    ) : (
                      activeTab === "INDIVIDUAL" ? (
                        <Bot className="h-24 w-24 text-gray-400" />
                      ) : (
                        <Package className="h-24 w-24 text-gray-400" />
                      )
                    )}
                  </div>
                  <CardTitle className="text-white text-center text-xl">{solution.name}</CardTitle>
                  <div className="flex justify-center mt-2">
                    <Badge className={`${getCategoryColor(solution.category)} text-white`}>
                      {getCategoryLabel(solution.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {solution.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{solution.description}</p>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(solution)}
                      className="flex-1 bg-transparent border-gray-800 text-white hover:bg-gray-900"
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSolution(solution.id)}
                      className="flex-1 bg-transparent border-red-800 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Solution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Solución</DialogTitle>
            <DialogDescription className="text-gray-400">
              Actualiza la información de la solución
            </DialogDescription>
          </DialogHeader>
          {editingSolution && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingSolution.name}
                  onChange={(e) =>
                    setEditingSolution({ ...editingSolution, name: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editingSolution.description || ""}
                  onChange={(e) =>
                    setEditingSolution({ ...editingSolution, description: e.target.value })
                  }
                  className="bg-black border-gray-800 text-white"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select
                  value={editingSolution.category}
                  onValueChange={(value) =>
                    setEditingSolution({ ...editingSolution, category: value })
                  }
                >
                  <SelectTrigger className="bg-black border-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingSolution.type === "INDIVIDUAL" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Precio</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={editingSolution.price || ""}
                      onChange={(e) =>
                        setEditingSolution({ ...editingSolution, price: parseFloat(e.target.value) })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-features">Características</Label>
                    <Textarea
                      id="edit-features"
                      value={editingSolution.features || ""}
                      onChange={(e) =>
                        setEditingSolution({ ...editingSolution, features: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-icon">URL de Imagen</Label>
                    <Input
                      id="edit-icon"
                      value={editingSolution.icon || ""}
                      onChange={(e) =>
                        setEditingSolution({ ...editingSolution, icon: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingSolution(null)
              }}
              className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateSolution} disabled={isEditing} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Actualizando..." : "Actualizar Solución"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

