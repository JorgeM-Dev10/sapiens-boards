"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Loader2, DollarSign, Milestone, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface Timeline {
  id: string
  title: string
  description: string | null
  type: string
  amount: number | null
  createdAt: string
}

interface Client {
  id: string
  name: string
  description: string | null
  phase: string
  totalAmount: number
  paidAmount: number
  timelines: Timeline[]
}

const timelineTypes = [
  { value: "UPDATE", label: "Actualización", icon: FileText },
  { value: "PAYMENT", label: "Pago", icon: DollarSign },
  { value: "MILESTONE", label: "Hito", icon: Milestone },
]

export default function ClientTimelinePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newTimeline, setNewTimeline] = useState({
    title: "",
    description: "",
    type: "UPDATE",
    amount: "",
  })

  useEffect(() => {
    fetchClient()
  }, [params.id])

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data)
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el cliente",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTimeline = async () => {
    if (!newTimeline.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El título es requerido",
      })
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch(`/api/clients/${params.id}/timelines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTimeline),
      })

      if (response.ok) {
        toast({
          title: "Entrada agregada",
          description: "La entrada se ha agregado exitosamente",
        })
        setIsDialogOpen(false)
        setNewTimeline({ title: "", description: "", type: "UPDATE", amount: "" })
        fetchClient()
      } else {
        throw new Error("Error al crear la entrada")
      }
    } catch (error) {
      console.error("Error creating timeline:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la entrada",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = timelineTypes.find(t => t.value === type)
    return typeConfig?.icon || FileText
  }

  const getTypeLabel = (type: string) => {
    return timelineTypes.find(t => t.value === type)?.label || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Cliente no encontrado</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-900 border border-white">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Agregar Entrada al Timeline</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Registra un avance, pago o hito del proyecto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newTimeline.type}
                    onValueChange={(value) =>
                      setNewTimeline({ ...newTimeline, type: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {timelineTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Entrega de primera fase"
                    value={newTimeline.title}
                    onChange={(e) =>
                      setNewTimeline({ ...newTimeline, title: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Detalles de la entrada..."
                    value={newTimeline.description}
                    onChange={(e) =>
                      setNewTimeline({ ...newTimeline, description: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                {newTimeline.type === "PAYMENT" && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="25000"
                      value={newTimeline.amount}
                      onChange={(e) =>
                        setNewTimeline({ ...newTimeline, amount: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateTimeline} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? "Agregando..." : "Agregar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/clients")}
          className="mb-4 text-gray-400 hover:text-white hover:bg-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Clientes
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">{client.name}</h1>
          {client.description && (
            <p className="text-gray-400 mt-2">{client.description}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Total del Proyecto</p>
                <p className="text-2xl font-bold text-white">${client.totalAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Pagado</p>
                <p className="text-2xl font-bold text-green-500">${client.paidAmount.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="p-4">
                <p className="text-sm text-gray-400">Pendiente</p>
                <p className="text-2xl font-bold text-orange-500">${(client.totalAmount - client.paidAmount).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-4">Timeline del Proyecto</h2>

        <div className="space-y-4">
          {client.timelines.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-gray-800 border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400">No hay entradas en el timeline</p>
                <p className="text-sm text-gray-500 mt-2">
                  Agrega avances, pagos o hitos del proyecto
                </p>
              </CardContent>
            </Card>
          ) : (
            client.timelines.map((timeline) => {
              const Icon = getTypeIcon(timeline.type)
              return (
                <Card key={timeline.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          timeline.type === "PAYMENT" ? "bg-green-500/20" :
                          timeline.type === "MILESTONE" ? "bg-blue-500/20" :
                          "bg-gray-500/20"
                        }`}>
                          <Icon className={`h-5 w-5 ${
                            timeline.type === "PAYMENT" ? "text-green-500" :
                            timeline.type === "MILESTONE" ? "text-blue-500" :
                            "text-gray-400"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-white">{timeline.title}</CardTitle>
                            <span className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded">
                              {getTypeLabel(timeline.type)}
                            </span>
                          </div>
                          {timeline.description && (
                            <p className="text-sm text-gray-400 mt-2">{timeline.description}</p>
                          )}
                          {timeline.amount && (
                            <p className="text-lg font-bold text-green-500 mt-2">
                              ${timeline.amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(timeline.createdAt)}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

