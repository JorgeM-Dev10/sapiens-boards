import { User, Board, List, Task, Tag, Worker, AISolution } from '@prisma/client'

export type TaskWithRelations = Task & {
  assigned?: User | null
  tags: {
    tag: Tag
  }[]
}

export type ListWithTasks = List & {
  tasks: TaskWithRelations[]
}

export type BoardWithLists = Board & {
  lists: ListWithTasks[]
  owner: User
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface CreateBoardData {
  title: string
  description?: string
  image?: string
}

export interface CreateListData {
  title: string
  boardId: string
  order: number
}

export interface CreateTaskData {
  title: string
  description?: string
  listId: string
  order: number
  status?: TaskStatus
  assignedTo?: string
  dueDate?: Date
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  listId?: string
  order?: number
  assignedTo?: string
  dueDate?: Date
}

// Workers types
export type WorkerWithUser = Worker & {
  user: User
}

export interface CreateWorkerData {
  name: string
  type: "HUMAN" | "AI"
  responsibilities: string
  status: string
  salary: number
  paymentType: "FIXED" | "PERCENTAGE" | "HYBRID"
  percentage?: number | null
  startDate: Date
  paymentDate?: number | null
}

export interface UpdateWorkerData {
  name?: string
  type?: "HUMAN" | "AI"
  responsibilities?: string
  status?: string
  salary?: number
  paymentType?: "FIXED" | "PERCENTAGE" | "HYBRID"
  percentage?: number | null
  startDate?: Date
  paymentDate?: number | null
}

// AI Solutions types
export type AISolutionWithBundles = AISolution & {
  bundleItems: {
    solution: AISolution
  }[]
}

export interface CreateAISolutionData {
  name: string
  description?: string
  category: string
  type: "INDIVIDUAL" | "BUNDLE"
  price?: number | null
  features?: string | null
  icon?: string | null
  isActive?: boolean
  solutionIds?: string[] // For bundles
}

export interface UpdateAISolutionData {
  name?: string
  description?: string
  category?: string
  type?: "INDIVIDUAL" | "BUNDLE"
  price?: number | null
  features?: string | null
  icon?: string | null
  isActive?: boolean
  solutionIds?: string[]
}



