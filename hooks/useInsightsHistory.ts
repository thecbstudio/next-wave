"use client"

import { useState, useCallback, useEffect } from "react"

const STORAGE_KEY = "nextwave_insights_history"
const MAX_ITEMS = 20

export interface InsightsHistoryItem {
  id: string
  productName: string
  analyzedAt: string
}

function load(): InsightsHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as InsightsHistoryItem[]) : []
  } catch { return [] }
}

function save(items: InsightsHistoryItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))) } catch {}
}

export function useInsightsHistory() {
  const [history, setHistory] = useState<InsightsHistoryItem[]>([])

  useEffect(() => { setHistory(load()) }, [])

  const addItem = useCallback((productName: string) => {
    setHistory(prev => {
      const filtered = prev.filter(i => i.productName.toLowerCase() !== productName.toLowerCase())
      const next = [{ id: crypto.randomUUID(), productName, analyzedAt: new Date().toISOString() }, ...filtered]
      save(next)
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setHistory(prev => {
      const next = prev.filter(i => i.id !== id)
      save(next)
      return next
    })
  }, [])

  return { history, addItem, removeItem }
}
