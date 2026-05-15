"use client"

import { motion } from "framer-motion"
import { Minus } from "lucide-react"

interface MetricRowProps {
  label: string
  scoreA: number
  scoreB: number
  color: string
  nameA: string
  nameB: string
  index: number
}

export function MetricRow({ label, scoreA, scoreB, color, nameA, nameB, index }: MetricRowProps) {
  const winA = scoreA > scoreB
  const winB = scoreB > scoreA
  const tie = scoreA === scoreB

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
      className="grid grid-cols-[1fr_140px_1fr] items-center gap-4"
    >
      {/* A side */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold tabular-nums ${winA ? "" : "opacity-40"}`}
            style={{ color }}
          >
            {scoreA}/100
          </span>
          {winA && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
              ▲ WINS
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[hsl(220_14%_93%)]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: winA ? color : `${color}50` }}
              initial={{ width: 0 }}
              animate={{ width: `${scoreA}%` }}
              transition={{ duration: 0.8, delay: 0.15 + index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Label center */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[12px] font-semibold text-[hsl(var(--foreground))]">{label}</p>
        {tie ? (
          <span className="flex items-center gap-0.5 text-[9px] font-bold text-[hsl(var(--muted-foreground))]">
            <Minus className="h-2.5 w-2.5" />TIE
          </span>
        ) : (
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {winA ? nameA.split(" ")[0] : nameB.split(" ")[0]} leads
          </span>
        )}
      </div>

      {/* B side */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {winB && (
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">
              ▲ WINS
            </span>
          )}
          <span
            className={`ml-auto text-xs font-semibold tabular-nums ${winB ? "" : "opacity-40"}`}
            style={{ color }}
          >
            {scoreB}/100
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[hsl(220_14%_93%)]">
            <motion.div
              className="h-full rounded-full ml-auto"
              style={{ backgroundColor: winB ? color : `${color}50`, width: `${scoreB}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${scoreB}%` }}
              transition={{ duration: 0.8, delay: 0.15 + index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
