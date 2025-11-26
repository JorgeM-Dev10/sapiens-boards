"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Building2, Users, Sparkles, BookOpen, LogOut, User, BarChart3, FileText } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Roadmaps", href: "/roadmaps", icon: Calendar },
  { name: "Clientes", href: "/clients", icon: Building2 },
  { name: "Workers", href: "/workers", icon: Users },
  { name: "Soluciones AI", href: "/ai-solutions", icon: Sparkles },
  { name: "Librería", href: "/library", icon: BookOpen },
  { name: "Estadísticas", href: "/estadisticas", icon: BarChart3 },
  { name: "Bitácoras", href: "/bitacoras", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <div className="flex h-full w-64 flex-col bg-black border-r border-gray-800">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-800">
        <Link href="/clients" className="flex items-center space-x-3 hover:opacity-80 transition-opacity group">
          <div className="h-10 w-10 relative flex items-center justify-center shrink-0">
            {/* Logo con efecto difuminado */}
            <div className="absolute inset-0 bg-white/10 rounded-full blur-md group-hover:blur-lg transition-all" />
            <img 
              src="https://i.imgur.com/stB5YvK.png" 
              alt="Sapiens Logo"
              className="h-10 w-10 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)] transition-all object-contain"
            />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">
            SAPIENSLABS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                  : "text-gray-400 hover:bg-blue-600/10 hover:text-blue-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "Usuario"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-600/10 transition-all"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

