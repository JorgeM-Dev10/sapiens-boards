"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Award,
  CheckCircle,
  Clock,
  Filter,
  Info,
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
import { BITACORA_THEMES, getThemeColors } from "@/lib/bitacora-themes"

type ImpactType = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE"
type CommitSource = "MANUAL" | "ROADMAP" | "SESION"

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
  source: CommitSource
  associatedSkill: string | null
}

const ROLE_TOKEN_START = "[ROLE]"
const ROLE_TOKEN_END = "[/ROLE]"
const ABOUT_TOKEN_START = "[ABOUT]"
const ABOUT_TOKEN_END = "[/ABOUT]"
const SKILLS_TOKEN_START = "[SKILLS]"
const SKILLS_TOKEN_END = "[/SKILLS]"
const GOALS_TOKEN_START = "[GOALS]"
const GOALS_TOKEN_END = "[/GOALS]"

function decodeProfileDescription(raw: string | null) {
  if (!raw) {
    return { role: "MIEMBRO SAPIENS", about: "", skills: "", goals: "" }
  }

  const start = raw.indexOf(ROLE_TOKEN_START)
  const end = raw.indexOf(ROLE_TOKEN_END)
  if (start >= 0 && end > start) {
    const role = raw.slice(start + ROLE_TOKEN_START.length, end).trim() || "MIEMBRO SAPIENS"
    const roleEnd = end + ROLE_TOKEN_END.length
    const remaining = raw.slice(roleEnd).trim()
    const aboutStart = remaining.indexOf(ABOUT_TOKEN_START)
    const aboutEnd = remaining.indexOf(ABOUT_TOKEN_END)
    const skillsStart = remaining.indexOf(SKILLS_TOKEN_START)
    const skillsEnd = remaining.indexOf(SKILLS_TOKEN_END)
    const goalsStart = remaining.indexOf(GOALS_TOKEN_START)
    const goalsEnd = remaining.indexOf(GOALS_TOKEN_END)

    const about =
      aboutStart >= 0 && aboutEnd > aboutStart
        ? remaining.slice(aboutStart + ABOUT_TOKEN_START.length, aboutEnd).trim()
        : remaining
    const skills =
      skillsStart >= 0 && skillsEnd > skillsStart
        ? remaining.slice(skillsStart + SKILLS_TOKEN_START.length, skillsEnd).trim()
        : ""
    const goals =
      goalsStart >= 0 && goalsEnd > goalsStart
        ? remaining.slice(goalsStart + GOALS_TOKEN_START.length, goalsEnd).trim()
        : ""

    return { role, about, skills, goals }
  }

  return { role: "MIEMBRO SAPIENS", about: raw, skills: "", goals: "" }
}

function encodeProfileDescription(role: string, about: string, skills: string, goals: string) {
  return `${ROLE_TOKEN_START}${role.trim() || "MIEMBRO SAPIENS"}${ROLE_TOKEN_END}
${ABOUT_TOKEN_START}${about.trim()}${ABOUT_TOKEN_END}
${SKILLS_TOKEN_START}${skills.trim()}${SKILLS_TOKEN_END}
${GOALS_TOKEN_START}${goals.trim()}${GOALS_TOKEN_END}`
}

function parseSkillsList(skillsRaw: string): string[] {
  return skillsRaw
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
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
  const [timeFilter, setTimeFilter] = useState<"day" | "week" | "month" | "custom">("month")
  const [sourceFilter, setSourceFilter] = useState<"ALL" | CommitSource>("ALL")
  const [impactFilter, setImpactFilter] = useState<"ALL" | ImpactType>("ALL")
  const [projectFilter, setProjectFilter] = useState("ALL")
  const [skillFilter, setSkillFilter] = useState("ALL")
  const [minXPFilter, setMinXPFilter] = useState("")
  const [minTasksFilter, setMinTasksFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [newSkillInput, setNewSkillInput] = useState("")
  const [profileForm, setProfileForm] = useState({
    title: "",
    role: "MIEMBRO SAPIENS",
    about: "",
    skills: [] as string[],
    goals: "",
    coverImage: "",
    themeColor: "neon-purple",
    avatarImageUrl: "",
    customHexColor: "#a855f7",
  })
  const [roadmapTasks, setRoadmapTasks] = useState<{
    id: string
    title: string
    status: string
    impactLevel: string | null
    dueDate: string | null
    listTitle: string
  }[]>([])
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

  // Cargar tareas del roadmap conectado para metas inteligentes
  useEffect(() => {
    if (!bitacora?.boardId) {
      setRoadmapTasks([])
      return
    }
    fetch(`/api/boards/${bitacora.boardId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((board: { lists?: { title: string; tasks: { id: string; title: string; status: string; impactLevel: string | null; dueDate: string | null }[] }[] }) => {
        if (!board?.lists) return
        const all: { id: string; title: string; status: string; impactLevel: string | null; dueDate: string | null; listTitle: string }[] = []
        board.lists.forEach((list: { title: string; tasks: { id: string; title: string; status: string; impactLevel: string | null; dueDate: string | null }[] }) => {
          (list.tasks || []).forEach((t: { id: string; title: string; status: string; impactLevel: string | null; dueDate: string | null }) => {
            all.push({ ...t, listTitle: list.title })
          })
        })
        setRoadmapTasks(all)
      })
      .catch(() => setRoadmapTasks([]))
  }, [bitacora?.boardId])

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
      const tc = data.themeColor || "neon-purple"
      const isHex = tc.startsWith("#")
      setProfileForm({
        title: data.title,
        role: parsed.role.toUpperCase(),
        about: parsed.about,
        skills: parseSkillsList(parsed.skills),
        goals: parsed.goals,
        coverImage: data.image || "",
        themeColor: isHex ? "custom" : tc,
        avatarImageUrl: data.avatar?.avatarImageUrl || "",
        customHexColor: isHex ? tc : "#a855f7",
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

    const themeColorValue = profileForm.themeColor === "custom" ? profileForm.customHexColor : profileForm.themeColor

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/bitacoras/${bitacora.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: profileForm.title.trim(),
          description: encodeProfileDescription(
            profileForm.role.toUpperCase(),
            profileForm.about,
            profileForm.skills.join(", "),
            profileForm.goals
          ),
          image: profileForm.coverImage.trim() || null,
          themeColor: themeColorValue,
          avatarImageUrl: profileForm.avatarImageUrl.trim() || null,
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
  const profileSkills = useMemo(() => parseSkillsList(parsedProfile.skills), [parsedProfile.skills])
  const sapiensRank = bitacora?.avatar ? getRankByExperience(bitacora.avatar.experience) : null
  const progressData = bitacora?.avatar ? getProgressToNextRank(bitacora.avatar.experience) : null
  const themeColors = getThemeColors(bitacora?.themeColor)

  const avatarImage = useMemo(() => {
    if (!bitacora?.avatar) return null
    return bitacora.avatar.avatarImageUrl || getRankByExperience(bitacora.avatar.experience).avatarImageUrl || null
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

    const detectSkill = (text: string) => {
      const normalized = text.toLowerCase()
      const matched = profileSkills.find((skill) => normalized.includes(skill.toLowerCase()))
      return matched || null
    }

    const entryRecords: CommitRecord[] = bitacora.entries.map((entry) => {
      const dayKey = entry.createdAt.split("T")[0]
      const agg = dayStats.get(dayKey) || { tasks: 0, hours: 0 }
      const project =
        entry.task?.list?.board?.title ||
        bitacora.board?.title ||
        "GENERAL"
      const description =
        entry.task?.title ||
        entry.aiReasoning ||
        "Registro manual de contribución"
      const source: CommitSource = entry.task ? "ROADMAP" : "MANUAL"

      return {
        id: `entry-${entry.id}`,
        date: entry.createdAt,
        description,
        xp: entry.xpGanado || 0,
        impactType: getImpactType(entry),
        impactScore: entry.impactScore,
        tasksCompleted: agg.tasks,
        hoursLogged: agg.hours,
        project: project.toUpperCase(),
        source,
        associatedSkill: detectSkill(`${description} ${project}`),
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
        source: "SESION" as const,
        associatedSkill: detectSkill(`${session.description || ""} ${session.workType} ${bitacora.board?.title || ""}`),
      }))

    return [...entryRecords, ...sessionOnlyRecords].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [bitacora, profileSkills])

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(commitRecords.map((c) => c.project))).sort()
  }, [commitRecords])
  const uniqueSkills = useMemo(() => {
    return Array.from(
      new Set(
        commitRecords
          .map((c) => c.associatedSkill)
          .filter((skill): skill is string => Boolean(skill))
      )
    ).sort()
  }, [commitRecords])

  const filteredRecords = useMemo(() => {
    const now = new Date()
    const startDateByPreset =
      timeFilter === "day"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : timeFilter === "week"
        ? new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
        : timeFilter === "month"
        ? new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
        : null

    return commitRecords.filter((record) => {
      const recordDay = record.date.split("T")[0]
      const recordDate = new Date(record.date)
      const minXp = minXPFilter.trim() ? Number(minXPFilter) : null
      const minTasks = minTasksFilter.trim() ? Number(minTasksFilter) : null

      if (search.trim()) {
        const q = search.toLowerCase()
        const text = `${record.description} ${record.project}`.toLowerCase()
        if (!text.includes(q)) return false
      }

      if (timeFilter !== "custom" && startDateByPreset && recordDate < startDateByPreset) return false
      if (timeFilter === "custom") {
        if (fromDate && recordDay < fromDate) return false
        if (toDate && recordDay > toDate) return false
      }
      if (sourceFilter !== "ALL" && record.source !== sourceFilter) return false
      if (impactFilter !== "ALL" && record.impactType !== impactFilter) return false
      if (projectFilter !== "ALL" && record.project !== projectFilter) return false
      if (skillFilter !== "ALL" && record.associatedSkill !== skillFilter) return false
      if (minXp !== null && !Number.isNaN(minXp) && record.xp < minXp) return false
      if (minTasks !== null && !Number.isNaN(minTasks) && record.tasksCompleted < minTasks) return false

      return true
    })
  }, [
    commitRecords,
    timeFilter,
    sourceFilter,
    search,
    impactFilter,
    projectFilter,
    skillFilter,
    fromDate,
    toDate,
    minXPFilter,
    minTasksFilter,
  ])

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

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const monthRecords = commitRecords.filter((record) => {
      const d = new Date(record.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    return {
      commits: monthRecords.length,
      xp: monthRecords.reduce((acc, record) => acc + record.xp, 0),
      highImpact: monthRecords.filter((record) => ["HIGH", "CRITICAL"].includes(record.impactType)).length,
    }
  }, [commitRecords])

  const completedTaskIds = useMemo(() => {
    return new Set((bitacora?.entries || []).map((e) => e.taskId).filter(Boolean) as string[])
  }, [bitacora])

  const smartGoals = useMemo(() => {
    const impactOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0 } as const
    const now = new Date()
    return roadmapTasks
      .map((t) => ({
        ...t,
        completed: completedTaskIds.has(t.id),
        priority: (impactOrder[t.impactLevel as keyof typeof impactOrder] ?? 0) * 10
          + (t.status === "in_progress" ? 5 : t.status === "done" ? -10 : 0)
          + (t.dueDate ? Math.max(0, 10 - Math.floor((new Date(t.dueDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0),
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 12)
  }, [roadmapTasks, completedTaskIds])

  const evolution = useMemo(() => {
    const buckets = Array.from({ length: 8 }, (_, index) => {
      const start = new Date()
      start.setDate(start.getDate() - (7 - index) * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      const commits = commitRecords.filter((record) => {
        const date = new Date(record.date)
        return date >= start && date <= end
      })
      return {
        label: `S${index + 1}`,
        xp: commits.reduce((acc, record) => acc + record.xp, 0),
        commits: commits.length,
      }
    })
    const maxXp = Math.max(...buckets.map((b) => b.xp), 1)
    const maxCommits = Math.max(...buckets.map((b) => b.commits), 1)
    return { buckets, maxXp, maxCommits }
  }, [commitRecords])

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
        {bitacora.image && (
          <div
            className="pointer-events-none absolute inset-0 -z-20"
            aria-hidden
            style={{
              backgroundImage: `url(${bitacora.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/85 to-black"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <BitacoraAnimatedBackground
            themeColor={bitacora.themeColor}
            rank={sapiensRank?.id ?? bitacora.avatar?.rank}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl space-y-6">
          <Card
            className="overflow-hidden border bg-[#101114]/85 backdrop-blur-xl"
            style={{
              borderColor: `${themeColors.primary}50`,
              boxShadow: `0 0 40px ${themeColors.glow}`,
            }}
          >
            <CardContent className="relative p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className="h-24 w-24 overflow-hidden rounded-full border-2 bg-black/70 shadow-lg"
                    style={{ borderColor: `${themeColors.primary}b0` }}
                  >
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
                    <p className="mt-1 text-sm uppercase tracking-wide" style={{ color: themeColors.secondary }}>
                      {parsedProfile.role}
                    </p>
                    {parsedProfile.about && <p className="mt-2 max-w-2xl text-sm text-gray-300">{parsedProfile.about}</p>}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge className="border text-white/90" style={{ borderColor: `${themeColors.secondary}66`, backgroundColor: `${themeColors.secondary}33` }}>
                        {sapiensRank?.label.toUpperCase() || "INITIUM"}
                      </Badge>
                      <Badge className="border border-emerald-400/30 bg-emerald-500/15 text-emerald-200">
                        NIVEL {bitacora.avatar?.level || 1}
                      </Badge>
                      <Badge className="border text-white/90" style={{ borderColor: `${themeColors.primary}66`, backgroundColor: `${themeColors.primary}22` }}>
                        {bitacora.avatar?.experience || 0} XP
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Dialog open={isRegistroDialogOpen} onOpenChange={setIsRegistroDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="text-white" style={{ backgroundColor: themeColors.primary }}>
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
                          Personaliza identidad, rol, fondo, color y progreso personal.
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
                            <Label htmlFor="profile-about">Sobre ti</Label>
                            <Textarea
                              id="profile-about"
                              value={profileForm.about}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, about: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              rows={3}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-skill-input">Habilidades</Label>
                            <div className="flex gap-2">
                              <Input
                                id="profile-skill-input"
                                value={newSkillInput}
                                onChange={(e) => setNewSkillInput(e.target.value)}
                                className="border-gray-700 bg-gray-900 text-white"
                                placeholder="Ej: Backend, Automation, AI Systems..."
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    const value = newSkillInput.trim()
                                    if (!value) return
                                    setProfileForm((prev) => {
                                      if (prev.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) return prev
                                      return { ...prev, skills: [...prev.skills, value] }
                                    })
                                    setNewSkillInput("")
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                className="bg-gray-800 hover:bg-gray-700"
                                onClick={() => {
                                  const value = newSkillInput.trim()
                                  if (!value) return
                                  setProfileForm((prev) => {
                                    if (prev.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) return prev
                                    return { ...prev, skills: [...prev.skills, value] }
                                  })
                                  setNewSkillInput("")
                                }}
                              >
                                Agregar
                              </Button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {profileForm.skills.length === 0 ? (
                                <span className="text-xs text-gray-400">Aún no hay habilidades agregadas.</span>
                              ) : (
                                profileForm.skills.map((skill) => (
                                  <Badge key={skill} className="border border-gray-600 bg-gray-800 text-gray-100">
                                    {skill}
                                    <button
                                      type="button"
                                      className="ml-2 text-gray-300 hover:text-white"
                                      onClick={() =>
                                        setProfileForm((prev) => ({
                                          ...prev,
                                          skills: prev.skills.filter((s) => s !== skill),
                                        }))
                                      }
                                    >
                                      x
                                    </button>
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-avatar">URL de foto de perfil</Label>
                            <Input
                              id="profile-avatar"
                              value={profileForm.avatarImageUrl}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, avatarImageUrl: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              placeholder="https://..."
                            />
                            <p className="mt-1 text-xs text-gray-500">La foto es tu identidad visual; puedes cambiarla cuando quieras.</p>
                          </div>
                          <div className="md:col-span-2">
                            <Label htmlFor="profile-cover">URL fondo completo del perfil</Label>
                            <Input
                              id="profile-cover"
                              value={profileForm.coverImage}
                              onChange={(e) => setProfileForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                              className="border-gray-700 bg-gray-900 text-white"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label>Color del perfil</Label>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                              {BITACORA_THEMES.filter((t) => t.id !== "custom").map((theme) => (
                                <button
                                  type="button"
                                  key={theme.id}
                                  onClick={() => setProfileForm((prev) => ({ ...prev, themeColor: theme.id }))}
                                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                    profileForm.themeColor === theme.id
                                      ? "border-white bg-white/10"
                                      : "border-gray-700 hover:border-gray-500"
                                  }`}
                                >
                                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                                  {theme.label}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setProfileForm((prev) => ({ ...prev, themeColor: "custom" }))}
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                                  profileForm.themeColor === "custom" ? "border-white bg-white/10" : "border-gray-700 hover:border-gray-500"
                                }`}
                              >
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: profileForm.customHexColor }} />
                                Personalizado
                              </button>
                              {profileForm.themeColor === "custom" && (
                                <Input
                                  type="color"
                                  value={profileForm.customHexColor}
                                  onChange={(e) => setProfileForm((prev) => ({ ...prev, customHexColor: e.target.value }))}
                                  className="h-9 w-14 cursor-pointer border-0 bg-transparent p-1"
                                />
                              )}
                              {profileForm.themeColor === "custom" && (
                                <Input
                                  type="text"
                                  value={profileForm.customHexColor}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v) || v === "") {
                                      setProfileForm((prev) => ({ ...prev, customHexColor: v || "#6366f1" }))
                                    }
                                  }}
                                  className="w-24 border-gray-700 bg-gray-900 text-white"
                                  placeholder="#6366f1"
                                />
                              )}
                            </div>
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
                    <span className="font-semibold" style={{ color: themeColors.secondary }}>{Math.round(progressData.progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressData.progress}%`,
                        background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.secondary})`,
                      }}
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
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  XP total
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Total de experiencia acumulada por contribuciones registradas (commits, tareas completadas desde roadmap)." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.experience || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  Registros
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Número total de commits o entradas registradas en la bitácora." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{personalStats.registros}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  Tareas completadas
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Número de tareas completadas desde los Roadmaps conectados." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.totalTasks || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  Sesiones
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Cantidad de sesiones de trabajo registradas en la bitácora." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{bitacora.avatar?.totalSessions || 0}</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  Horas registradas
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Total de horas registradas en sesiones o commits." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{(bitacora.avatar?.totalHours || 0).toFixed(1)}h</p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#1a1a1a]">
              <CardContent className="p-4">
                <p className="flex items-center gap-1 text-xs text-gray-400">
                  Impact score promedio
                  <Info className="h-3.5 w-3.5 cursor-help text-gray-500" title="Promedio de impacto calculado por el sistema basado en el valor de cada contribución." />
                </p>
                <p className="mt-1 text-xl font-bold text-white">{personalStats.impactAvg}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-gray-800 bg-[#111214]/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Sobre mí</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  {parsedProfile.about || "Agrega una descripción para contextualizar tu rol e impacto en el equipo."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#111214]/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Habilidades</CardTitle>
              </CardHeader>
              <CardContent>
                {profileSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profileSkills.map((skill) => (
                      <Badge
                        key={skill}
                        className="border"
                        style={{ borderColor: `${themeColors.secondary}66`, backgroundColor: `${themeColors.secondary}1f`, color: themeColors.secondary }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Aún no hay habilidades registradas. Edita el perfil para agregar áreas de conocimiento.</p>
                )}
              </CardContent>
            </Card>
            <Card className="border-gray-800 bg-[#111214]/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5" style={{ color: themeColors.secondary }} />
                  Metas actuales del mes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {smartGoals.length > 0 ? (
                  <>
                    <ul className="space-y-2">
                      {smartGoals.map((g) => (
                        <li key={g.id} className="flex items-center gap-2 text-sm">
                          {g.completed ? (
                            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
                          ) : (
                            <span className="h-5 w-5 shrink-0 rounded border border-gray-600" />
                          )}
                          <span className={g.completed ? "text-gray-400 line-through" : "text-gray-200"}>{g.title}</span>
                          {g.impactLevel && (
                            <Badge variant="outline" className="ml-auto shrink-0 border-gray-600 text-[10px] text-gray-400">
                              {g.impactLevel}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-md border border-gray-700 bg-black/30 p-3 text-xs text-gray-300">
                      <p className="font-medium text-gray-200">Resumen del mes</p>
                      <p>Tareas activas: {smartGoals.filter((g) => !g.completed).length}</p>
                      <p>Tareas completadas: {smartGoals.filter((g) => g.completed).length}</p>
                      <p>XP generado este mes: {monthlyStats.xp}</p>
                    </div>
                  </>
                ) : bitacora?.boardId ? (
                  <p className="text-sm text-gray-400">No hay tareas pendientes en el roadmap conectado. ¡Completa las tareas desde tu roadmap para verlas aquí!</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">Conecta un roadmap a esta bitácora para ver metas automáticas basadas en tus tareas.</p>
                    <p className="text-xs text-gray-500">{parsedProfile.goals || ""}</p>
                    <div className="rounded-md border border-gray-700 bg-black/30 p-3 text-xs text-gray-300">
                      <p>Registros del mes: {monthlyStats.commits}</p>
                      <p>XP del mes: {monthlyStats.xp}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-800 bg-[#111214]/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Evolución de rendimiento (8 semanas)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase text-gray-400">XP por semana</p>
                <div className="flex h-40 items-end gap-2">
                  {evolution.buckets.map((bucket) => (
                    <div key={`xp-${bucket.label}`} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-[10px] text-gray-300">{bucket.xp}</div>
                      <div className="relative w-full flex-1 rounded-t bg-gray-800/70">
                        <div
                          className="absolute bottom-0 w-full rounded-t"
                          style={{
                            height: `${Math.max((bucket.xp / evolution.maxXp) * 100, 4)}%`,
                            background: `linear-gradient(to top, ${themeColors.primary}, ${themeColors.secondary})`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">{bucket.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase text-gray-400">Contribuciones por semana</p>
                <div className="flex h-40 items-end gap-2">
                  {evolution.buckets.map((bucket) => (
                    <div key={`c-${bucket.label}`} className="flex flex-1 flex-col items-center gap-1">
                      <div className="text-[10px] text-gray-300">{bucket.commits}</div>
                      <div className="relative w-full flex-1 rounded-t bg-gray-800/70">
                        <div
                          className="absolute bottom-0 w-full rounded-t bg-emerald-500"
                          style={{ height: `${Math.max((bucket.commits / evolution.maxCommits) * 100, 4)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">{bucket.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="h-5 w-5 text-blue-400" />
                Filtros de historial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Select value={timeFilter} onValueChange={(value: "day" | "week" | "month" | "custom") => setTimeFilter(value)}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                    <SelectItem value="day">Hoy</SelectItem>
                    <SelectItem value="week">Últimos 7 días</SelectItem>
                    <SelectItem value="month">Últimos 30 días</SelectItem>
                    <SelectItem value="custom">Rango personalizado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(value: "ALL" | CommitSource) => setSourceFilter(value)}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Tipo de actividad" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                    <SelectItem value="ALL">Toda actividad</SelectItem>
                    <SelectItem value="MANUAL">Registro manual</SelectItem>
                    <SelectItem value="ROADMAP">Commit desde roadmap</SelectItem>
                    <SelectItem value="SESION">Sesión registrada</SelectItem>
                  </SelectContent>
                </Select>
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
                <Select value={skillFilter} onValueChange={setSkillFilter}>
                  <SelectTrigger className="border-gray-700 bg-gray-900 text-white">
                    <SelectValue placeholder="Skill asociada" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-800 bg-[#1a1a1a] text-white">
                    <SelectItem value="ALL">Todas las skills</SelectItem>
                    {uniqueSkills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  value={minTasksFilter}
                  onChange={(e) => setMinTasksFilter(e.target.value)}
                  placeholder="Tareas completadas mínimas"
                  className="border-gray-700 bg-gray-900 text-white"
                />
                {timeFilter === "custom" ? (
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300">
                    Periodo activo: {timeFilter === "day" ? "Hoy" : timeFilter === "week" ? "Últimos 7 días" : "Últimos 30 días"}
                  </div>
                )}
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
                          <Badge className="border border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200">
                            {record.source}
                          </Badge>
                          <Badge className="border border-gray-600 bg-gray-800 text-gray-200">
                            {record.impactType}
                          </Badge>
                          {record.associatedSkill && (
                            <Badge className="border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                              Skill: {record.associatedSkill}
                            </Badge>
                          )}
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
                    Registra cada commit de trabajo para fortalecer tu trayectoria personal y detectar áreas de mejora mensual.
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

