"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  CalendarDays,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  UserCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { XPNotification } from "@/components/gamification/xp-notification"
import { BitacoraAnimatedBackground } from "@/components/bitacoras/bitacora-animated-background"
import { getProgressToNextRank, getRankByExperience } from "@/lib/sapiens-ranks"

type ImpactType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE"

interface WorkSession {
  id: string
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  tasksCompleted: number
  description: string | null
  workType: string
  createdAt: string
}

interface BitacoraEntry {
  id: string
  taskId: string | null
  xpGanado: number
  impactScore: number | null
  economicImpact: number | null
  aiReasoning: string | null
  createdAt: string
  task: {
    id: string
    title: string
    impactLevel: string | null
    economicValue: number | null
    list: {
      board: {
        id: string
        title: string
      }
    } | null
  } | null
}

interface Bitacora {
  id: string
  title: string
  description: string | null
  image: string | null
  boardId: string | null
  themeColor?: string | null
  user: {
    id: string
    name: string
    email: string
    image: string | null
  }
  avatar: {
    id: string
    level: number
    experience: number
    totalHours: number
    totalTasks: number
    totalSessions: number
    avatarStyle: string
    rank: string
    avatarImageUrl: string | null
  } | null
  board?: {
    id: string
    title: string
  } | null
  workSessions: WorkSession[]
  entries: BitacoraEntry[]
}

interface CommitRecord {
  id: string
  date: string
  description: string
  xp: number
  impactType: ImpactType
  impactScore: number | null
  tasksCompleted: number
  hoursLogged: number
  project: string
}

const ROLE_TOKEN_START = "[ROLE]"
const ROLE_TOKEN_END = "[/ROLE]"

function decodeProfileDescription(raw: string | null) {
  if (!raw) {
    return { role: "MIEMBRO SAPIENS", bio: "" }
  }

  const start = raw.indexOf(ROLE_TOKEN_START)
  const end = raw.indexOf(ROLE_TOKEN_END)
  if (start >= 0 && end > start) {
    const role = raw.slice(start + ROLE_TOKEN_START.length, end).trim() || "MIEMBRO SAPIENS"
    const bio = raw.slice(end + ROLE_TOKEN_END.length).trim()
    return { role, bio }
  }

  return { role: "MIEMBRO SAPIENS", bio: raw }
}

function encodeProfileDescription(role: string, bio: string) {
  return `${ROLE_TOKEN_START}${role.trim() || "MIEMBRO SAPIENS"}${ROLE_TOKEN_END}\n${bio.trim()}`
}

function getImpactType(entry: BitacoraEntry): ImpactType {
  const level = entry.task?.impactLevel?.toUpperCase()
  if (level === "CRITICAL" || level === "HIGH" || level === "MEDIUM" || level === "LOW") {
    return level
  }

  const score = entry.impactScore ?? 0
  if (score >= 85) return "CRITICAL"
  if (score >= 70) return "HIGH"
  if (score >= 45) return "MEDIUM"
  if (score > 0) return "LOW"
  return "NONE"
}

export default function BitacoraPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [bitacora, setBitacora] = useState<Bitacora | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistroDialogOpen, setIsRegistroDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registroMessage, setRegistroMessage] = useState("")
  const [search, setSearch] = useState("")
  const [impactFilter, setImpactFilter] = useState<"ALL" | ImpactType>("ALL")
  const [projectFilter, setProjectFilter] = useState("ALL")
  const [minXPFilter, setMinXPFilter] = useState("")
  const [minTasksFilter, setMinTasksFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [profileForm, setProfileForm] = useState({
    title: "",
    role: "MIEMBRO SAPIENS",
    bio: "",
    coverImage: "",
    avatarImage: "",
  })
  const [xpNotification, setXpNotification] = useState<{
    xpGained: number
    totalXP: number
    levelUp: boolean
    rankUp: string | null
    impactLevel?: string
  } | null>(null)

  useEffect(() => {
    fetchBitacora()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchBitacora = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/bitacoras/${params.id}`)
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la bitácora",
        })
        router.push("/bitacoras")
        return
      }
      const data = (await response.json()) as Bitacora
      setBitacora(data)
      const parsed = decodeProfileDescription(data.description)
      setProfileForm({
        title: data.title,
        role: parsed.role.toUpperCase(),
        bio: parsed.bio,
        coverImage: data.image || "",
        avatarImage: data.avatar?.avatarImageUrl || "",
      })
    } catch (error) {
      console.error("Error fetching bitacora:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar la bitácora",
      })
      router.push("/bitacoras")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registroMessage.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Escribe qué hiciste para que la IA evalúe el impacto",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bitacoras/${params.id}/log-impact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: registroMessage.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Error al registrar",
        })
        return
      }

      if (data.xpGained > 0) {
        setXpNotification({
          xpGained: data.xpGained,
          totalXP: data.totalXP,
          levelUp: data.levelUp,
          rankUp: data.rankUp,
          impactLevel: data.impactLevel,
        })
      }

      toast({
        title: "Commit de trabajo registrado",
        description: `Impacto evaluado: +${data.xpGained || 0} XP`,
      })
      setIsRegistroDialogOpen(false)
      setRegistroMessage("")
      await fetchBitacora()
    } catch (error) {
      console.error("Error submitting registro:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al registrar el impacto",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bitacora) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bitacoras/${bitacora.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: profileForm.title.trim(),
          description: encodeProfileDescription(profileForm.role.toUpperCase(), profileForm.bio),
          image: profileForm.coverImage.trim() || null,
          avatarImageUrl: profileForm.avatarImage.trim() || null,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        toast({
          variant: "destructive",
          title: "Error",
          description: err.error || "No se pudo guardar el perfil",
        })
        return
      }

      toast({
        title: "Perfil actualizado",
        description: "Se guardaron los cambios de perfil",
      })
      setIsProfileDialogOpen(false)
      await fetchBitacora()
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el perfil",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const parsedProfile = decodeProfileDescription(bitacora?.description || null)
  const sapiensRank = bitacora?.avatar ? getRankByExperience(bitacora.avatar.experience) : null
  const progressData = bitacora?.avatar ? getProgressToNextRank(bitacora.avatar.experience) : null

  const avatarImage = useMemo(() => {
    if (!bitacora?.avatar) return null
    if (bitacora.avatar.avatarImageUrl) return bitacora.avatar.avatarImageUrl
    return getRankByExperience(bitacora.avatar.experience).avatarImageUrl || bitacora.user.image
  }, [bitacora])

  const commitRecords = useMemo(() => {
    if (!bitacora) return []

    const dayStats = new Map<string, { tasks: number; hours: number }>()
    bitacora.workSessions.forEach((session) => {
      const key = session.date.split("T")[0]
      const current = dayStats.get(key) || { tasks: 0, hours: 0 }
      current.tasks += session.tasksCompleted || 0
      current.hours += session.durationMinutes / 60
      dayStats.set(key, current)
    })

    const entryRecords: CommitRecord[] = bitacora.entries.map((entry) => {
      const dayKey = entry.createdAt.split("T")[0]
      const agg = dayStats.get(dayKey) || { tasks: 0, hours: 0 }
      const project =
        entry.task?.list?.board?.title ||
        bitacora.board?.title ||
        "GENERAL"

      return {
        id: `entry-${entry.id}`,
        date: entry.createdAt,
        description:
          entry.task?.title ||
          entry.aiReasoning ||
          "Registro manual de contribución",
        xp: entry.xpGanado || 0,
        impactType: getImpactType(entry),
        impactScore: entry.impactScore,
        tasksCompleted: agg.tasks,
        hoursLogged: agg.hours,
        project: project.toUpperCase(),
      }
    })

    const entryDays = new Set(entryRecords.map((record) => record.date.split("T")[0]))

    const sessionOnlyRecords: CommitRecord[] = bitacora.workSessions
      .filter((session) => !entryDays.has(session.date.split("T")[0]))
      .map((session) => ({
        id: `session-${session.id}`,
        date: session.date,
        description: session.description || "Sesión de trabajo registrada",
        xp: 0,
        impactType: "NONE" as const,
        impactScore: null,
        tasksCompleted: session.tasksCompleted || 0,
        hoursLogged: session.durationMinutes / 60,
        project: bitacora.board?.title?.toUpperCase() || "GENERAL",
      }))

    return [...entryRecords, ...sessionOnlyRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [bitacora])

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(commitRecords.map((c) => c.project))).sort()
  }, [commitRecords])

  const filteredRecords = useMemo(() => {
    return commitRecords.filter((record) => {
      const recordDay = record.date.split("T")[0]
      const minXp = minXPFilter.trim() ? Number(minXPFilter) : null
      const minTasks = minTasksFilter.trim() ? Number(minTasksFilter) : null

      if (search.trim()) {
        const q = search.toLowerCase()
        const text = `${record.description} ${record.project}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      if (impactFilter !== "ALL" && record.impactType !== impactFilter) return false
      if (projectFilter !== "ALL" && record.project !== projectFilter) return false
      if (fromDate && recordDay < fromDate) return false
      if (toDate && recordDay > toDate) return false
      if (minXp !== null && !Number.isNaN(minXp) && record.xp < minXp) return false
      if (minTasks !== null && !Number.isNaN(minTasks) && record.tasksCompleted < minTasks) return false

      return true
    })
  }, [commitRecords, search, impactFilter, projectFilter, fromDate, toDate, minXPFilter, minTasksFilter])

  const personalStats = useMemo(() => {
    const entries = bitacora?.entries || []
    const impactScores = entries.filter((e) => typeof e.impactScore === "number").map((e) => e.impactScore as number)
    const impactAvg =
      impactScores.length > 0
        ? Math.round(impactScores.reduce((acc, val) => acc + val, 0) / impactScores.length)
        : 0

    const economicValue = entries.reduce((acc, entry) => acc + (entry.economicImpact || 0), 0)

    return {
      registros: commitRecords.length,
      impactAvg,
      economicValue,
    }
  }, [bitacora, commitRecords.length])

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  if (!bitacora) {
    return (
      <div className="flex h-screen flex-col bg-black text-white">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">Bitácora no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <Header />
      {xpNotification && (
        <XPNotification
          xpGained={xpNotification.xpGained}
          totalXP={xpNotification.totalXP}
          levelUp={xpNotification.levelUp}
          rankUp={xpNotification.rankUp || undefined}
          impactLevel={xpNotification.impactLevel}
          onClose={() => setXpNotification(null)}
        />
      )}

      <div className="relative flex-1 overflow-y-auto p-6">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <BitacoraAnimatedBackground
            themeColor={bitacora.themeColor}
            rank={sapiensRank?.id ?? bitacora.avatar?.rank}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          <Card className="overflow-hidden border-gray-800 bg-[#141414]">
            <div
              className="relative h-48 w-full bg-gradient-to-br from-slate-900 via-gray-900 to-black"
              style={
                bitacora.image
                  ? {
                      backgroundImage: `url(${bitacora.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/85" />
            </div>
            <CardContent className="relative -mt-14 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-blue-400/60 bg-black/70 shadow-lg">
                    {avatarImage ? (
                      <img src={avatarImage} alt={bitacora.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-blue-300">
                        <UserCircle2 className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">{bitacora.title}</h1>
                    <p className="mt-1 text-sm uppercase tracking-wide text-blue-300">{parsedProfile.role}</p>
                    {parsedProfile.bio && <p className="mt-2 max-w-2xl text-sm text-gray-300">{parsedProfile.bio}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="border border-blue-400/30 bg-blue-500/20 text-blue-200">
                        {sapiensRank?.label.toUpperCase() || "INITIUM"}
                      </Badge>
                      <Badge className="border border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                        NIVEL {bitacora.avatar?.level || 1}
                      </Badge>
                      <Badge className="border border-purple-400/30 bg-purple-500/15 text-purple-200">
                        {bitacora.avatar?.experience || 0} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog open={isRegistroDialogOpen} onOpenChange={setIsRegistroDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Commit de trabajo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl border-gray-800 bg-[#1a1a1a] text-white">
                      <DialogHeader>
                        <DialogTitle>Registrar commit de trabajo</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Describe qué hiciste para que la IA evalúe impacto y XP.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitRegistro}>
                        <div className="space-y-3">
                          <Label htmlFor="registro-message">Qué hiciste y qué impacto generó</Label>
                          <Textarea
                            id="registro-message"
                            value={registroMessage}
                            onChange={(e) => setRegistroMessage(e.target.value)}
                            className="min-h-[140px] border-gray-700 bg-gray-900 text-white"
                            placeholder="Ejemplo: Optimicé el flujo de onboarding, reduje 35% el tiempo de alta y habilité seguimiento automático..."
                            required
                          />
                        </div>
                        <DialogFooter className="mt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsRegistroDialogOpen(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? "Evaluando..." : "Evaluar impacto"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-gray-700 bg-transparent text-white hover:bg-gray-800">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl border-gray-800 bg-[#1a1a1a] text-white">
                      <DialogHeader>
                        <DialogTitle>Editar perfil de miembro</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Personaliza identidad, rol, portada y foto de perfil.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSaveProfile}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-title">Nombre / Identidad</Label>
                            <Input
                              id="profile-title"
                              value={profileForm.title}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, title: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-role">Puesto o rol</Label>
                            <Input
                              id="profile-role"
                              value={profileForm.role}
                              onChange={(e) =>
                                setProfileForm((prev) => ({
                                  ...prev,
                                  role: e.target.value.toUpperCase(),
                                }))
                              }
                              className="border-gray-700 bg-gray-900 text-white uppercase"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-bio">Bio</Label>
                            <Textarea
                              id="profile-bio"
                              value={profileForm.bio}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              rows={3}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-cover">URL foto de fondo</Label>
                            <Input
                              id="profile-cover"
                              value={profileForm.coverImage}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-avatar">URL foto de perfil</Label>
                            <Input
                              id="profile-avatar"
                              value={profileForm.avatarImage}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarImage: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              placeholder="https://..."
                            />
                          </div>
                        </div>
                        <DialogFooter className="mt-6">
                          <Button type="button" variant="ghost" onClick={() => setIsProfileDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                            {isSubmitting ? "Guardando..." : "Guardar perfil"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {progressData && (
                <div className="mt-6 rounded-xl border border-gray-800 bg-black/40 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-300">Progreso al siguiente rango</span>
                    <span className="font-semibold text-blue-300">{Math.round(progressData.progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all"
                      style={{ width: `${progressData.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>{(bitacora.avatar?.experience || 0).toLocaleString()} XP actuales</span>
                    <span>{Math.max(progressData.nextMin - (bitacora.avatar?.experience || 0), 0).toLocaleString()} XP para subir</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">XP total</p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.experience || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Registros</p>
                <p className="mt-1 text-xl font-bold text-white">{personalStats.registros}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Tareas completadas</p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.totalTasks || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Sesiones</p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.totalSessions || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Horas registradas</p>
                <p className="mt-1 text-xl font-bold text-white">{(bitacora.avatar?.totalHours || 0).toFixed(1)}h</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="text-xs text-gray-400">Impact score promedio</p>
                <p className="mt-1 text-xl font-bold text-white">{personalStats.impactAvg}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-800 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="h-5 w-5 text-blue-400" />
                Filtros de historial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por descripción/proyecto"
                  className="border-gray-700 bg-gray-900 text-white"
                />
                <Select value={impactFilter} onValueChange={(value) => setImpactFilter(value as "ALL" | ImpactType)}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Tipo de impacto" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                    <SelectItem value="ALL">Todo impacto</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    <SelectItem value="HIGH">HIGH</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                    <SelectItem value="LOW">LOW</SelectItem>
                    <SelectItem value="NONE">Sin impacto</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Proyecto / Roadmap" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                    <SelectItem value="ALL">Todos los proyectos</SelectItem>
                    {uniqueProjects.map((project) => (
                      <SelectItem key={project} value={project}>
                        {project}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  value={minXPFilter}
                  onChange={(e) => setMinXPFilter(e.target.value)}
                  placeholder="XP mínimo"
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-gray-700 bg-gray-900 text-white"
                />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-gray-700 bg-gray-900 text-white"
                />
                <Input
                  type="number"
                  min="0"
                  value={minTasksFilter}
                  onChange={(e) => setMinTasksFilter(e.target.value)}
                  placeholder="Tareas completadas mínimas"
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white">
                Historial de contribuciones ({filteredRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRecords.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-700 bg-black/30 p-8 text-center text-gray-400">
                  No hay commits de trabajo con esos filtros.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className="rounded-xl border border-gray-800 bg-black/40 p-4 transition-colors hover:border-gray-700"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border border-blue-500/30 bg-blue-500/15 text-blue-200">
                            {record.project}
                          </Badge>
                          <Badge className="border border-gray-600 bg-gray-800 text-gray-200">
                            {record.impactType}
                          </Badge>
                          {record.impactScore !== null && (
                            <Badge className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                              Impact {record.impactScore}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-400">
                          {format(new Date(record.date), "dd MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-100">{record.description}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                        <div className="rounded-md bg-gray-900/80 p-2 text-gray-300">
                          <Sparkles className="mb-1 h-3.5 w-3.5 text-yellow-400" />
                          +{record.xp} XP
                        </div>
                        <div className="rounded-md bg-gray-900/80 p-2 text-gray-300">
                          <CheckCircle className="mb-1 h-3.5 w-3.5 text-green-400" />
                          {record.tasksCompleted} tareas
                        </div>
                        <div className="rounded-md bg-gray-900/80 p-2 text-gray-300">
                          <Clock className="mb-1 h-3.5 w-3.5 text-blue-400" />
                          {record.hoursLogged.toFixed(1)}h
                        </div>
                        <div className="rounded-md bg-gray-900/80 p-2 text-gray-300">
                          <Target className="mb-1 h-3.5 w-3.5 text-purple-400" />
                          Contribución empresarial
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-500/40 bg-gradient-to-r from-blue-900/25 to-purple-900/25">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-yellow-500/20 p-2 text-yellow-300">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sistema gamificado Sapiens</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Tu progreso se mide por impacto real: XP, calidad de contribución, constancia y valor generado.
                    Registra cada commit de trabajo para fortalecer tu ranking y detectar áreas de mejora mensual.
                  </p>
                  <p className="mt-2 text-xs text-blue-200">
                    Valor económico acumulado: ${personalStats.economicValue.toLocaleString("es-MX")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

