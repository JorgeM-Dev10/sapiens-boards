"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Bot, Package, GripVertical, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface AISolution {
  id: string
  name: string
  description: string | null
  category: string
  categoryColor: string | null
  type: string
  price: number | null
  features: string | null
  icon: string | null
  isActive: boolean
  createdAt: string
  bundleItems?: any[]
}

// Colores predefinidos para categorías
const categoryColors = [
  { name: "Azul", value: "bg-blue-500" },
  { name: "Verde", value: "bg-green-500" },
  { name: "Morado", value: "bg-purple-500" },
  { name: "Rojo", value: "bg-red-500" },
  { name: "Amarillo", value: "bg-yellow-500" },
  { name: "Rosa", value: "bg-pink-500" },
  { name: "Naranja", value: "bg-orange-500" },
  { name: "Cian", value: "bg-cyan-500" },
  { name: "Gris", value: "bg-gray-500" },
  { name: "Índigo", value: "bg-indigo-500" },
]

function SortableSolutionCard({ solution, activeTab, onEdit, onDelete, getCategoryColor, getCategoryLabel }: {
  solution: AISolution
  activeTab: "INDIVIDUAL" | "BUNDLE"
  onEdit: (solution: AISolution) => void
  onDelete: (id: string) => void
  getCategoryColor: (category: string, categoryColor: string | null) => string
  getCategoryLabel: (category: string) => string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: solution.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Parsear características si existen
  let featuresList: string[] = []
  if (solution.features) {
    try {
      const parsed = JSON.parse(solution.features)
      featuresList = Array.isArray(parsed) ? parsed : [solution.features]
    } catch {
      featuresList = solution.features
        .split(/[,\n]/)
        .map(f => f.trim())
        .filter(f => f.length > 0)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-50" : ""}>
      <Card className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors flex flex-col h-full">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-center mb-6 h-96 overflow-hidden bg-gray-900 rounded-lg">
                {solution.icon ? (
                  <img 
                    src={solution.icon} 
                    alt={solution.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = activeTab === "INDIVIDUAL" 
                        ? '<svg class="h-32 w-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>'
                        : '<svg class="h-32 w-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
                    }}
                  />
                ) : (
                  activeTab === "INDIVIDUAL" ? (
                    <Bot className="h-32 w-32 text-gray-400" />
                  ) : (
                    <Package className="h-32 w-32 text-gray-400" />
                  )
                )}
              </div>
              <CardTitle className="text-white text-center text-2xl mb-3">{solution.name}</CardTitle>
              <div className="flex justify-center">
                <Badge className={`${getCategoryColor(solution.category, solution.categoryColor)} text-white text-sm px-3 py-1`}>
                  {getCategoryLabel(solution.category)}
                </Badge>
              </div>
            </div>
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-white transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {solution.description && (
            <div className="mb-4">
              <p className="text-base text-gray-300 leading-relaxed">{solution.description}</p>
            </div>
          )}
          {featuresList.length > 0 && (
            <div className="mb-6 flex-1">
              <h4 className="text-sm font-semibold text-white mb-3">Características:</h4>
              <ul className="space-y-2">
                {featuresList.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm text-gray-400">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="flex-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {activeTab === "BUNDLE" && solution.bundleItems && solution.bundleItems.length > 0 && (
            <div className="mb-6 flex-1">
              <h4 className="text-sm font-semibold text-white mb-3">Soluciones incluidas:</h4>
              <div className="space-y-2">
                {solution.bundleItems.map((bundleItem: any, index: number) => {
                  const includedSolution = bundleItem.solution
                  if (!includedSolution) return null
                  return (
                    <div
                      key={bundleItem.id || index}
                      className="flex items-center justify-between p-2 rounded bg-gray-900/50 border border-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-300">{includedSolution.name}</span>
                      </div>
                      <Badge className={`${getCategoryColor(includedSolution.category, includedSolution.categoryColor)} text-white text-xs`}>
                        {getCategoryLabel(includedSolution.category)}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="flex space-x-2 mt-auto pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(solution)}
              className="flex-1 bg-transparent border-gray-800 text-white hover:bg-gray-900"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(solution.id)}
              className="flex-1 bg-transparent border-red-800 text-red-400 hover:bg-red-600/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AISolutionsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"INDIVIDUAL" | "BUNDLE">("INDIVIDUAL")
  const [solutions, setSolutions] = useState<AISolution[]>([])
  const [allSolutions, setAllSolutions] = useState<AISolution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingSolution, setEditingSolution] = useState<AISolution | null>(null)
  const [newSolution, setNewSolution] = useState({
    name: "",
    description: "",
    category: "",
    categoryColor: "bg-blue-500",
    type: activeTab,
    price: "",
    features: "",
    icon: "",
    solutionIds: [] as string[],
  })
  const [showColorPicker, setShowColorPicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = solutions.findIndex((s) => s.id === active.id)
      const newIndex = solutions.findIndex((s) => s.id === over.id)

      const newSolutions = arrayMove(solutions, oldIndex, newIndex)
      setSolutions(newSolutions)

      // Actualizar orden en el servidor
      try {
        const solutionIds = newSolutions.map((s) => s.id)
        await fetch("/api/ai-solutions/reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            solutionIds,
            type: activeTab,
          }),
        })
      } catch (error) {
        console.error("Error reordering solutions:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el orden",
        })
        // Revertir cambios
        fetchSolutions()
      }
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

    if (!newSolution.category.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La categoría es requerida",
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
          category: "",
          categoryColor: "bg-blue-500",
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
    // Si es un bundle, extraer los IDs de las soluciones incluidas
    let solutionIds: string[] = []
    if (solution.type === "BUNDLE" && solution.bundleItems) {
      solutionIds = solution.bundleItems
        .map((bi: any) => bi.solution?.id || bi.solutionId)
        .filter((id: string) => id)
    }

    setEditingSolution({
      ...solution,
      bundleItems: solution.bundleItems || [],
      solutionIds: solutionIds,
    } as AISolution)
    setIsEditDialogOpen(true)
  }

  const handleUpdateSolution = async () => {
    if (!editingSolution) return

    setIsEditing(true)

    try {
      const updateData: any = {
        ...editingSolution,
        categoryColor: editingSolution.categoryColor || null,
      }
      
      // Si es un bundle, incluir solutionIds
      if (editingSolution.type === "BUNDLE") {
        const currentIds = (editingSolution as any).solutionIds || []
        updateData.solutionIds = currentIds
      }

      const response = await fetch(`/api/ai-solutions/${editingSolution.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
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

  const getCategoryColor = (category: string, categoryColor: string | null) => {
    return categoryColor || "bg-gray-500"
  }

  const getCategoryLabel = (category: string) => {
    return category
  }

  const toggleSolutionInBundle = (solutionId: string) => {
    if (activeTab === "BUNDLE") {
      setNewSolution((prev) => ({
        ...prev,
        solutionIds: prev.solutionIds.includes(solutionId)
          ? prev.solutionIds.filter((id) => id !== solutionId)
          : [...prev.solutionIds, solutionId],
      }))
    } else if (editingSolution && editingSolution.type === "BUNDLE") {
      setEditingSolution((prev) => {
        if (!prev) return prev
        const currentIds = (prev as any).solutionIds || []
        const newIds = currentIds.includes(solutionId)
          ? currentIds.filter((id: string) => id !== solutionId)
          : [...currentIds, solutionId]
        return { ...prev, solutionIds: newIds } as AISolution
      })
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
                Nueva Solución
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    placeholder={activeTab === "INDIVIDUAL" ? "Ej: AI Executive" : "Ej: Paquete Premium"}
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
                  <div className="flex gap-2">
                    <Input
                      id="category"
                      placeholder="Ej: Educación, Salud, Ventas..."
                      value={newSolution.category}
                      onChange={(e) =>
                        setNewSolution({ ...newSolution, category: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white flex-1"
                    />
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={`w-12 h-10 rounded border-2 border-gray-700 ${newSolution.categoryColor} hover:opacity-80 transition-opacity`}
                        title="Seleccionar color"
                      />
                      {showColorPicker && (
                        <div className="absolute top-12 right-0 bg-[#1a1a1a] border border-gray-800 rounded-lg p-2 z-50 grid grid-cols-5 gap-2 w-64">
                          {categoryColors.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              onClick={() => {
                                setNewSolution({ ...newSolution, categoryColor: color.value })
                                setShowColorPicker(false)
                              }}
                              className={`w-10 h-10 rounded ${color.value} hover:scale-110 transition-transform border-2 ${
                                newSolution.categoryColor === color.value ? "border-white" : "border-transparent"
                              }`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                        placeholder="Características separadas por comas o saltos de línea..."
                        value={newSolution.features}
                        onChange={(e) =>
                          setNewSolution({ ...newSolution, features: e.target.value })
                        }
                        className="bg-black border-gray-800 text-white"
                        rows={4}
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
                {activeTab === "BUNDLE" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="icon-bundle">URL de Imagen (opcional)</Label>
                      <Input
                        id="icon-bundle"
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
                    <div className="space-y-2">
                      <Label>Soluciones incluidas en el paquete</Label>
                    <div className="border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto bg-black">
                      {allSolutions.length === 0 ? (
                        <p className="text-gray-500 text-sm">No hay soluciones individuales disponibles</p>
                      ) : (
                        <div className="space-y-2">
                          {allSolutions.map((solution) => (
                            <div
                              key={solution.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-900 transition-colors cursor-pointer"
                              onClick={() => toggleSolutionInBundle(solution.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  newSolution.solutionIds.includes(solution.id)
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-600"
                                }`}>
                                  {newSolution.solutionIds.includes(solution.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="text-white text-sm">{solution.name}</span>
                              </div>
                              <Badge className={`${getCategoryColor(solution.category, solution.categoryColor)} text-white text-xs`}>
                                {solution.category}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Seleccionadas: {newSolution.solutionIds.length} solución(es)
                    </p>
                  </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setShowColorPicker(false)
                  }}
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={solutions.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {solutions.map((solution) => (
                  <SortableSolutionCard
                    key={solution.id}
                    solution={solution}
                    activeTab={activeTab}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteSolution}
                    getCategoryColor={getCategoryColor}
                    getCategoryLabel={getCategoryLabel}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Edit Solution Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <div className="flex gap-2">
                  <Input
                    id="edit-category"
                    placeholder="Ej: Educación, Salud, Ventas..."
                    value={editingSolution.category}
                    onChange={(e) =>
                      setEditingSolution({ ...editingSolution, category: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white flex-1"
                  />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className={`w-12 h-10 rounded border-2 border-gray-700 ${editingSolution.categoryColor || "bg-gray-500"} hover:opacity-80 transition-opacity`}
                      title="Seleccionar color"
                    />
                    {showColorPicker && (
                      <div className="absolute top-12 right-0 bg-[#1a1a1a] border border-gray-800 rounded-lg p-2 z-50 grid grid-cols-5 gap-2 w-64">
                        {categoryColors.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setEditingSolution({ ...editingSolution, categoryColor: color.value })
                              setShowColorPicker(false)
                            }}
                            className={`w-10 h-10 rounded ${color.value} hover:scale-110 transition-transform border-2 ${
                              (editingSolution.categoryColor || "bg-gray-500") === color.value ? "border-white" : "border-transparent"
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
                        setEditingSolution({ ...editingSolution, price: parseFloat(e.target.value) || null })
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
                      rows={4}
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
              {editingSolution.type === "BUNDLE" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-icon-bundle">URL de Imagen</Label>
                    <Input
                      id="edit-icon-bundle"
                      value={editingSolution.icon || ""}
                      onChange={(e) =>
                        setEditingSolution({ ...editingSolution, icon: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    <p className="text-xs text-gray-500">
                      💡 Clic derecho en imagen → Copiar dirección de imagen
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Soluciones incluidas en el paquete</Label>
                  <div className="border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto bg-black">
                    {allSolutions.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay soluciones individuales disponibles</p>
                    ) : (
                      <div className="space-y-2">
                        {allSolutions.map((solution) => {
                          const currentIds = (editingSolution as any).solutionIds || []
                          const bundleItemIds = editingSolution.bundleItems?.map((bi: any) => bi.solution?.id || bi.solutionId) || []
                          const isSelected = currentIds.includes(solution.id) || bundleItemIds.includes(solution.id)
                          
                          return (
                            <div
                              key={solution.id}
                              className="flex items-center justify-between p-2 rounded hover:bg-gray-900 transition-colors cursor-pointer"
                              onClick={() => {
                                const newIds = isSelected
                                  ? currentIds.filter((id: string) => id !== solution.id)
                                  : [...currentIds, solution.id]
                                setEditingSolution({ ...editingSolution, solutionIds: newIds } as AISolution)
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-blue-600 border-blue-600"
                                    : "border-gray-600"
                                }`}>
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="text-white text-sm">{solution.name}</span>
                              </div>
                              <Badge className={`${getCategoryColor(solution.category, solution.categoryColor)} text-white text-xs`}>
                                {solution.category}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
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
                setShowColorPicker(false)
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
