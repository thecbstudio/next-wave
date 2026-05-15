"use client"

import { useState, useCallback, useEffect } from "react"
import type { Message } from "@/types/chat"

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "trendpulse_chats"
const MAX_SESSIONS = 30

function loadFromStorage(): ChatSession[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    // Dates come back as strings from JSON — keep them as strings (ISO)
    return JSON.parse(raw) as ChatSession[]
  } catch {
    return []
  }
}

function persist(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
  } catch {
    // Storage full or unavailable — silently skip
  }
}

function deriveTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === "user")
  if (!first) return "New chat"
  const text = first.content.trim()
  return text.length > 48 ? text.slice(0, 47) + "…" : text
}

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setSessions(loadFromStorage())
  }, [])

  /** Create or update a session. Call after every AI response. */
  const upsertSession = useCallback((id: string, messages: Message[]) => {
    if (messages.length === 0) return
    const now = new Date().toISOString()

    setSessions(prev => {
      const exists = prev.some(s => s.id === id)
      let next: ChatSession[]

      if (exists) {
        next = prev.map(s =>
          s.id === id
            ? { ...s, messages, title: deriveTitle(messages), updatedAt: now }
            : s
        )
        // Bubble updated session to top
        const idx = next.findIndex(s => s.id === id)
        if (idx > 0) {
          const [item] = next.splice(idx, 1)
          next = [item, ...next]
        }
      } else {
        const newSession: ChatSession = {
          id,
          title: deriveTitle(messages),
          messages,
          createdAt: now,
          updatedAt: now,
        }
        next = [newSession, ...prev]
      }

      persist(next)
      return next
    })
  }, [])

  /** Remove a session by id */
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      persist(next)
      return next
    })
  }, [])

  return { sessions, upsertSession, deleteSession }
}
