"use client"

import { useEffect, useState } from "react"
import { Key, Plus, Copy, Trash2, Ban, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/layout/header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface ApiKeyRow {
  id: string
  name: string
  key: string
  active: boolean
  createdAt: string
  lastUsedAt: string | null
}

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<{ name: string; key: string; createdAt: string } | null>(null)
  const [copyDone, setCopyDone] = useState(false)

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/admin/api-keys")
      if (!res.ok) {
        if (res.status === 403) {
          toast({ title: "Solo administradores pueden gestionar API Keys", variant: "destructive" })
          return
        }
        throw new Error("Error al cargar")
      }
      const data = await res.json()
      setKeys(data)
    } catch (e) {
      toast({ title: "Error al cargar API Keys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const handleCreate = async () => {
    if (!createName.trim()) {
      toast({ title: "El nombre es requerido", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/api-keys/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error || "Error al crear", variant: "destructive" })
        return
      }
      setCreatedKey({ name: data.name, key: data.key, createdAt: data.createdAt })
      setCreateName("")
      await fetchKeys()
    } catch {
      toast({ title: "Error al crear la API Key", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleCopyKey = async () => {
    if (!createdKey?.key) return
    await navigator.clipboard.writeText(createdKey.key)
    setCopyDone(true)
    toast({ title: "API Key copiada al portapapeles" })
    setTimeout(() => setCopyDone(false), 2000)
  }

  const handleDeactivate = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "API Key desactivada" })
      await fetchKeys()
    } catch {
      toast({ title: "Error al desactivar", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta API Key? No podrás volver a usarla.")) return
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast({ title: "API Key eliminada" })
      await fetchKeys()
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" })
    }
  }

  const closeCreateDialog = () => {
    setCreateOpen(false)
    setCreatedKey(null)
    setCreateName("")
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="API Keys"
        action={
          <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Crear API Key
          </Button>
        }
      />
      <main className="flex-1 p-6">
        <Card className="border-gray-800 bg-black">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Key className="h-5 w-5" />
              Claves de API
            </CardTitle>
            <CardDescription className="text-gray-400">
              Genera API Keys para integrar agentes externos (p. ej. WhatsApp). La key solo se muestra al crearla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-500">Cargando…</p>
            ) : keys.length === 0 ? (
              <p className="text-gray-500">No hay API Keys. Crea una para conectar servicios externos.</p>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-800 bg-gray-900/50 p-4"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-white">{k.name}</p>
                      <p className="font-mono text-sm text-gray-500">{k.key}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Creada: {new Date(k.createdAt).toLocaleDateString()}</span>
                        {k.lastUsedAt && (
                          <span>Último uso: {new Date(k.lastUsedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {k.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400">
                          Inactiva
                        </span>
                      )}
                      {k.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-amber-400"
                          onClick={() => handleDeactivate(k.id)}
                        >
                          <Ban className="mr-1 h-4 w-4" />
                          Desactivar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-700 text-gray-400 hover:bg-red-600/20 hover:text-red-400"
                        onClick={() => handleDelete(k.id)}
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
      </main>

      <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
        <DialogContent className="border-gray-800 bg-black text-white">
          <DialogHeader>
            <DialogTitle>
              {createdKey ? "API Key creada" : "Nueva API Key"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {createdKey
                ? "Copia la key ahora. No volverás a verla."
                : "Asigna un nombre para identificar esta key (ej: Agente WhatsApp)."}
            </DialogDescription>
          </DialogHeader>
          {createdKey ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{createdKey.name}</p>
              <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-3 font-mono text-sm">
                <span className="flex-1 break-all text-white">{createdKey.key}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-gray-700"
                  onClick={handleCopyKey}
                >
                  {copyDone ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={closeCreateDialog}>Cerrar</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="api-key-name">Nombre</Label>
                <Input
                  id="api-key-name"
                  placeholder="Ej: Agente WhatsApp"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeCreateDialog}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                  {creating ? "Creando…" : "Crear"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
