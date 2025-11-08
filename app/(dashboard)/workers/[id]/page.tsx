"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Loader2, DollarSign, TrendingUp, Gift, FileText, User, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Header } from "@/components/layout/header"

interface PaymentLog {
  id: string
  type: string
  amount: number
  previousSalary: number | null
  newSalary: number | null
  description: string | null
  paymentDate: string
  createdAt: string
}

interface Worker {
  id: string
  name: string
  type: string
  responsibilities: string
  status: string
  salary: number
  paymentType: string
  percentage: number | null
}

const paymentTypes = [
  { value: "PAYMENT", label: "Pago", icon: DollarSign },
  { value: "SALARY_INCREASE", label: "Aumento de Salario", icon: TrendingUp },
  { value: "BONUS", label: "Bono", icon: Gift },
  { value: "ADJUSTMENT", label: "Ajuste", icon: FileText },
]

export default function WorkerPaymentLogPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [worker, setWorker] = useState<Worker | null>(null)
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newPayment, setNewPayment] = useState({
    type: "PAYMENT",
    amount: "",
    previousSalary: "",
    newSalary: "",
    description: "",
    paymentDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchWorker()
    fetchPaymentLogs()
  }, [params.id])

  const fetchWorker = async () => {
    try {
      const response = await fetch(`/api/workers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setWorker(data)
      }
    } catch (error) {
      console.error("Error fetching worker:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el empleado",
      })
    }
  }

  const fetchPaymentLogs = async () => {
    try {
      const response = await fetch(`/api/workers/${params.id}/payments`)
      if (response.ok) {
        const data = await response.json()
        setPaymentLogs(data)
      }
    } catch (error) {
      console.error("Error fetching payment logs:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los pagos",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePayment = async () => {
    let paymentData: any = {
      type: newPayment.type,
      description: newPayment.description || null,
      paymentDate: newPayment.paymentDate,
    }

    if (newPayment.type === "SALARY_INCREASE") {
      if (!newPayment.newSalary) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El nuevo salario es requerido para aumentos",
        })
        return
      }
      // Si no se especificó salario anterior, usar el actual del worker
      const prevSalary = newPayment.previousSalary 
        ? parseFloat(newPayment.previousSalary) 
        : (worker?.salary || 0)
      const newSalary = parseFloat(newPayment.newSalary)
      if (newSalary <= prevSalary) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El nuevo salario debe ser mayor al anterior",
        })
        return
      }
      // Calcular el monto del aumento
      const amount = newSalary - prevSalary
      paymentData = {
        ...paymentData,
        amount,
        previousSalary: prevSalary,
        newSalary,
      }
    } else {
      if (!newPayment.amount.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El monto es requerido",
        })
        return
      }
      paymentData.amount = parseFloat(newPayment.amount)
    }

    setIsCreating(true)

    try {
      const response = await fetch(`/api/workers/${params.id}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      if (response.ok) {
        toast({
          title: "Pago registrado",
          description: "El pago se ha registrado exitosamente",
        })
        setIsDialogOpen(false)
        setNewPayment({
          type: "PAYMENT",
          amount: "",
          previousSalary: "",
          newSalary: "",
          description: "",
          paymentDate: new Date().toISOString().split('T')[0],
        })
        fetchPaymentLogs()
        fetchWorker() // Actualizar el worker para obtener el nuevo salario si fue un aumento
      } else {
        throw new Error("Error al registrar el pago")
      }
    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo registrar el pago",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getPaymentTypeIcon = (type: string) => {
    const paymentType = paymentTypes.find((pt) => pt.value === type)
    return paymentType ? paymentType.icon : FileText
  }

  const getPaymentTypeLabel = (type: string) => {
    const paymentType = paymentTypes.find((pt) => pt.value === type)
    return paymentType ? paymentType.label : type
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-400">Empleado no encontrado</p>
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
                Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Pago o Aumento</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Registra un pago, aumento de salario, bono o ajuste
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newPayment.type}
                    onValueChange={(value) =>
                      setNewPayment({ ...newPayment, type: value })
                    }
                  >
                    <SelectTrigger className="bg-black border-gray-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-gray-800 text-white">
                      {paymentTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span>{type.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {newPayment.type === "SALARY_INCREASE" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="previousSalary">Salario Anterior (Actual: ${worker.salary.toLocaleString()})</Label>
                      <Input
                        id="previousSalary"
                        type="number"
                        placeholder={worker.salary.toString()}
                        value={newPayment.previousSalary || worker.salary.toString()}
                        onChange={(e) =>
                          setNewPayment({ ...newPayment, previousSalary: e.target.value })
                        }
                        className="bg-black border-gray-800 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newSalary">Nuevo Salario</Label>
                      <Input
                        id="newSalary"
                        type="number"
                        placeholder="12000"
                        value={newPayment.newSalary}
                        onChange={(e) => {
                          const newSalary = parseFloat(e.target.value) || 0
                          const prevSalary = parseFloat(newPayment.previousSalary || worker.salary.toString()) || worker.salary
                          const difference = newSalary - prevSalary
                          setNewPayment({ 
                            ...newPayment, 
                            newSalary: e.target.value,
                            amount: difference > 0 ? difference.toString() : ""
                          })
                        }}
                        className="bg-black border-gray-800 text-white"
                      />
                    </div>
                    {newPayment.amount && parseFloat(newPayment.amount) > 0 && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-400">
                          Aumento: ${parseFloat(newPayment.amount).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="10000"
                      value={newPayment.amount}
                      onChange={(e) =>
                        setNewPayment({ ...newPayment, amount: e.target.value })
                      }
                      className="bg-black border-gray-800 text-white"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Fecha de Pago</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, paymentDate: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Ej: Pago mensual de noviembre, Bono por desempeño excepcional..."
                    value={newPayment.description}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, description: e.target.value })
                    }
                    className="bg-black border-gray-800 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="bg-transparent border-gray-800 text-white hover:bg-gray-900"
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreatePayment} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700">
                  {isCreating ? "Registrando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/workers")}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Empleados
          </Button>

          <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {worker.type === "AI" ? (
                    <Bot className="h-8 w-8 text-blue-500" />
                  ) : (
                    <User className="h-8 w-8 text-gray-400" />
                  )}
                  <div>
                    <CardTitle className="text-white text-2xl">{worker.name}</CardTitle>
                    <p className="text-sm text-gray-400 mt-1">{worker.responsibilities}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Salario Actual</p>
                  <p className="text-2xl font-bold text-green-500">{formatSalary(worker)}</p>
                  <p className="text-xs text-gray-500 mt-1">Estatus: {worker.status}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Bitácora de Pagos</h2>

        {paymentLogs.length === 0 ? (
          <Card className="border-dashed bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay pagos registrados</p>
              <p className="text-sm text-gray-500 mt-2">
                Registra el primer pago o aumento para este empleado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paymentLogs.map((log) => {
              const Icon = getPaymentTypeIcon(log.type)
              return (
                <Card key={log.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-3 bg-gray-900 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-white">{getPaymentTypeLabel(log.type)}</h3>
                            <span className="text-green-500 font-bold text-lg">
                              {formatCurrency(log.amount)}
                            </span>
                          </div>
                          {log.type === "SALARY_INCREASE" && log.previousSalary && log.newSalary && (
                            <p className="text-sm text-gray-400 mb-2">
                              Salario anterior: {formatCurrency(log.previousSalary)} → Nuevo: {formatCurrency(log.newSalary)}
                            </p>
                          )}
                          {log.description && (
                            <p className="text-sm text-gray-400 mb-2">{log.description}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDate(log.paymentDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

