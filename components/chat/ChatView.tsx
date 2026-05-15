"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { Menu, SquarePen } from "lucide-react"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"
import { ChatInput } from "./ChatInput"
import { WelcomeScreen } from "./WelcomeScreen"
import { Sidebar } from "@/components/layout/Sidebar"
import { useChatHistory } from "@/hooks/useChatHistory"
import type { Message } from "@/types/chat"
import type { ChatSession } from "@/hooks/useChatHistory"

const TOPIC_PROMPTS: Record<string, string> = {
  "Viral Foods": "What food trends are showing early viral signals right now?",
  "Campus Culture": "What youth campus behaviors are shaping the next consumer wave?",
  "FMCG Signals": "Which FMCG categories are seeing the strongest signals among Gen Z?",
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTopic, setActiveTopic] = useState<string | undefined>()
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>()
  const [lastFailedContent, setLastFailedContent] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  const { sessions, upsertSession, deleteSession } = useChatHistory()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Auto-select session from ?session=<id> URL param (e.g. navigating from Insights/Compare sidebar)
  useEffect(() => {
    const sessionId = searchParams.get("session")
    if (!sessionId || sessions.length === 0) return
    const session = sessions.find(s => s.id === sessionId)
    if (session && activeSessionId !== sessionId) {
      setMessages(session.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) })))
      setActiveSessionId(session.id)
      setActiveTopic(undefined)
      setInput("")
      setIsLoading(false)
      setLastFailedContent(null)
      // Clean the URL param without a full navigation
      router.replace("/", { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, sessions])

  const sendMessage = useCallback(async (overrideContent?: string) => {
    const content = (overrideContent ?? input).trim()
    if (!content || isLoading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content, createdAt: new Date() }
    const assistantId = crypto.randomUUID()

    // Determine session id — create one if this is the first message
    const sessionId = activeSessionId ?? crypto.randomUUID()
    if (!activeSessionId) setActiveSessionId(sessionId)

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    setLastFailedContent(null)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok || !res.body) throw new Error("API error")

      setIsLoading(false)
      const assistantMsg: Message = { id: assistantId, role: "assistant", content: "", createdAt: new Date() }
      setMessages(prev => [...prev, assistantMsg])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullContent += chunk
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: m.content + chunk } : m)
        )
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      }

      // Persist after streaming completes
      const finalMessages: Message[] = [
        ...messages,
        userMsg,
        { id: assistantId, role: "assistant", content: fullContent, createdAt: new Date() },
      ]
      upsertSession(sessionId, finalMessages)

    } catch {
      setIsLoading(false)
      setLastFailedContent(content)
      setMessages(prev => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
          createdAt: new Date(),
        },
      ])
    }
  }, [input, isLoading, messages, activeSessionId, upsertSession])

  const handleTopicClick = (topic: string) => {
    setActiveTopic(topic)
    sendMessage(TOPIC_PROMPTS[topic])
  }

  const handleNewChat = useCallback(() => {
    setMessages([])
    setInput("")
    setIsLoading(false)
    setActiveTopic(undefined)
    setActiveSessionId(undefined)
    setLastFailedContent(null)
  }, [])

  const handleSessionSelect = useCallback((session: ChatSession) => {
    setMessages(session.messages.map(m => ({ ...m, createdAt: new Date(m.createdAt) })))
    setActiveSessionId(session.id)
    setActiveTopic(undefined)
    setInput("")
    setIsLoading(false)
    setLastFailedContent(null)
  }, [])

  const handleSessionDelete = useCallback((id: string) => {
    deleteSession(id)
    if (activeSessionId === id) handleNewChat()
  }, [deleteSession, activeSessionId, handleNewChat])

  const handleRetry = useCallback(() => {
    if (!lastFailedContent) return
    // Remove the error message, then resend
    setMessages(prev => prev.filter(m => m.content !== "⚠️ Something went wrong. Please try again."))
    sendMessage(lastFailedContent)
  }, [lastFailedContent, sendMessage])

  const isEmpty = messages.length === 0 && !isLoading

  // Find the last assistant error message for retry UI
  const lastMsg = messages[messages.length - 1]
  const hasError = lastMsg?.role === "assistant" &&
    lastMsg.content === "⚠️ Something went wrong. Please try again."

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar
        activeTopic={activeTopic}
        activeSessionId={activeSessionId}
        sessions={sessions}
        onTopicClick={t => { handleTopicClick(t); setMobileMenuOpen(false) }}
        onNewChat={() => { handleNewChat(); setMobileMenuOpen(false) }}
        onSessionSelect={s => { handleSessionSelect(s); setMobileMenuOpen(false) }}
        onSessionDelete={handleSessionDelete}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-[hsl(var(--border))] px-4 lg:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {activeTopic ?? "Intelligence"}
            </span>
            {activeTopic && (
              <span className="hidden sm:inline rounded-md bg-[hsl(262_72%_50%/0.08)] px-2 py-0.5 text-xs font-medium text-[hsl(var(--primary))]">
                {activeTopic}
              </span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Mobile new chat */}
            <button
              onClick={handleNewChat}
              aria-label="New chat"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] lg:hidden"
            >
              <SquarePen className="h-4 w-4" />
            </button>
            <span className="hidden sm:inline text-xs text-[hsl(var(--muted-foreground))]">TrendPulse AI</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {isEmpty ? (
            <WelcomeScreen onSuggest={sendMessage} />
          ) : (
            <div
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
              className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6"
            >
              {messages.map((msg, i) => {
                const prevMsg = messages[i - 1]
                const showAvatar = msg.role === "assistant" && (!prevMsg || prevMsg.role !== "assistant")
                return <MessageBubble key={msg.id} message={msg} showAvatar={showAvatar} />
              })}

              <AnimatePresence>
                {isLoading && <TypingIndicator key="typing" />}
              </AnimatePresence>

              {/* Retry button */}
              {hasError && lastFailedContent && (
                <div className="flex justify-center">
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] shadow-sm transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                    Try again
                  </button>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => sendMessage()}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
