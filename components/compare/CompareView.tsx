"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, ArrowLeft, RefreshCcw, GitCompare,
  BarChart2, Zap, MessageCircle, SquarePen, Settings,
  ArrowRight, Trophy, Minus, LogOut, Trash2,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"
import { fetchInsights, fetchTrends, InsightsResult } from "@/lib/api"
import { MetricRow } from "./MetricRow"
import { DualTooltip } from "./DualTooltip"
import { useCompareHistory } from "@/hooks/useCompareHistory"

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiResult = InsightsResult

interface DualPoint { date: string; valueA: number; valueB: number }
type Range = "7d" | "30d" | "90d"

// ─── Popular suggestions ──────────────────────────────────────────────────────

const POPULAR = [
  { label: "Buldak vs Indomie",         a: "Buldak Ramen",          b: "Indomie Goreng" },
  { label: "Prime vs Gatorade",          a: "Prime Hydration",       b: "Gatorade" },
  { label: "Dubai Chocolate vs Nutella", a: "Dubai Chocolate Bar",   b: "Nutella" },
  { label: "Monster vs Red Bull",        a: "Monster Energy",        b: "Red Bull" },
  { label: "Pringles vs Lay's",          a: "Pringles",              b: "Lay's Chips" },
  { label: "Oreo vs Chips Ahoy",         a: "Oreo Cookies",          b: "Chips Ahoy" },
]

// ─── Fallback chart data ───────────────────────────────────────────────────────

function genFallback(days: number) {
  const out: { date: string; value: number }[] = []
  let v = 25 + Math.random() * 20
  const now = new Date()
  for (let i = days; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i)
    v = Math.max(10, Math.min(95, v + (Math.random() - 0.28) * 14))
    out.push({ date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), value: Math.round(v) })
  }
  return out
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function CompareSidebar({
  history,
  removeItem,
  onSelect,
}: {
  history: ReturnType<typeof useCompareHistory>["history"]
  removeItem: ReturnType<typeof useCompareHistory>["removeItem"]
  onSelect: (a: string, b: string) => void
}) {

  return (
    <aside className="hidden lg:flex h-full w-[240px] shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-[hsl(var(--foreground))]">Next Wave</span>
      </div>

      <div className="px-3 pb-3">
        <Link href="/" className="flex w-full items-center gap-2.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] shadow-sm transition-all hover:bg-[hsl(var(--muted))]">
          <SquarePen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />New chat
        </Link>
      </div>

      <div className="mx-4 border-t border-[hsl(var(--border))]" />

      <div className="mt-4 px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">Topics</p>
        <nav className="space-y-0.5">
          {[
            { icon: TrendingUp, label: "Viral Foods", href: "/?topic=Viral+Foods" },
            { icon: Zap, label: "Campus Culture", href: "/?topic=Campus+Culture" },
            { icon: BarChart2, label: "FMCG Signals", href: "/?topic=FMCG+Signals" },
          ].map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
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
          <Link href="/insights" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
            <BarChart2 className="h-4 w-4 shrink-0" />Product Insights
          </Link>
          {/* Active page */}
          <span className="flex w-full items-center justify-between rounded-lg bg-[hsl(262_72%_50%/0.08)] px-2.5 py-2 text-sm font-medium text-[hsl(var(--primary))]">
            <span className="flex items-center gap-2.5"><GitCompare className="h-4 w-4 shrink-0" />Compare</span>
            <span className="rounded-md bg-[hsl(262_72%_50%/0.12)] px-1.5 py-0.5 text-[10px] font-semibold text-[hsl(var(--primary))]">New</span>
          </span>
        </nav>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">Recent</p>
        {history.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">No recent comparisons</p>
        ) : (
          <nav className="space-y-0.5">
            {history.map(item => (
              <div
                key={item.id}
                className="group flex w-full items-center gap-1 rounded-lg transition-colors hover:bg-[hsl(var(--muted))]"
              >
                <button
                  onClick={() => onSelect(item.productA, item.productB)}
                  className="min-w-0 flex-1 px-2.5 py-2 text-left"
                >
                  <p className="truncate text-[12.5px] leading-snug text-[hsl(var(--foreground))]">
                    {item.productA} vs {item.productB}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                    {timeAgo(item.comparedAt)}
                  </p>
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                  className="mr-1.5 shrink-0 rounded-md p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </nav>
        )}
      </div>

      <div className="border-t border-[hsl(var(--border))] p-2 space-y-0.5">
        <Link href="/settings" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
          <Settings className="h-4 w-4 shrink-0" />Settings
        </Link>
        <CompareLogout />
      </div>
    </aside>
  )
}

function CompareLogout() {
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

// ─── Main component ───────────────────────────────────────────────────────────

export function CompareView() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { history, addItem, removeItem } = useCompareHistory()

  const [queryA, setQueryA] = useState(searchParams.get("a") ?? "")
  const [queryB, setQueryB] = useState(searchParams.get("b") ?? "")
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [trendsLoading, setTrendsLoading] = useState(false)
  const [compareA, setCompareA] = useState<ApiResult | null>(null)
  const [compareB, setCompareB] = useState<ApiResult | null>(null)
  const [chartData, setChartData] = useState<Record<Range, DualPoint[]> | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [range, setRange] = useState<Range>("30d")
  const didAutoRun = useRef(false)

  // ── Run comparison ──────────────────────────────────────────────────────────

  const runCompare = useCallback(async (a: string, b: string) => {
    if (!a.trim() || !b.trim()) return
    setInsightsLoading(true)
    setTrendsLoading(true)
    setCompareA(null); setCompareB(null); setChartData(null); setCompareError(null)

    router.replace(`/compare?a=${encodeURIComponent(a.trim())}&b=${encodeURIComponent(b.trim())}`, { scroll: false })

    // Start trends in parallel with insights — chart appears as soon as it's ready
    const trendsPromise = (async () => {
      try {
        const [tdA, tdB] = await Promise.all([
          fetchTrends(a.trim()),
          fetchTrends(b.trim()),
        ])

        const dayMap: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90 }
        const mergeRange = (key: Range): DualPoint[] => {
          const days = dayMap[key]
          const arrA = tdA.data[key].length > 2 ? tdA.data[key] : genFallback(days)
          const arrB = tdB.data[key].length > 2 ? tdB.data[key] : genFallback(days)
          const len = Math.min(arrA.length, arrB.length)
          return Array.from({ length: len }, (_, i) => ({
            date: arrA[i].date,
            valueA: arrA[i].value,
            valueB: arrB[i].value,
          }))
        }
        setChartData({ "7d": mergeRange("7d"), "30d": mergeRange("30d"), "90d": mergeRange("90d") })
      } catch {
        // Trends are best-effort; chart data remains null (no chart shown)
      } finally {
        setTrendsLoading(false)
      }
    })()

    try {
      // Insights — show cards as fast as possible (independent of trends)
      const [dA, dB] = await Promise.all([
        fetchInsights(a.trim()),
        fetchInsights(b.trim()),
      ])
      setCompareA(dA)
      setCompareB(dB)
      addItem(a.trim(), b.trim())
    } catch (err) {
      setCompareError(err instanceof Error ? err.message : "Comparison failed. Please try again.")
    } finally {
      setInsightsLoading(false)
    }

    await trendsPromise
  }, [router])

  // Auto-run when page loads with URL params
  useEffect(() => {
    if (didAutoRun.current) return
    const a = searchParams.get("a")
    const b = searchParams.get("b")
    if (a && b) {
      didAutoRun.current = true
      setQueryA(a); setQueryB(b)
      runCompare(a, b)
    }
  }, [searchParams, runCompare])

  const handleCompare = () => runCompare(queryA, queryB)

  const handleSuggestion = (a: string, b: string) => {
    setQueryA(a); setQueryB(b)
    runCompare(a, b)
  }

  // ── Overall winner ──────────────────────────────────────────────────────────

  const winner = compareA && compareB ? (() => {
    const sumA = compareA.scores.growth + compareA.scores.demand + compareA.scores.momentum
    const sumB = compareB.scores.growth + compareB.scores.demand + compareB.scores.momentum
    if (sumA > sumB) return { side: "A" as const, product: compareA, margin: sumA - sumB }
    if (sumB > sumA) return { side: "B" as const, product: compareB, margin: sumB - sumA }
    return { side: "tie" as const, product: null, margin: 0 }
  })() : null

  const comparing = insightsLoading // skeleton göster sadece insights yüklenirken
  const hasResults = !!(compareA && compareB)
  const isEmpty = !hasResults && !insightsLoading && !trendsLoading && !compareError

  // ── Color constants ─────────────────────────────────────────────────────────
  const COLOR_A = "hsl(262,72%,50%)"
  const COLOR_B = "#F59E0B"

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full overflow-hidden bg-[hsl(var(--surface))]">
      <CompareSidebar history={history} removeItem={removeItem} onSelect={(a, b) => { setQueryA(a); setQueryB(b); runCompare(a, b) }} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(var(--border))] bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
              <GitCompare className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Product Comparison</h1>
          </div>
          <Link href="/" className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:bg-[hsl(var(--muted))]">
            <ArrowLeft className="h-3.5 w-3.5" />Back to Chat
          </Link>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 lg:px-8 py-6 lg:py-8">

            {/* Search card */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
              className="mb-6 rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
            >
              <p className="mb-4 text-sm font-medium text-[hsl(var(--muted-foreground))]">Compare any two food or FMCG products</p>

              {/* Inputs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${COLOR_A}18`, color: COLOR_A }}>A</div>
                  <input
                    type="text" value={queryA} onChange={e => setQueryA(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCompare()}
                    placeholder="e.g. Buldak Ramen"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] py-3 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(262_72%_50%/0.12)] transition-all"
                  />
                </div>

                <div className="flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-full bg-[hsl(var(--muted))]">
                  <span className="text-[10px] font-bold text-[hsl(var(--muted-foreground))]">VS</span>
                </div>

                <div className="relative flex-1">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${COLOR_B}18`, color: COLOR_B }}>B</div>
                  <input
                    type="text" value={queryB} onChange={e => setQueryB(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCompare()}
                    placeholder="e.g. Indomie Goreng"
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] py-3 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(262_72%_50%/0.12)] transition-all"
                  />
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCompare}
                  disabled={insightsLoading || trendsLoading || !queryA.trim() || !queryB.trim()}
                  className="flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-[hsl(262_72%_50%/0.25)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {comparing ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <RefreshCcw className="h-4 w-4" />
                    </motion.div>
                  ) : <GitCompare className="h-4 w-4" />}
                  {comparing ? "Analyzing…" : "Compare"}
                </motion.button>
              </div>

              {/* Popular suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-[11px] text-[hsl(var(--muted-foreground))] self-center">Try:</span>
                {POPULAR.map(s => (
                  <button key={s.label} onClick={() => handleSuggestion(s.a, s.b)}
                    className="flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-1 text-[11px] font-medium text-[hsl(var(--muted-foreground))] transition-all hover:border-[hsl(262_72%_50%/0.4)] hover:bg-[hsl(262_72%_50%/0.05)] hover:text-[hsl(var(--primary))]"
                  >
                    <GitCompare className="h-2.5 w-2.5" />{s.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {compareError && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-5 py-4"
                >
                  <p className="text-sm text-red-600">{compareError}</p>
                  <button onClick={handleCompare}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <RefreshCcw className="h-3 w-3" />Try again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {isEmpty && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="flex flex-col items-center py-20 text-center"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(262_72%_50%/0.08)]">
                  <GitCompare className="h-8 w-8 text-[hsl(var(--primary))] opacity-60" strokeWidth={1.5} />
                </div>
                <h2 className="mb-2 text-xl font-bold text-[hsl(var(--foreground))]">Ready to compare</h2>
                <p className="max-w-sm text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                  Enter two products above or pick a popular comparison to see a full side-by-side breakdown.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {POPULAR.map(s => (
                    <button key={s.label} onClick={() => handleSuggestion(s.a, s.b)}
                      className="group flex flex-col items-start gap-2 rounded-2xl border border-[hsl(var(--border))] bg-white p-4 text-left shadow-sm transition-all hover:border-[hsl(262_72%_50%/0.35)] hover:shadow-md"
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[hsl(262_72%_50%/0.08)] transition-colors group-hover:bg-[hsl(262_72%_50%/0.14)]">
                          <GitCompare className="h-3 w-3 text-[hsl(var(--primary))]" />
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-[hsl(var(--foreground))]">{s.a}</p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">vs {s.b}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Skeleton */}
            <AnimatePresence>
              {comparing && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                  {/* Winner skeleton */}
                  <div className="h-[68px] animate-pulse rounded-2xl bg-[hsl(220_14%_92%)]" />
                  {/* Product cards skeleton */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[0, 1].map(i => (
                      <div key={i} className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
                        <div className="mb-3 h-3 w-16 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                        <div className="mb-4 h-5 w-3/4 animate-pulse rounded-full bg-[hsl(220_14%_90%)]" />
                        <div className="mb-4 h-6 w-28 animate-pulse rounded-lg bg-[hsl(220_14%_93%)]" />
                        <div className="grid grid-cols-3 gap-2">
                          {[0,1,2].map(j => <div key={j} className="h-16 animate-pulse rounded-xl bg-[hsl(220_14%_93%)]" />)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chart skeleton */}
                  <div className="h-64 animate-pulse rounded-2xl bg-[hsl(220_14%_92%)]" />
                  {/* Metrics skeleton */}
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm">
                    <div className="mb-5 h-4 w-40 animate-pulse rounded-full bg-[hsl(220_14%_90%)]" />
                    <div className="space-y-6">
                      {[0,1,2,3,4,5].map(i => (
                        <div key={i} className="grid grid-cols-[1fr_140px_1fr] gap-4">
                          <div className="h-2 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                          <div className="mx-auto h-4 w-24 animate-pulse rounded-full bg-[hsl(220_14%_93%)]" />
                          <div className="h-2 animate-pulse rounded-full bg-[hsl(220_14%_92%)]" />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {hasResults && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-5">

                  {/* Winner banner */}
                  {winner && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
                      className={[
                        "flex items-center gap-4 rounded-2xl border px-6 py-4",
                        winner.side === "tie"
                          ? "border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
                          : "border-[hsl(262_72%_50%/0.25)] bg-[hsl(262_72%_50%/0.05)]",
                      ].join(" ")}
                    >
                      <div className={["flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", winner.side === "tie" ? "bg-[hsl(var(--muted-foreground))]" : "bg-[hsl(var(--primary))]"].join(" ")}>
                        {winner.side === "tie" ? <Minus className="h-5 w-5 text-white" strokeWidth={2.5} /> : <Trophy className="h-5 w-5 text-white" strokeWidth={2} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        {winner.side === "tie" ? (
                          <>
                            <p className="text-[15px] font-bold text-[hsl(var(--foreground))]">Dead heat — both products score equally</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Combined growth + demand + momentum are identical</p>
                          </>
                        ) : (
                          <>
                            <p className="text-[15px] font-bold text-[hsl(var(--foreground))]">
                              <span style={{ color: winner.side === "A" ? COLOR_A : COLOR_B }}>{winner.product!.name}</span>
                              {" "}leads overall
                            </p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              Ahead by {winner.margin} combined points across growth, demand &amp; momentum
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-center">
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Product A</p>
                          <p className="text-sm font-bold" style={{ color: COLOR_A }}>
                            {compareA.scores.growth + compareA.scores.demand + compareA.scores.momentum}
                          </p>
                        </div>
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-center">
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Product B</p>
                          <p className="text-sm font-bold" style={{ color: COLOR_B }}>
                            {compareB.scores.growth + compareB.scores.demand + compareB.scores.momentum}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Product cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {([
                      { data: compareA, color: COLOR_A, label: "A" },
                      { data: compareB, color: COLOR_B, label: "B" },
                    ] as const).map(({ data, color, label }, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.08 }}
                        className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm"
                      >
                        {/* Label badge */}
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold" style={{ backgroundColor: `${color}18`, color }}>
                              {label}
                            </div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{data!.category}</p>
                          </div>
                          {winner?.side !== "tie" && winner?.product?.name === data!.name && (
                            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                              <Trophy className="h-2.5 w-2.5" />Winner
                            </div>
                          )}
                        </div>

                        <h3 className="mb-2 text-[16px] font-bold leading-tight text-[hsl(var(--foreground))]">{data!.name}</h3>

                        <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1" style={{ backgroundColor: `${color}12` }}>
                          <TrendingUp className="h-3 w-3" style={{ color }} strokeWidth={2.5} />
                          <span className="text-[11px] font-semibold" style={{ color }}>{data!.badge}</span>
                        </div>

                        {/* Scores */}
                        <div className="grid grid-cols-3 gap-2">
                          {(["growth", "demand", "momentum"] as const).map((key, i) => {
                            const scoreLabels = ["Growth", "Demand", "Momentum"]
                            const score = data!.scores[key]
                            return (
                              <div key={key} className="flex flex-col items-center rounded-xl border border-[hsl(var(--border))] py-3">
                                <span className="text-[22px] font-bold tabular-nums" style={{ color }}>{score}</span>
                                <span className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">{scoreLabels[i]}</span>
                              </div>
                            )
                          })}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Dual trend chart */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Trend Trajectory</h3>
                        <p className="mt-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">AI-modeled demand curves for both products over time</p>
                      </div>
                      {!trendsLoading && chartData && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-3 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: COLOR_A }} />
                              <span className="text-[hsl(var(--muted-foreground))]">{compareA.name.split(" ")[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-4 rounded-full" style={{ backgroundColor: COLOR_B }} />
                              <span className="text-[hsl(var(--muted-foreground))]">{compareB.name.split(" ")[0]}</span>
                            </div>
                          </div>
                          <div className="flex rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-0.5">
                            {(["7d", "30d", "90d"] as Range[]).map(r => (
                              <button key={r} onClick={() => setRange(r)}
                                className={["rounded-md px-2.5 py-1 text-xs font-medium transition-all", range === r ? "bg-[hsl(var(--primary))] text-white shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"].join(" ")}
                              >{r}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {trendsLoading ? (
                      <div className="h-[240px] animate-pulse rounded-xl bg-[hsl(220_14%_93%)]" />
                    ) : chartData ? (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData[range]} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                              <linearGradient id="cmpGradA" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLOR_A} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={COLOR_A} stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="cmpGradB" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={COLOR_B} stopOpacity={0.15} />
                                <stop offset="100%" stopColor={COLOR_B} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} tickLine={false} axisLine={false}
                              interval={range === "7d" ? 1 : range === "30d" ? 6 : 14}
                            />
                            <YAxis tick={{ fontSize: 10, fill: "rgba(0,0,0,0.35)" }} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <Tooltip content={<DualTooltip nameA={compareA.name} nameB={compareB.name} />} />
                            <Area type="monotone" dataKey="valueA" stroke={COLOR_A} strokeWidth={2} fill="url(#cmpGradA)" dot={false} activeDot={{ r: 4, fill: COLOR_A, stroke: "#fff", strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="valueB" stroke={COLOR_B} strokeWidth={2} fill="url(#cmpGradB)" dot={false} activeDot={{ r: 4, fill: COLOR_B, stroke: "#fff", strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : null}
                  </motion.div>

                  {/* Metric comparison */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
                  >
                    <div className="mb-6 grid grid-cols-[1fr_140px_1fr]">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLOR_A }} />
                        <p className="truncate text-sm font-semibold text-[hsl(var(--foreground))]">{compareA.name}</p>
                      </div>
                      <p className="text-center text-sm font-semibold text-[hsl(var(--foreground))]">Metric</p>
                      <div className="flex items-center justify-end gap-2">
                        <p className="truncate text-right text-sm font-semibold text-[hsl(var(--foreground))]">{compareB.name}</p>
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLOR_B }} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {compareA.metrics.map((mA, i) => {
                        const mB = compareB.metrics[i]
                        if (!mB) return null
                        return (
                          <MetricRow key={mA.id} label={mA.label} scoreA={mA.score} scoreB={mB.score}
                            color={mA.color} nameA={compareA.name} nameB={compareB.name} index={i}
                          />
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Signal grid */}
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
                  >
                    <h3 className="mb-5 text-sm font-semibold text-[hsl(var(--foreground))]">Signal Breakdown</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {compareA.signals.map((sA, i) => {
                        const sB = compareB.signals[i]
                        if (!sB) return null
                        const winA = sA.score > sB.score
                        const winB = sB.score > sA.score
                        const tie = sA.score === sB.score
                        return (
                          <motion.div key={sA.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                            className="rounded-xl border border-[hsl(var(--border))] p-4"
                          >
                            <p className="mb-3 text-[12px] font-semibold text-[hsl(var(--foreground))]">{sA.label}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(220_14%_93%)]">
                                  <div className="h-full rounded-full" style={{ width: `${sA.score}%`, backgroundColor: winA ? COLOR_A : `${COLOR_A}50` }} />
                                </div>
                                <span className={`w-8 text-right text-[11px] font-bold tabular-nums ${winA ? "" : "opacity-40"}`} style={{ color: COLOR_A }}>{sA.score}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[hsl(220_14%_93%)]">
                                  <div className="h-full rounded-full" style={{ width: `${sB.score}%`, backgroundColor: winB ? COLOR_B : `${COLOR_B}50` }} />
                                </div>
                                <span className={`w-8 text-right text-[11px] font-bold tabular-nums ${winB ? "" : "opacity-40"}`} style={{ color: COLOR_B }}>{sB.score}</span>
                              </div>
                            </div>
                            <p className="mt-2 text-[10px] font-medium" style={{ color: tie ? "hsl(var(--muted-foreground))" : winA ? COLOR_A : COLOR_B }}>
                              {tie ? "Tied" : winA ? `${compareA.name.split(" ")[0]} leads` : `${compareB.name.split(" ")[0]} leads`}
                            </p>
                          </motion.div>
                        )
                      })}
                    </div>
                  </motion.div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  )
}
