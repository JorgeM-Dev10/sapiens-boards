import { Sidebar } from "@/components/layout/sidebar"
import { AuthProvider } from "@/components/providers/session-provider"
import { GamificationProvider } from "@/contexts/gamification-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <GamificationProvider>
        <div className="h-screen flex bg-[#0a0a0a]">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </GamificationProvider>
    </AuthProvider>
  )
}



