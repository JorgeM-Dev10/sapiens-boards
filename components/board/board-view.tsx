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

    // Find the target - check if it's a task or a list
    let targetListId = null
    let targetTask = null
    
    // First check if it's a task
    for (const list of board.lists) {
      const foundTask = list.tasks.find((t) => t.id === overId)
      if (foundTask) {
        targetListId = list.id
        targetTask = foundTask
        break
      }
    }
    
    // If not a task, check if it's a list
    if (!targetTask) {
      const foundList = board.lists.find((l) => l.id === overId)
      if (foundList) {
        targetListId = foundList.id
        // If dropped on empty list area, use null
      }
    }

    if (!targetListId) {
      setActiveId(null)
      return
    }

    // Check if moving within the same list (reordering)
    const isSameList = sourceListId === targetListId

    if (isSameList) {
      // Reordering within the same list
      const sourceList = board.lists.find((l) => l.id === sourceListId)
      if (!sourceList) {
        setActiveId(null)
        return
      }

      // Get all tasks sorted by current order
      const allTasks = [...sourceList.tasks].sort((a, b) => a.order - b.order)
      const currentIndex = allTasks.findIndex((t) => t.id === activeId)
      
      if (currentIndex === -1) {
        setActiveId(null)
        return
      }

      // Remove the dragged task from the array
      const otherTasks = allTasks.filter((t) => t.id !== activeId)
      
      let targetIndex: number
      
      if (targetTask) {
        // Dragged over a specific task: insert BEFORE that task (above it)
        const targetTaskIndex = allTasks.findIndex((t) => t.id === targetTask.id)
        if (targetTaskIndex === -1) {
          setActiveId(null)
          return
        }
        
        // Find the index in otherTasks array (without the dragged task)
        targetIndex = otherTasks.findIndex((t) => t.id === targetTask.id)
        if (targetIndex === -1) {
          setActiveId(null)
          return
        }
      } else {
        // Dragged over empty area of the list: move to the end
        targetIndex = otherTasks.length
      }

      // Ensure targetIndex is valid
      targetIndex = Math.max(0, Math.min(targetIndex, otherTasks.length))

      // Create new array with dragged task inserted at target position
      const reorderedTasks = [...otherTasks]
      reorderedTasks.splice(targetIndex, 0, task)

      // Update all tasks with sequential orders
      const tasksToUpdate: Array<{ id: string; order: number }> = []
      
      reorderedTasks.forEach((t, index) => {
        if (t.order !== index) {
          tasksToUpdate.push({
            id: t.id,
            order: index,
          })
        }
      })

      // Update all affected tasks
      try {
        await Promise.all(
          tasksToUpdate.map((t) =>
            fetch(`/api/tasks/${t.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ order: t.order }),
            })
          )
        )

        onUpdate()
      } catch (error) {
        console.error("Error reordering task:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo reordenar la tarea",
        })
      }
    } else {
      // Moving to a different list
      let newOrder = 0
      
      const targetList = board.lists.find((l) => l.id === targetListId)
      if (targetList) {
        // Get the last task order in the target list
        const sortedTasks = targetList.tasks.sort((a, b) => a.order - b.order)
        if (sortedTasks.length > 0) {
          newOrder = sortedTasks[sortedTasks.length - 1].order + 1
        }
        
        // If dropped on a specific task in target list, insert before it
        if (targetTask && targetList.id === targetListId) {
          const targetTaskIndex = sortedTasks.findIndex((t) => t.id === targetTask.id)
          if (targetTaskIndex !== -1) {
            newOrder = sortedTasks[targetTaskIndex].order
            // Shift other tasks down
            const tasksToShift = sortedTasks.filter((t, idx) => idx >= targetTaskIndex)
            await Promise.all(
              tasksToShift.map((t) =>
                fetch(`/api/tasks/${t.id}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ order: t.order + 1 }),
                })
              )
            )
          }
        }
      }

      // Update task with new list and order
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listId: targetListId,
            order: newOrder,
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
                <ListColumn key={list.id} list={list} onUpdate={onUpdate} boardImage={board.image} />
              ))}
            </SortableContext>

            <div className="flex-shrink-0">
              <Button
                variant="outline"
                className="w-96 h-auto min-h-[100px] bg-[#1a1a1a] border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700"
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



