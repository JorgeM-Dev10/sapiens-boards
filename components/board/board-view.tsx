"use client"

import { useState } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { BoardWithLists } from "@/types"
import { ListColumn } from "./list-column"
import { TaskCard } from "./task-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface BoardViewProps {
  board: BoardWithLists
  onUpdate: () => void
}

export function BoardView({ board, onUpdate }: BoardViewProps) {
  const { toast } = useToast()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isCreatingList, setIsCreatingList] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) {
      setActiveId(null)
      return
    }

    // Find the task being dragged
    let task = null
    let sourceListId = null

    for (const list of board.lists) {
      const foundTask = list.tasks.find((t) => t.id === activeId)
      if (foundTask) {
        task = foundTask
        sourceListId = list.id
        break
      }
    }

    if (!task) {
      setActiveId(null)
      return
    }

    // Find the target list
    let targetListId = overId
    const targetList = board.lists.find((l) => l.id === overId)
    
    if (!targetList) {
      // Maybe dragged over a task, find its list
      for (const list of board.lists) {
        if (list.tasks.some((t) => t.id === overId)) {
          targetListId = list.id
          break
        }
      }
    }

    // Update task with new list
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listId: targetListId,
        }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        throw new Error("Error al mover la tarea")
      }
    } catch (error) {
      console.error("Error moving task:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo mover la tarea",
      })
    }

    setActiveId(null)
  }

  const handleCreateList = async () => {
    setIsCreatingList(true)
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Nueva Lista",
          boardId: board.id,
          order: board.lists.length,
        }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        throw new Error("Error al crear la lista")
      }
    } catch (error) {
      console.error("Error creating list:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear la lista",
      })
    } finally {
      setIsCreatingList(false)
    }
  }

  const activeTask = activeId
    ? board.lists
        .flatMap((list) => list.tasks)
        .find((task) => task.id === activeId)
    : null

  return (
    <div className="h-screen overflow-hidden bg-[#0a0a0a] relative">
      {/* Imagen de fondo difuminada */}
      {board.image && (
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${board.image})`,
              filter: 'blur(8px)',
              opacity: 0.4,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/50 via-[#0a0a0a]/80 to-[#0a0a0a]" />
        </div>
      )}

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-800 bg-[#0a0a0a]/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white">{board.title}</h1>
          {board.description && (
            <p className="text-gray-400 mt-1">{board.description}</p>
          )}
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            <SortableContext
              items={board.lists.map((list) => list.id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.lists.map((list) => (
                <ListColumn key={list.id} list={list} onUpdate={onUpdate} />
              ))}
            </SortableContext>

            <div className="flex-shrink-0">
              <Button
                variant="outline"
                className="w-72 h-auto min-h-[100px] bg-[#1a1a1a] border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700"
                onClick={handleCreateList}
                disabled={isCreatingList}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingList ? "Creando..." : "Agregar Lista"}
              </Button>
            </div>
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
        </div>
      </div>
    </div>
  )
}



