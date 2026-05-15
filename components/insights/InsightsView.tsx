"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, ArrowLeft, Info,
  BarChart2, Zap,
  MessageCircle, RefreshCcw,
  SquarePen, Settings, GitCompare, LogOut,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { fetchInsights, fetchTrends, InsightsResult } from "@/lib/api"
import { InsightsSearchBar } from "./InsightsSearchBar"
import { ScoreCards } from "./ScoreCards"
import { useChatHistory } from "@/hooks/useChatHistory"
import type { ChatSession } from "@/hooks/useChatHistory"

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiResult = InsightsResult

interface ChartPoint { date: string; value: number }

// ─── Mock chart generator (fallback) ─────────────────────────────────────────

function genChartData(days: number): ChartPoint[] {
  const out: ChartPoint[] = []
  let v = 22 + Math.random() * 18
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    v = Math.max(12, Math.min(96, v + (Math.random() - 0.28) * 14))
    out.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.round(v) })
  }
  return out
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let v = 0; const step = target / 60
    const id = setInterval(() => {
      v += step
      if (v >= target) { setVal(target); clearInterval(id) } else setVal(Math.floor(v))
    }, 16)
    return () => clearInterval(id)
  }, [target])
  return <>{val}</>
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 88, H = 40
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1
  const tx = (i: number) => (i / (data.length - 1)) * W
  const ty = (v: number) => H - ((v - min) / range) * (H - 8) - 4
  const pts = data.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ")
  const id = `sp${color.replace(/[^a-z0-9]/gi, "")}`
  const areaD = `M0,${ty(data[0])} ${data.map((v, i) => `L${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ")} L${W},${H} L0,${H} Z`
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Light Sidebar ────────────────────────────────────────────────────────────

const sidebarTopics = [
  { icon: TrendingUp, label: "Viral Foods" },
  { icon: Zap, label: "Campus Culture" },
  { icon: BarChart2, label: "FMCG Signals" },
]

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function LightSidebar() {
  const { sessions } = useChatHistory()

  return (
    <aside className="hidden lg:flex h-full w-[240px] shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-[hsl(var(--foreground))]">TrendPulse</span>
      </div>
      <div className="px-3 pb-3">
        <Link href="/" className="flex w-full items-center gap-2.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] shadow-sm transition-all hover:bg-[hsl(var(--muted))]">
          <SquarePen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          New chat
        </Link>
      </div>
      <div className="mx-4 border-t border-[hsl(var(--border))]" />
      <div className="mt-4 px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">Topics</p>
        <nav className="space-y-0.5">
          {sidebarTopics.map(({ icon: Icon, label }) => (
            <Link key={label} href={`/?topic=${encodeURIComponent(label)}`} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
              <Icon className="h-4 w-4 shrink-0" />{label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-4 px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">Pages</p>
        <nav className="space-y-0.5">
          <Link href="/" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
            <MessageCircle className="h-4 w-4 shrink-0" />Trend Chat
          </Link>
          <span className="flex w-full items-center justify-between rounded-lg bg-[hsl(262_72%_50%/0.08)] px-2.5 py-2 text-sm font-medium text-[hsl(var(--primary))]">
            <span className="flex items-center gap-2.5"><BarChart2 className="h-4 w-4 shrink-0" />Product Insights</span>
            <span className="rounded-md bg-[hsl(262_72%_50%/0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--primary))]">New</span>
          </span>
          <Link href="/compare" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
            <GitCompare className="h-4 w-4 shrink-0" />Compare
          </Link>
        </nav>
      </div>
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">Recent</p>
        {sessions.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">No recent chats</p>
        ) : (
          <nav className="space-y-0.5">
            {sessions.map((session: ChatSession) => (
              <Link
                key={session.id}
                href={`/?session=${session.id}`}
                className="flex w-full flex-col rounded-lg px-2.5 py-2 transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <p className="truncate text-[12.5px] leading-snug text-[hsl(var(--foreground))]">
                  {session.title}
                </p>
                <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                  {timeAgo(session.updatedAt)}
                </p>
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="border-t border-[hsl(var(--border))] p-2 space-y-0.5">
        <Link href="/settings" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
          <Settings className="h-4 w-4 shrink-0" />Settings
        </Link>
        <SidebarLogout />
      </div>
    </aside>
  )
}

function SidebarLogout() {
  const router = useRouter()
  return (
    <button
      onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login") }}
      aria-label="Sign out"
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-50 hover:text-red-500"
    >
      <LogOut className="h-4 w-4 shrink-0" />Sign out
    </button>
  )
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
      <p className="text-sm font-semibold text-[hsl(var(--primary))]">{payload[0].value}</p>
    </div>
  )
}

// ─── Compare score bar ────────────────────────────────────────────────────────

// ─── Main component ───────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d"

export function InsightsView() {
  // ── Analyze state ─────────────────────────────────────────────────────────
  const [query, setQuery] = useState("")
  const [imageName, setImageName] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<(ApiResult & { chartData: Record<Range, ChartPoint[]> }) | null>(null)
  const [summary, setSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>("30d")
  const [wikiTitle, setWikiTitle] = useState<string | null>(null)

  // Clean up object URL
  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl) }
  }, [imagePreviewUrl])

  // ── Streaming summary ──────────────────────────────────────────────────────

  const streamSummary = useCallback(async (product: string, context: object) => {
    setSummaryLoading(true); setSummary("")
    try {
      const res = await fetch("/api/insights/summary", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, context }),
      })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader(); const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        setSummary(prev => prev + decoder.decode(value, { stream: true }))
      }
    } finally { setSummaryLoading(false) }
  }, [])

  // ── Analyze ────────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    const productName = query.trim()
    if (!productName && !imageFile) return
    setAnalyzing(true); setResult(null); setSummary(""); setError(null); setWikiTitle(null)
    try {
      let data: ApiResult
      if (imageFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(",")[1])
          reader.onerror = reject; reader.readAsDataURL(imageFile)
        })
        data = await fetchInsights(productName || imageFile.name, base64, imageFile.type)
      } else {
        data = await fetchInsights(productName)
      }

      const productLabel = productName || data.name

      let chartData = { "7d": genChartData(7), "30d": genChartData(30), "90d": genChartData(90) }
      try {
        const td = await fetchTrends(productLabel)
        if (td.source === "wikipedia") { setWikiTitle(td.title ?? null) }
        if (td.source === "wikipedia" || td.source === "ai") {
          chartData = {
            "7d": td.data["7d"].length > 2 ? td.data["7d"] : genChartData(7),
            "30d": td.data["30d"].length > 2 ? td.data["30d"] : genChartData(30),
            "90d": td.data["90d"].length > 2 ? td.data["90d"] : genChartData(90),
          }
        }
      } catch {
        // Trends are best-effort; fall through to generated chart data
      }

      setResult({ ...data, chartData })
      streamSummary(productLabel, { scores: data.scores, badge: data.badge, category: data.category })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.")
    } finally { setAnalyzing(false) }
  }, [query, imageFile, streamSummary])

  const scoreLabel = (s: number) =>
    s >= 80 ? "High Potential" : s >= 65 ? "Strong Demand" : s >= 50 ? "Moderate" : "Low"

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full overflow-hidden bg-[hsl(var(--surface))]">
      <LightSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-white px-4 lg:px-8">
          <h1 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Product Insights</h1>
          <Link href="/" className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:bg-[hsl(var(--muted))]">
            <ArrowLeft className="h-3.5 w-3.5" />Back to Chat
          </Link>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 lg:px-8 py-6 lg:py-8">

            {/* Page title */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">Product Insights</h2>
              <p className="mt-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                Analyze any food or FMCG product to detect trend potential, current demand, and viral growth signals.
              </p>
            </motion.div>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            {/* ANALYZE                                                        */}
            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
            <>
                {/* Search section */}
                <InsightsSearchBar
                  query={query}
                  setQuery={setQuery}
                  onSubmit={handleAnalyze}
                  analyzing={analyzing}
                  onFileSelect={e => {
                    const f = e.target.files?.[0] ?? null
                    setImageName(f?.name ?? null); setImageFile(f)
                    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
                    setImagePreviewUrl(f ? URL.createObjectURL(f) : null)
                  }}
                  imagePreviewUrl={imagePreviewUrl}
                  fileInputRef={fileInputRef}
                />

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
                    >
                      <p className="text-sm text-red-600">{error}</p>
                      <button onClick={handleAnalyze}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>
                        Try again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Skeleton */}
                <AnimatePresence>
                  {analyzing && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                            {i === 0 ? (<>
                              <div className="mb-4 h-32 w-full animate-pulse rounded-xl bg-[hsl(220_14%_92%)]" />
                              <div className="h-3 w-16 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                              <div className="mt-2 h-4 w-3/4 animate-pulse rounded-full bg-[hsl(220_14%_90%)]" />
                              <div className="mt-3 h-7 w-full animate-pulse rounded-lg bg-[hsl(220_14%_92%)]" />
                            </>) : (<>
                              <div className="h-3 w-24 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                              <div className="mt-4 h-10 w-16 animate-pulse rounded-lg bg-[hsl(220_14%_90%)]" />
                              <div className="mt-2 h-3 w-20 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                              <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-[hsl(220_14%_94%)]" />
                            </>)}
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                            <div className="mb-4 h-4 w-32 animate-pulse rounded-full bg-[hsl(220_14%_90%)]" />
                            <div className="space-y-4">
                              {[0, 1, 2, 3, 4, 5].map(j => (
                                <div key={j}>
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="h-3 w-28 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                                    <div className="h-3 w-12 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                                  </div>
                                  <div className="h-1 w-full animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm">
                        <div className="mb-4 h-4 w-36 animate-pulse rounded-full bg-[hsl(220_14%_90%)]" />
                        <div className="space-y-2">
                          {[100, 90, 95, 75, 85, 60].map((w, i) => (
                            <div key={i} className="h-3 animate-pulse rounded-full bg-[hsl(220_14%_93%)]" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                  {result && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-5">
                      {/* Product card + score cards */}
                      <ScoreCards result={result} imagePreviewUrl={imagePreviewUrl} />

                      {/* Analytics grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                          <h3 className="mb-4 text-sm font-semibold text-[hsl(var(--foreground))]">Detailed Analysis</h3>
                          <div className="space-y-4">
                            {result.metrics.map((m, i) => (
                              <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
                                <div className="mb-1.5 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <p className="text-[13px] font-semibold text-[hsl(var(--foreground))]">{m.label}</p>
                                      <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{m.description}</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold tabular-nums" style={{ color: m.color }}>{m.score}/100</span>
                                </div>
                                <div className="h-1 w-full overflow-hidden rounded-full bg-[hsl(220_14%_93%)]">
                                  <motion.div className="h-full rounded-full" style={{ backgroundColor: m.color }}
                                    initial={{ width: 0 }} animate={{ width: `${m.score}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
                                  />
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Demand Over Time</h3>
                            <div className="flex rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-0.5">
                              {(["7d", "30d", "90d"] as Range[]).map(r => (
                                <button key={r} onClick={() => setRange(r)}
                                  className={["rounded-md px-2.5 py-1 text-xs font-medium transition-all", range === r ? "bg-[hsl(var(--primary))] text-white shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"].join(" ")}
                                >{r}</button>
                              ))}
                            </div>
                          </div>
                          <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={result.chartData[range]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                                <defs>
                                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(262,72%,50%)" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="hsl(262,72%,50%)" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} tickLine={false} axisLine={false} interval={range === "7d" ? 1 : range === "30d" ? 6 : 14} />
                                <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(262,72%,50%,0.2)", strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="value" stroke="hsl(262,72%,50%)" strokeWidth={2} fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(262,72%,50%)", stroke: "#fff", strokeWidth: 2 }} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[hsl(262_72%_50%/0.06)] px-3 py-2.5">
                            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" />
                            <p className="text-[11px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                              {wikiTitle ? <>Real Wikipedia pageview data for <span className="font-semibold text-[hsl(var(--primary))]">{wikiTitle}</span></> : <>AI-modeled trend curve based on real market trajectory knowledge</>}
                            </p>
                          </div>
                        </div>

                        {/* Key Signals */}
                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Key Signals</h3>
                            <span className="rounded-md bg-[hsl(var(--muted))] px-1.5 py-0.5 text-[11px] font-medium text-[hsl(var(--muted-foreground))]">{result.signals.length}</span>
                            <Info className="ml-auto h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] opacity-40" />
                          </div>
                          <div className="space-y-3">
                            {result.signals.map((s, i) => (
                              <motion.div key={s.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.05 }} className="flex items-center gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${s.color}18` }}>
                                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[12px] font-semibold text-[hsl(var(--foreground))]">{s.label}</p>
                                  <p className="truncate text-[10px] text-[hsl(var(--muted-foreground))]">{s.description}</p>
                                </div>
                                <span className="text-sm font-bold tabular-nums" style={{ color: s.color }}>{s.score}/100</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Insights Summary */}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
                      >
                        <div className="mb-4 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(262_72%_50%/0.08)]">
                            <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                          </div>
                          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Insights Summary</h3>
                          {summaryLoading && (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="ml-2">
                              <RefreshCcw className="h-3 w-3 text-[hsl(var(--primary))] opacity-60" />
                            </motion.div>
                          )}
                        </div>
                        {summary ? (
                          <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">{summary}</p>
                        ) : (
                          <div className="space-y-2">
                            {[100, 90, 95, 75, 85, 60].map((w, i) => (
                              <div key={i} className="h-3 animate-pulse rounded-full bg-[hsl(220_14%_93%)]" style={{ width: `${w}%` }} />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>

          </div>
        </div>
      </div>
    </div>
  )
}
