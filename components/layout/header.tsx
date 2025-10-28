"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  title?: string
  action?: React.ReactNode
}

export function Header({ title, action }: HeaderProps) {
  return (
    <header className="bg-[#0a0a0a] border-b border-gray-800">
      <div className="flex h-16 items-center px-6 justify-between">
        <div className="flex items-center flex-1 max-w-2xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar..."
              className="pl-10 bg-black border-gray-800 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {action && (
          <div className="flex items-center space-x-4">
            {action}
          </div>
        )}
      </div>
    </header>
  )
}



