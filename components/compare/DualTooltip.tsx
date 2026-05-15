"use client"

interface DualTooltipProps {
  active?: boolean
  payload?: { dataKey: string; value: number; color: string }[]
  label?: string
  nameA: string
  nameB: string
}

export function DualTooltip({ active, payload, label, nameA, nameB }: DualTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-[11px] text-[hsl(var(--muted-foreground))]">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[11px] text-[hsl(var(--foreground))]">
            {p.dataKey === "valueA" ? nameA : nameB}:
          </span>
          <span className="text-[11px] font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}
