"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Video, FileText, Link as LinkIcon, X, Play, ExternalLink, GraduationCap, FileImage, FolderOpen, Upload } from "lucide-react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LibraryItem {
  id: string
  title: string
  description: string | null
  url: string
  type: string
  category: string | null
  thumbnail: string | null
  createdAt: string
  updatedAt: string
}

export default function LibraryPage() {
  const { toast } = useToast()
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<LibraryItem | null>(null)
  const [activeTab, setActiveTab] = useState<"CURSOS" | "DIAGRAMAS" | "DOCUMENTOS">("CURSOS")
  const [categories, setCategories] = useState<string[]>([])
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    url: "",
    type: "VIDEO", // Se ajustará según activeTab
    category: "",
    thumbnail: "",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Ajustar tipo cuando cambia el tab
  useEffect(() => {
    switch (activeTab) {
      case "CURSOS":
        setNewItem(prev => ({ ...prev, type: "VIDEO" }))
        break
      case "DIAGRAMAS":
        setNewItem(prev => ({ ...prev, type: "PDF" }))
        break
      case "DOCUMENTOS":
        setNewItem(prev => ({ ...prev, type: "DOCUMENT" }))
        break
    }
  }, [activeTab])


  useEffect(() => {
    fetchLibraryItems()
  }, [])

  useEffect(() => {
    filterItems()
  }, [libraryItems, activeTab])

  const fetchLibraryItems = async () => {
    try {
      const response = await fetch("/api/library")
      if (response.ok) {
        const data = await response.json()
        setLibraryItems(data)
        // Extraer categorías únicas
        const uniqueCategories = Array.from(
          new Set(data.map((item: LibraryItem) => item.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error("Error fetching library items:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los recursos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = [...libraryItems]

    // Filtrar según el tab activo
    switch (activeTab) {
      case "CURSOS":
        // Solo videos
        filtered = filtered.filter((item) => item.type === "VIDEO")
        break
      case "DIAGRAMAS":
        // Solo PDFs (diagramas de procesos)
        filtered = filtered.filter((item) => item.type === "PDF")
        break
      case "DOCUMENTOS":
        // Documentos generales (DOCUMENT y LINK)
        filtered = filtered.filter((item) => 
          item.type === "DOCUMENT" || item.type === "LINK"
        )
        break
    }

    setFilteredItems(filtered)
  }

  const handleCreateItem = async () => {
    if (!newItem.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    if (activeTab === "DIAGRAMAS" && !uploadedFile && !newItem.url.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes subir un archivo PDF o proporcionar una URL",
      })
      return
    }

    if (activeTab !== "DIAGRAMAS" && !newItem.url.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "La URL es requerida",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newItem,
          description: newItem.description || null,
          category: newItem.category || null,
          thumbnail: newItem.thumbnail || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: activeTab === "DIAGRAMAS" 
            ? "Diagrama subido correctamente" 
            : "Recurso agregado correctamente",
        })
        setIsCreateDialogOpen(false)
        setNewItem({
          title: "",
          description: "",
          url: "",
          type: activeTab === "CURSOS" ? "VIDEO" : activeTab === "DIAGRAMAS" ? "PDF" : "DOCUMENT",
          category: "",
          thumbnail: "",
        })
        setUploadedFile(null)
        fetchLibraryItems()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al crear el recurso",
        })
      }
    } catch (error) {
      console.error("Error creating library item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al crear el recurso",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.url.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Título y URL son requeridos",
      })
      return
    }

    setIsEditing(true)

    try {
      const response = await fetch(`/api/library/${editingItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingItem.title,
          description: editingItem.description || null,
          url: editingItem.url,
          type: editingItem.type,
          category: editingItem.category || null,
          thumbnail: editingItem.thumbnail || null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Recurso actualizado correctamente",
        })
        setIsEditDialogOpen(false)
        setEditingItem(null)
        fetchLibraryItems()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al actualizar el recurso",
        })
      }
    } catch (error) {
      console.error("Error updating library item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar el recurso",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este recurso?")) {
      return
    }

    try {
      const response = await fetch(`/api/library/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Recurso eliminado correctamente",
        })
        fetchLibraryItems()
      } else {
        const error = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: error.error || "Error al eliminar el recurso",
        })
      }
    } catch (error) {
      console.error("Error deleting library item:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al eliminar el recurso",
      })
    }
  }

  const getVideoEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const youtubeMatch = url.match(youtubeRegex)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/
    const vimeoMatch = url.match(vimeoRegex)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // Si es un archivo de video directo (.mp4, .webm, etc.)
    if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
      return url
    }

    return null
  }

  const isVideoEmbeddable = (url: string): boolean => {
    return getVideoEmbedUrl(url) !== null
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "VIDEO":
        return <Video className="h-5 w-5" />
      case "PDF":
        return <FileText className="h-5 w-5" />
      case "LINK":
        return <LinkIcon className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "VIDEO":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "PDF":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "LINK":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const handleViewItem = (item: LibraryItem) => {
    setViewingItem(item)
    setIsViewDialogOpen(true)
  }

  const getTotalCount = () => filteredItems.length

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-7xl">
          {/* Estadísticas */}
          <div className="mb-4">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      {activeTab === "CURSOS" ? "Total Cursos" :
                       activeTab === "DIAGRAMAS" ? "Total Diagramas" :
                       "Total Documentos"}
                    </p>
                    <p className="text-2xl font-bold text-white">{getTotalCount()}</p>
                  </div>
                  {activeTab === "CURSOS" && <GraduationCap className="h-8 w-8 text-blue-400 opacity-50" />}
                  {activeTab === "DIAGRAMAS" && <FileImage className="h-8 w-8 text-blue-400 opacity-50" />}
                  {activeTab === "DOCUMENTOS" && <FolderOpen className="h-8 w-8 text-blue-400 opacity-50" />}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">Librería</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open)
              if (!open) {
                // Resetear formulario al cerrar
                setNewItem({
                  title: "",
                  description: "",
                  url: "",
                  type: activeTab === "CURSOS" ? "VIDEO" : activeTab === "DIAGRAMAS" ? "PDF" : "DOCUMENT",
                  category: "",
                  thumbnail: "",
                })
                setUploadedFile(null)
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  {activeTab === "CURSOS" ? "Agregar Nuevo Curso" :
                   activeTab === "DIAGRAMAS" ? "Agregar Diagrama" :
                   "Agregar Documento"}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {activeTab === "CURSOS" ? "Agregar Nuevo Curso" :
                     activeTab === "DIAGRAMAS" ? "Agregar Diagrama" :
                     "Agregar Documento"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {activeTab === "CURSOS" ? "Agrega un nuevo curso a tu librería" :
                     activeTab === "DIAGRAMAS" ? "Sube un diagrama PDF de proceso de cliente" :
                     "Agrega un documento o enlace a tu librería"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={newItem.title}
                      onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder={
                        activeTab === "CURSOS" ? "Ej: Tutorial de React" :
                        activeTab === "DIAGRAMAS" ? "Ej: Diagrama de proceso - Cliente X" :
                        "Ej: Documento de referencia"
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder="Descripción del recurso..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value) => setNewItem({ ...newItem, type: value })}
                    >
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-gray-800">
                        {activeTab === "CURSOS" && <SelectItem value="VIDEO">Video</SelectItem>}
                        {activeTab === "DIAGRAMAS" && <SelectItem value="PDF">PDF</SelectItem>}
                        {activeTab === "DOCUMENTOS" && (
                          <>
                            <SelectItem value="DOCUMENT">Documento</SelectItem>
                            <SelectItem value="LINK">Enlace</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-400 mt-1">
                      {activeTab === "CURSOS" && "Los cursos son videos educativos"}
                      {activeTab === "DIAGRAMAS" && "Los diagramas son PDFs de procesos de clientes"}
                      {activeTab === "DOCUMENTOS" && "Documentos generales y enlaces"}
                    </p>
                  </div>
                  {activeTab === "DIAGRAMAS" ? (
                    <div>
                      <Label htmlFor="pdf-upload">Subir PDF *</Label>
                      <div className="mt-2">
                        <label
                          htmlFor="pdf-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadedFile ? (
                              <>
                                <FileText className="w-10 h-10 mb-2 text-blue-400" />
                                <p className="mb-2 text-sm text-white">{uploadedFile.name}</p>
                                <p className="text-xs text-gray-400">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                              </>
                            ) : (
                              <>
                                <Upload className="w-10 h-10 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-400">
                                  <span className="font-semibold">Click para subir</span> o arrastra el archivo
                                </p>
                                <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
                              </>
                            )}
                          </div>
                          <input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "El archivo es demasiado grande. Máximo 10MB",
                                  })
                                  return
                                }
                                setUploadedFile(file)
                                setIsUploading(true)
                                try {
                                  // Convertir a base64
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    const base64String = reader.result as string
                                    setNewItem({ ...newItem, url: base64String })
                                    setIsUploading(false)
                                  }
                                  reader.onerror = () => {
                                    toast({
                                      variant: "destructive",
                                      title: "Error",
                                      description: "Error al leer el archivo",
                                    })
                                    setIsUploading(false)
                                  }
                                  reader.readAsDataURL(file)
                                } catch (error) {
                                  console.error("Error uploading file:", error)
                                  toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Error al procesar el archivo",
                                  })
                                  setIsUploading(false)
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                      {isUploading && (
                        <p className="text-xs text-blue-400 mt-2">Subiendo archivo...</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder={
                          activeTab === "CURSOS" ? "https://youtube.com/..." :
                          "https://..."
                        }
                      />
                      {newItem.type === "VIDEO" && (
                        <p className="text-xs text-gray-400 mt-1">
                          Soporta YouTube, Vimeo o URLs directas de video (.mp4, .webm, etc.)
                        </p>
                      )}
                    </div>
                  )}
                  {newItem.type === "VIDEO" && (
                    <div>
                      <Label htmlFor="thumbnail">Thumbnail (opcional)</Label>
                      <Input
                        id="thumbnail"
                        value={newItem.thumbnail}
                        onChange={(e) => setNewItem({ ...newItem, thumbnail: e.target.value })}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="URL de imagen thumbnail"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="bg-gray-900 border-gray-700 text-white"
                      placeholder={
                        activeTab === "CURSOS" ? "Ej: React, Next.js, TypeScript" :
                        activeTab === "DIAGRAMAS" ? "Ej: Nombre del cliente o proceso" :
                        "Ej: Documentación, Referencias, Guías"
                      }
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
                    onClick={handleCreateItem}
                    disabled={isCreating || isUploading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isCreating ? (
                      activeTab === "DIAGRAMAS" ? "Subiendo..." : "Creando..."
                    ) : (
                      activeTab === "CURSOS" ? "Crear Curso" :
                      activeTab === "DIAGRAMAS" ? "Subir Diagrama" :
                      "Crear Documento"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-gray-800">
            <button
              onClick={() => {
                setActiveTab("CURSOS")
                setNewItem({ ...newItem, type: "VIDEO" })
              }}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "CURSOS"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Cursos
            </button>
            <button
              onClick={() => {
                setActiveTab("DIAGRAMAS")
                setNewItem({ ...newItem, type: "PDF" })
              }}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "DIAGRAMAS"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FileImage className="h-4 w-4" />
              Diagramas
            </button>
            <button
              onClick={() => {
                setActiveTab("DOCUMENTOS")
                setNewItem({ ...newItem, type: "DOCUMENT" })
              }}
              className={`px-4 py-2 font-semibold transition-colors flex items-center gap-2 ${
                activeTab === "DOCUMENTOS"
                  ? "text-blue-500 border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              Documentos
            </button>
          </div>

          {/* Grid de recursos */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400">Cargando recursos...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FileText className="h-16 w-16 mb-4 opacity-50" />
              <p>No hay recursos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-[#1a1a1a] border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex flex-col h-full overflow-hidden group cursor-pointer"
                  >
                    {/* Thumbnail destacado - siempre visible */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 overflow-hidden">
                      {item.thumbnail && item.type === "VIDEO" ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : null}
                      {/* Fallback cuando no hay thumbnail o es PDF/DOCUMENT */}
                      {(!item.thumbnail || item.type === "PDF" || item.type === "DOCUMENT" || item.type === "LINK") && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 group-hover:from-gray-700 group-hover:via-gray-800 group-hover:to-gray-700 transition-all duration-300">
                          <div className={`p-4 rounded-xl ${getTypeColor(item.type)} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 group-hover:text-gray-400 transition-colors">{item.type}</p>
                        </div>
                      )}
                      {/* Badge de tipo */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`${getTypeColor(item.type)} border-0 text-xs`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{item.type}</span>
                        </Badge>
                      </div>
                      {/* Overlay con play/view button - solo para videos */}
                      {item.type === "VIDEO" && (
                        <div 
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={() => handleViewItem(item)}
                        >
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 transform hover:scale-110 transition-transform">
                            <Play className="h-8 w-8 text-white" fill="white" />
                          </div>
                        </div>
                      )}
                      {/* Overlay para PDFs y documentos */}
                      {(item.type === "PDF" || item.type === "DOCUMENT" || item.type === "LINK") && (
                        <div 
                          className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          onClick={() => handleViewItem(item)}
                        >
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 transform hover:scale-105 transition-transform">
                            <p className="text-white text-sm font-medium">Ver {item.type === "PDF" ? "PDF" : item.type === "DOCUMENT" ? "Documento" : "Enlace"}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-white text-lg line-clamp-2 min-h-[3rem]">
                        {item.title}
                      </CardTitle>
                      {item.category && (
                        <Badge
                          variant="outline"
                          className="mt-2 text-xs border-gray-700 text-gray-400 w-fit"
                        >
                          {item.category}
                        </Badge>
                      )}
                    </CardHeader>
                    
                    <CardContent className="flex-1 flex flex-col pt-0">
                      {item.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-auto">
                        <Button
                          onClick={() => handleViewItem(item)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingItem({ ...item })
                            setIsEditDialogOpen(true)
                          }}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400 hover:bg-gray-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteItem(item.id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400 hover:bg-red-600/20 hover:border-red-500/50 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Recurso</DialogTitle>
            <DialogDescription className="text-gray-400">
              Edita la información del recurso
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título *</Label>
                <Input
                  id="edit-title"
                  value={editingItem.title}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, title: e.target.value })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, description: e.target.value })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Tipo *</Label>
                <Select
                  value={editingItem.type}
                  onValueChange={(value) =>
                    setEditingItem({ ...editingItem, type: value })
                  }
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-800">
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="LINK">Enlace</SelectItem>
                    <SelectItem value="DOCUMENT">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-url">URL *</Label>
                <Input
                  id="edit-url"
                  value={editingItem.url}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, url: e.target.value })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              {editingItem.type === "VIDEO" && (
                <div>
                  <Label htmlFor="edit-thumbnail">Thumbnail (opcional)</Label>
                  <Input
                    id="edit-thumbnail"
                    value={editingItem.thumbnail || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, thumbnail: e.target.value })
                    }
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="edit-category">Categoría</Label>
                <Input
                  id="edit-category"
                  value={editingItem.category || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, category: e.target.value })
                  }
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditItem}
              disabled={isEditing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEditing ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualización */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{viewingItem?.title}</DialogTitle>
            {viewingItem?.description && (
              <DialogDescription className="text-gray-400">
                {viewingItem.description}
              </DialogDescription>
            )}
          </DialogHeader>
          {viewingItem && (
            <div className="mt-4">
              {viewingItem.type === "VIDEO" && isVideoEmbeddable(viewingItem.url) ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={getVideoEmbedUrl(viewingItem.url) || ""}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : viewingItem.type === "VIDEO" ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                  <video
                    src={viewingItem.url}
                    controls
                    className="w-full h-full"
                  />
                </div>
              ) : viewingItem.type === "PDF" ? (
                <div className="w-full h-[600px] rounded-lg overflow-hidden bg-gray-900">
                  <iframe
                    src={viewingItem.url}
                    className="w-full h-full"
                    title={viewingItem.title}
                  />
                </div>
              ) : (
                <div className="p-6 bg-gray-900 rounded-lg">
                  <p className="text-gray-400 mb-4">Enlace externo:</p>
                  <a
                    href={viewingItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
                  >
                    {viewingItem.url}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    if (viewingItem.url) {
                      window.open(viewingItem.url, "_blank")
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

