"use client"

import { useState, useCallback, useEffect } from "react"

const STORAGE_KEY = "nextwave_compare_history"
const MAX_ITEMS = 20

export interface CompareHistoryItem {
  id: string
  productA: string
  productB: string
  comparedAt: string
}

function load(): CompareHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CompareHistoryItem[]) : []
  } catch { return [] }
}

function save(items: CompareHistoryItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS))) } catch {}
}

export function useCompareHistory() {
  const [history, setHistory] = useState<CompareHistoryItem[]>([])

  useEffect(() => { setHistory(load()) }, [])

  const addItem = useCallback((productA: string, productB: string) => {
    const key = [productA, productB].map(s => s.toLowerCase()).sort().join("|")
    setHistory(prev => {
      const filtered = prev.filter(i =>
        [i.productA, i.productB].map(s => s.toLowerCase()).sort().join("|") !== key
      )
      const next = [{ id: crypto.randomUUID(), productA, productB, comparedAt: new Date().toISOString() }, ...filtered]
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
