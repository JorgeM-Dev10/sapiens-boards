"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { BoardView } from "@/components/board/board-view"
import { useToast } from "@/hooks/use-toast"
import { BoardWithLists } from "@/types"

export default function BoardPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [board, setBoard] = useState<BoardWithLists | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBoard()
  }, [params.id])

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${params.id}`)
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
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
        <p className="text-gray-400">Tablero no encontrado</p>
      </div>
    )
  }

  return <BoardView board={board} onUpdate={fetchBoard} />
}

