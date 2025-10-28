"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { Loader2 } from "lucide-react"
import { BoardView } from "@/components/board/board-view"
import { useToast } from "@/hooks/use-toast"
import { BoardWithLists } from "@/types"

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { toast } = useToast()
  const [board, setBoard] = useState<BoardWithLists | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBoard()
  }, [resolvedParams.id])

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setBoard(data)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el tablero",
        })
      }
    } catch (error) {
      console.error("Error fetching board:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el tablero",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">Tablero no encontrado</p>
      </div>
    )
  }

  return <BoardView board={board} onUpdate={fetchBoard} />
}



