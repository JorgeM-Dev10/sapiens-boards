"use client"

import { useEffect, useState } from "react"
import { Award, Sparkles, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface XPNotificationProps {
  xpGained: number
  totalXP: number
  levelUp?: boolean
  rankUp?: string
  onClose: () => void
}

export function XPNotification({ xpGained, totalXP, levelUp, rankUp, onClose }: XPNotificationProps) {
  const [show, setShow] = useState(true)
  const [soundPlayed, setSoundPlayed] = useState(false)

  useEffect(() => {
    // Reproducir sonido
    if (!soundPlayed) {
      playXPSound()
      setSoundPlayed(true)
    }

    // Auto-cerrar después de 4 segundos
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 300)
    }, 4000)

    return () => clearTimeout(timer)
  }, [soundPlayed, onClose])

  const playXPSound = () => {
    try {
      // Crear un sonido usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Sonido de "premio" - dos tonos ascendentes
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)

      // Segundo tono para efecto más rico
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator()
        const gainNode2 = audioContext.createGain()
        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext.destination)
        oscillator2.frequency.setValueAtTime(660, audioContext.currentTime)
        oscillator2.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.15)
        gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)
        oscillator2.start(audioContext.currentTime)
        oscillator2.stop(audioContext.currentTime + 0.25)
      }, 100)
    } catch (error) {
      console.log("No se pudo reproducir sonido:", error)
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-20 right-6 z-50"
        >
          <div className="bg-gradient-to-br from-yellow-500/20 via-yellow-400/20 to-orange-500/20 backdrop-blur-md border-2 border-yellow-400/50 rounded-2xl p-6 shadow-2xl shadow-yellow-500/50 min-w-[320px]">
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                  className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl"
                >
                  {levelUp ? "🎉" : rankUp ? "⭐" : "✨"}
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                </motion.div>
              </div>
              <div className="flex-1">
                {levelUp ? (
                  <div>
                    <p className="text-yellow-300 font-bold text-lg mb-1">¡Subiste de Nivel! 🎊</p>
                    <p className="text-white text-sm">Nivel {Math.floor(totalXP / 100) + 1}</p>
                  </div>
                ) : rankUp ? (
                  <div>
                    <p className="text-yellow-300 font-bold text-lg mb-1">¡Nuevo Rango! ⭐</p>
                    <p className="text-white text-sm">{rankUp}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-yellow-300 font-bold text-lg mb-1">¡XP Ganada!</p>
                    <p className="text-white text-sm">+{xpGained} XP</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <p className="text-yellow-200 text-xs font-semibold">{totalXP} XP Total</p>
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

