"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Send, Loader2, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const POLL_INTERVAL = 2000
const POLL_MAX = 150

export function LiveTrendsView() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string>("")
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  async function pollStatus(jobId: string) {
    let attempts = 0
    stopPolling()

    pollRef.current = setInterval(async () => {
      attempts++
      if (attempts > POLL_MAX) {
        stopPolling()
        setLoading(false)
        setError("Analysis is taking too long. Please try again.")
        return
      }

      try {
        const res = await fetch(`/api/live-trends/status?jobId=${jobId}`)
        if (!res.ok) return
        const data = await res.json()

        if (data.status === "done") {
          stopPolling()
          setResult(data.answer)
          setLoading(false)
          setStatusMsg("")
        } else if (data.status === "error") {
          stopPolling()
          setError(data.error || "Analysis failed.")
          setLoading(false)
          setStatusMsg("")
        } else if (data.status === "processing") {
          const secs = attempts * (POLL_INTERVAL / 1000)
          if (secs < 20) setStatusMsg("Scraping TikTok & Reddit...")
          else if (secs < 50) setStatusMsg("Analyzing trend signals with Claude Sonnet...")
          else setStatusMsg("Almost done...")
        }
      } catch { /* ignore */ }
    }, POLL_INTERVAL)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    setResult(null)
    setStatusMsg("Starting analysis...")

    try {
      const res = await fetch("/api/live-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: query.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(err.error || `Error ${res.status}`)
      }

      const data = await res.json()

      if (data.jobId) {
        setStatusMsg("Scraping TikTok & Reddit...")
        pollStatus(data.jobId)
      } else {
        setResult(data.answer ?? JSON.stringify(data, null, 2))
        setLoading(false)
        setStatusMsg("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
      setStatusMsg("")
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[hsl(var(--surface))]">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] bg-white px-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, hsl(262,82%,60%), hsl(262,68%,42%))", boxShadow: "0 3px 8px hsl(262 72% 50% / 0.3)" }}
        >
          <Radio className="h-3.5 w-3.5 text-white" />
        </div>
        <h1 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Live Trends</h1>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl space-y-5">

          <div
            className="rounded-2xl border border-[hsl(var(--border))] bg-white p-5"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)" }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-[13px] font-semibold text-[hsl(var(--foreground))]">
                What trend do you want to investigate?
              </label>
              <div className="relative">
                <textarea
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e as unknown as React.FormEvent)
                    }
                  }}
                  placeholder="e.g. Which street food trends are going viral in Turkey this week?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-3 pr-12 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 transition-shadow"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || loading}
                  aria-label="Submit"
                  className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, hsl(262,82%,60%), hsl(262,68%,42%))" }}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                Press Enter to submit · Shift+Enter for new line
              </p>
            </form>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-3 rounded-2xl border border-[hsl(var(--border))] bg-white p-6"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)" }}
              >
                {statusMsg && (
                  <div className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--primary))]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {statusMsg}
                  </div>
                )}
                <div className="space-y-2.5">
                  {[80, 60, 90, 50, 70].map((w, i) => (
                    <div key={i} className="h-3 animate-pulse rounded-full bg-[hsl(var(--muted))]" style={{ width: `${w}%` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-white"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.05)" }}
              >
                <div
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white"
                  style={{ background: "linear-gradient(135deg, hsl(262,82%,60%), hsl(262,68%,42%))" }}
                >
                  Analysis Results
                </div>
                <div className="p-5">
                  <div className="prose prose-sm max-w-none text-[hsl(var(--foreground))] [&_a]:text-[hsl(var(--primary))] [&_h1]:text-base [&_h2]:text-[15px] [&_h3]:text-[13px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
