"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Info, Eye } from "lucide-react"
import { InsightsResult } from "@/lib/api"

// ─── Animated counter (local copy — identical to InsightsView) ────────────────

function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let v = 0
    const step = target / 60
    const id = setInterval(() => {
      v += step
      if (v >= target) { setVal(target); clearInterval(id) } else setVal(Math.floor(v))
    }, 16)
    return () => clearInterval(id)
  }, [target])
  return <>{val}</>
}

// ─── Mini sparkline (local copy — identical to InsightsView) ──────────────────

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
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Score label helper ───────────────────────────────────────────────────────

function scoreLabel(s: number) {
  return s >= 80 ? "High Potential" : s >= 65 ? "Strong Demand" : s >= 50 ? "Moderate" : "Low"
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScoreCardsProps {
  result: InsightsResult
  imagePreviewUrl?: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScoreCards({ result, imagePreviewUrl }: ScoreCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Product image card */}
      <div className="col-span-1 flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm">
        <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-[hsl(var(--surface))]">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagePreviewUrl} alt="Product" className="h-full w-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <Eye className="h-8 w-8 opacity-30" />
              <span className="text-xs opacity-50">Product Image</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
            {result.category}
          </p>
          <h3 className="mt-1 text-base font-bold leading-tight text-[hsl(var(--foreground))]">
            {result.name}
          </h3>
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[hsl(262_72%_50%/0.08)] px-2.5 py-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--primary))]" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-[hsl(var(--primary))]">{result.badge}</span>
          </div>
        </div>
      </div>

      {/* 3 score cards */}
      {(["growth", "demand", "momentum"] as const).map((key, i) => {
        const score = result.scores[key]
        const color = i === 0 ? "#22C55E" : i === 1 ? "#F59E0B" : "#3B82F6"
        const sparkData = Array.from({ length: 12 }, (_, j) =>
          Math.max(20, Math.min(95, score - 20 + j * 5 + Math.random() * 10))
        )
        const labels = ["Growth Probability", "Current Demand", "Market Momentum"]
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            className="col-span-1 flex flex-col justify-between rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{labels[i]}</p>
              <Info className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))] opacity-40" />
            </div>
            <div className="my-3">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold tabular-nums" style={{ color }}>
                  <Counter target={score} />
                </span>
                <span className="mb-1 text-lg font-medium text-[hsl(var(--muted-foreground))]">/100</span>
              </div>
              <p className="mt-0.5 text-xs font-medium" style={{ color }}>{scoreLabel(score)}</p>
            </div>
            <Sparkline data={sparkData} color={color} />
          </motion.div>
        )
      })}
    </div>
  )
}
