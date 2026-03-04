"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { XPNotification } from "@/components/gamification/xp-notification"

interface GamificationPayload {
  xpGained: number
  totalXP: number
  previousXP: number
  levelUp: boolean
  rankUp: string | null
  impactLevel?: string
}

interface GamificationContextValue {
  showXPNotification: (payload: GamificationPayload) => void
}

const GamificationContext = createContext<GamificationContextValue | null>(null)

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<GamificationPayload | null>(null)

  const showXPNotification = useCallback((payload: GamificationPayload) => {
    setNotification(payload)
  }, [])

  return (
    <GamificationContext.Provider value={{ showXPNotification }}>
      {children}
      {notification && (
        <XPNotification
          xpGained={notification.xpGained}
          totalXP={notification.totalXP}
          levelUp={notification.levelUp}
          rankUp={notification.rankUp ?? undefined}
          impactLevel={notification.impactLevel}
          onClose={() => setNotification(null)}
        />
      )}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  const ctx = useContext(GamificationContext)
  return ctx
}
