"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Radio, Send, Loader2, AlertCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export function LiveTrendsView() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

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
      setResult(data.result ?? data.output ?? JSON.stringify(data, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[hsl(var(--border))] px-6">
        <Radio className="h-4 w-4 text-[hsl(var(--primary))]" />
        <h1 className="text-[15px] font-semibold text-[hsl(var(--foreground))]">Live Trends</h1>
      </div>

      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-[13px] font-medium text-[hsl(var(--muted-foreground))]">
              What trend do you want to investigate?
            </label>
            <div className="relative">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
                placeholder="e.g. Which street food trends are going viral in Turkey this week?"
                rows={3}
                className="w-full resize-none rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3 pr-12 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:ring-offset-1 transition-shadow"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                aria-label="Submit"
                className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-white transition-all hover:opacity-90 disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5"
              >
                {[80, 60, 90, 50, 70].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 animate-pulse rounded-full bg-[hsl(var(--muted))]"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[hsl(var(--border))] bg-white p-5"
              >
                <div className="prose prose-sm max-w-none text-[hsl(var(--foreground))] [&_a]:text-[hsl(var(--primary))] [&_h1]:text-base [&_h2]:text-[15px] [&_h3]:text-[13px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
