"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface Board {
  id: string
  title: string
  description: string | null
  image: string | null
  createdAt: string
  lists: any[]
}

export default function BoardsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newBoard, setNewBoard] = useState({
    title: "",
    description: "",
  })

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
          description: "El tablero se ha creado exitosamente",
        })
        setIsCreateDialogOpen(false)
        setNewBoard({ title: "", description: "" })
        router.push(`/boards/${board.id}`)
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

  const getTaskCount = (board: Board) => {
    return board.lists.reduce((total, list) => total + (list.tasks?.length || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mis Tableros</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus proyectos y tareas
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Tablero
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Tablero</DialogTitle>
              <DialogDescription>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateBoard} disabled={isCreating}>
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
      </div>

      {boards.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No tienes tableros aún</CardTitle>
            <CardDescription>
              Crea tu primer tablero para empezar a organizar tus tareas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primer Tablero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/boards/${board.id}`)}
            >
              <CardHeader>
                <CardTitle>{board.title}</CardTitle>
                {board.description && (
                  <CardDescription>{board.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{board.lists.length} listas</span>
                  <span>{getTaskCount(board)} tareas</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}



