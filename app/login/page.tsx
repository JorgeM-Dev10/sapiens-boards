"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("🔐 Intentando iniciar sesión con:", formData.email)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      console.log("📋 Resultado de signIn:", result)

      if (result?.error) {
        console.error("❌ Error de autenticación:", result.error)
        console.error("📝 Detalles completos:", JSON.stringify(result, null, 2))
        
        let errorMessage = "Email o contraseña incorrectos"
        
        // Mensajes más específicos según el error
        if (result.error.includes("CredentialsSignin") || result.error === "CredentialsSignin") {
          errorMessage = "Email o contraseña incorrectos. Verifica tus credenciales."
        } else if (result.error.includes("Configuration") || result.error === "Configuration") {
          errorMessage = "Error de configuración del servidor. Verifica NEXTAUTH_SECRET."
        } else if (result.error.includes("AccessDenied") || result.error === "AccessDenied") {
          errorMessage = "Acceso denegado"
        } else {
          errorMessage = `Error: ${result.error}`
        }
        
        toast({
          variant: "destructive",
          title: "Error de autenticación",
          description: errorMessage,
        })
      } else if (result?.ok) {
        console.log("✅ Login exitoso, redirigiendo...")
        router.push("/clients")
        router.refresh()
      } else {
        console.warn("⚠️ Resultado inesperado:", result)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Respuesta inesperada del servidor",
        })
      }
    } catch (error) {
      console.error("💥 Error al iniciar sesión:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al iniciar sesión",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        onLoadedData={() => console.log('Video cargado correctamente')}
        onError={(e) => console.error('Error cargando video:', e)}
      >
        <source src="/background-video.mp4" type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
      
      {/* Overlay oscuro sobre el video */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Gradiente animado de respaldo */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-600/5 via-indigo-600/5 to-violet-600/5 animate-pulse" style={{ animationDuration: '12s' }} />
      </div>
      
      <Card className="w-full max-w-md bg-[#1a1a1a]/90 backdrop-blur-sm border-gray-800 relative z-10 mx-4">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-lg" />
              <img 
                src="https://i.imgur.com/stB5YvK.png" 
                alt="Sapiens Logo"
                className="h-20 w-20 relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">SAPIENSLABS</CardTitle>
          <CardDescription className="text-gray-400">
            Sistema de Gestión Interna
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sapiens.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="bg-black border-gray-800 text-white placeholder:text-gray-600"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-black border-gray-800 text-white"
                required
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} Sapiens Laboratories. Todos los derechos reservados.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
