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

    // Auto-cerrar después de más tiempo si hay cambio de rango
    const closeDelay = rankUp ? 6000 : levelUp ? 5000 : 4000
    const timer = setTimeout(() => {
      setShow(false)
      setTimeout(onClose, 300)
    }, closeDelay)

    return () => clearTimeout(timer)
  }, [soundPlayed, onClose])

  const playXPSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (rankUp) {
        // Sonido especial para cambio de rango - fanfarria épica
        const notes = [523.25, 659.25, 783.99, 1046.50] // Do, Mi, Sol, Do (arpegio mayor)
        notes.forEach((freq, index) => {
          setTimeout(() => {
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            oscillator.type = 'sine'
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
            gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.4)
          }, index * 100)
        })
      } else if (levelUp) {
        // Sonido para subida de nivel - dos tonos ascendentes más largos
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
      } else {
        // Sonido normal de XP
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }
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
          <div className={`backdrop-blur-md border-2 rounded-2xl p-6 shadow-2xl min-w-[320px] ${
            rankUp 
              ? "bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 border-purple-400/50 shadow-purple-500/50" 
              : levelUp
              ? "bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 border-blue-400/50 shadow-blue-500/50"
              : "bg-gradient-to-br from-yellow-500/20 via-yellow-400/20 to-orange-500/20 border-yellow-400/50 shadow-yellow-500/50"
          }`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: rankUp ? [0, 15, -15, 15, 0] : levelUp ? [0, 10, -10, 10, 0] : [0, 5, -5, 5, 0],
                    scale: rankUp ? [1, 1.2, 1] : [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: rankUp ? 0.6 : 0.5, 
                    repeat: rankUp ? 3 : 2 
                  }}
                  className={`h-16 w-16 rounded-full flex items-center justify-center text-3xl ${
                    rankUp 
                      ? "bg-gradient-to-br from-purple-400 to-pink-500" 
                      : levelUp
                      ? "bg-gradient-to-br from-blue-400 to-cyan-500"
                      : "bg-gradient-to-br from-yellow-400 to-orange-500"
                  }`}
                >
                  {levelUp ? "🎉" : rankUp ? "👑" : "✨"}
                </motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className={`h-6 w-6 ${rankUp ? "text-purple-400" : levelUp ? "text-blue-400" : "text-yellow-400"}`} />
                </motion.div>
              </div>
              <div className="flex-1">
                {levelUp ? (
                  <div>
                    <p className="text-blue-300 font-bold text-lg mb-1">¡Subiste de Nivel! 🎊</p>
                    <p className="text-white text-sm">Nivel {Math.floor(totalXP / 100) + 1}</p>
                  </div>
                ) : rankUp ? (
                  <motion.div
                    animate={{ scale: [1, 1.02, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <p className="text-purple-300 font-bold text-2xl mb-2 animate-pulse">¡FELICITACIONES! 🎉</p>
                    <p className="text-white text-base font-semibold mb-1">Has alcanzado el rango:</p>
                    <p className="text-purple-400 text-xl font-bold mb-2">{rankUp}</p>
                    <p className="text-gray-300 text-xs">¡Sigue así para alcanzar el siguiente nivel!</p>
                  </motion.div>
                ) : (
                  <div>
                    <p className="text-yellow-300 font-bold text-lg mb-1">¡XP Ganada!</p>
                    <p className="text-white text-sm">+{xpGained} XP</p>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className={`h-4 w-4 ${rankUp ? "text-purple-400" : levelUp ? "text-blue-400" : "text-yellow-400"}`} />
                  <p className={`text-xs font-semibold ${rankUp ? "text-purple-200" : levelUp ? "text-blue-200" : "text-yellow-200"}`}>{totalXP} XP Total</p>
                </div>
              </div>
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Award className={`h-8 w-8 ${rankUp ? "text-purple-400" : levelUp ? "text-blue-400" : "text-yellow-400"}`} />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}



