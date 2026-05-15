"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || loading) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push("/")
        router.refresh()
      } else {
        setError("Incorrect password. Try again.")
        setPassword("")
        inputRef.current?.focus()
      }
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[hsl(var(--surface))] px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] shadow-lg shadow-[hsl(262_72%_50%/0.3)]">
            <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))]">TrendPulse</h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Enter password to continue</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[hsl(var(--border))] bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-[hsl(var(--muted-foreground))]"
              >
                Password
              </label>
              <input
                ref={inputRef}
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError("") }}
                placeholder="••••••••"
                className={[
                  "w-full rounded-xl border px-4 py-2.5 text-sm text-[hsl(var(--foreground))] outline-none transition-all placeholder:text-[hsl(var(--muted-foreground))]",
                  error
                    ? "border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(262_72%_50%/0.12)]",
                ].join(" ")}
              />
              {error && (
                <p className="mt-1.5 text-xs text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] py-2.5 text-sm font-semibold text-white shadow-md shadow-[hsl(262_72%_50%/0.25)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
          TrendPulse AI · Viral Trend Intelligence
        </p>
      </div>
    </div>
  )
}
