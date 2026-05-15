"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"

interface Stats {
  analyses: number
  comparisons: number
  chat_messages: number
  total_analyses: number
  total_interactions: number
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toString()
}

/** Compact stats strip for the sidebar bottom */
export function SidebarStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats || stats.total_interactions === 0) return null

  return (
    <div className="mx-3 mb-2 rounded-lg bg-[hsl(262_72%_50%/0.06)] px-3 py-2.5 border border-[hsl(262_72%_50%/0.12)]">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Activity className="h-3 w-3 text-[hsl(var(--primary))]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--primary))]">
          Platform Stats
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {stats.total_analyses > 0 && (
          <div>
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">{formatNum(stats.total_analyses)}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">analyses</p>
          </div>
        )}
        {stats.chat_messages > 0 && (
          <div>
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">{formatNum(stats.chat_messages)}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">AI messages</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Large animated counter for landing/hero sections */
export function HeroStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [displayed, setDisplayed] = useState({ analyses: 0, chats: 0 })

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then((s: Stats) => {
        setStats(s)
        // Animate count-up
        const target_a = s.total_analyses
        const target_c = s.chat_messages
        const duration = 1200
        const steps = 40
        const interval = duration / steps
        let step = 0
        const timer = setInterval(() => {
          step++
          const progress = step / steps
          const eased = 1 - Math.pow(1 - progress, 3)
          setDisplayed({
            analyses: Math.round(target_a * eased),
            chats: Math.round(target_c * eased),
          })
          if (step >= steps) clearInterval(timer)
        }, interval)
        return () => clearInterval(timer)
      })
      .catch(() => {})
  }, [])

  const items = [
    { value: displayed.analyses, label: "Products Analyzed", suffix: "+" },
    { value: displayed.chats, label: "AI Conversations", suffix: "+" },
    { value: 3, label: "AI Models", suffix: "" },
    { value: 8, label: "Sec per Analysis", suffix: "s" },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map(({ value, label, suffix }) => (
        <div key={label} className="text-center">
          <p className="text-3xl font-black text-white">
            {value}{suffix}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{label}</p>
        </div>
      ))}
    </div>
  )
}
