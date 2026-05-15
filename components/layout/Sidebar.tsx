"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { TrendingUp, Zap, BarChart2, SquarePen, Settings, MessageCircle, Trash2, GitCompare, LogOut } from "lucide-react"
import type { ChatSession } from "@/hooks/useChatHistory"

const topics = [
  { icon: TrendingUp, label: "Viral Foods" },
  { icon: Zap, label: "Campus Culture" },
  { icon: BarChart2, label: "FMCG Signals" },
]

interface SidebarProps {
  activeTopic?: string
  activeSessionId?: string
  sessions: ChatSession[]
  onTopicClick: (topic: string) => void
  onNewChat: () => void
  onSessionSelect: (session: ChatSession) => void
  onSessionDelete: (id: string) => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function LogoutButton() {
  const logout = useLogout()
  return (
    <button
      onClick={logout}
      aria-label="Sign out"
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-red-50 hover:text-red-500"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      Sign out
    </button>
  )
}

function useLogout() {
  const router = useRouter()
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }
}

export function Sidebar({
  activeTopic,
  activeSessionId,
  sessions,
  onTopicClick,
  onNewChat,
  onSessionSelect,
  onSessionDelete,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      )}
    <aside className={[
      "h-full w-[240px] shrink-0 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))]",
      "fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:static lg:flex lg:translate-x-0",
      mobileOpen ? "flex translate-x-0" : "flex -translate-x-full lg:translate-x-0",
    ].join(" ")}>

      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
          <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
          TrendPulse
        </span>
      </div>

      {/* New Chat */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewChat}
          aria-label="Start new chat"
          className="flex w-full items-center gap-2.5 rounded-lg border border-[hsl(var(--border))] bg-white px-3 py-2 text-sm font-medium text-[hsl(var(--foreground))] shadow-sm transition-all hover:bg-[hsl(var(--muted))] hover:shadow-none active:scale-[0.98]"
        >
          <SquarePen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          New chat
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-[hsl(var(--border))]" />

      {/* Topics */}
      <div className="mt-4 px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Topics
        </p>
        <nav className="space-y-0.5" aria-label="Topic navigation">
          {topics.map(({ icon: Icon, label }) => {
            const isActive = activeTopic === label
            return (
              <button
                key={label}
                onClick={() => onTopicClick(label)}
                aria-pressed={isActive}
                className={[
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all",
                  isActive
                    ? "bg-[hsl(262_72%_50%/0.1)] font-medium text-[hsl(var(--primary))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Pages */}
      <div className="mt-4 px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Pages
        </p>
        <nav className="space-y-0.5" aria-label="Page navigation">
          <span
            aria-current="page"
            className="flex w-full items-center gap-2.5 rounded-lg bg-[hsl(262_72%_50%/0.08)] px-2.5 py-2 text-sm font-medium text-[hsl(var(--primary))]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" />
            Trend Chat
          </span>
          <Link
            href="/insights"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            <BarChart2 className="h-4 w-4 shrink-0" />
            Product Insights
          </Link>
          <Link
            href="/compare"
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          >
            <GitCompare className="h-4 w-4 shrink-0" />
            Compare
          </Link>
        </nav>
      </div>

      {/* Recent chats */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-3">
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
          Recent
        </p>

        {sessions.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))]">No recent chats</p>
        ) : (
          <nav className="space-y-0.5" aria-label="Recent chats">
            {sessions.map(session => {
              const isActive = activeSessionId === session.id
              return (
                <div
                  key={session.id}
                  className={[
                    "group flex w-full items-center gap-1 rounded-lg transition-colors",
                    isActive
                      ? "bg-[hsl(262_72%_50%/0.08)]"
                      : "hover:bg-[hsl(var(--muted))]",
                  ].join(" ")}
                >
                  <button
                    onClick={() => onSessionSelect(session)}
                    className="min-w-0 flex-1 px-2.5 py-2 text-left"
                  >
                    <p className={[
                      "truncate text-[12.5px] leading-snug",
                      isActive
                        ? "font-medium text-[hsl(var(--primary))]"
                        : "text-[hsl(var(--foreground))]",
                    ].join(" ")}>
                      {session.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                      {timeAgo(session.updatedAt)}
                    </p>
                  </button>

                  <button
                    onClick={e => { e.stopPropagation(); onSessionDelete(session.id) }}
                    aria-label="Delete chat"
                    className="mr-1.5 shrink-0 rounded-md p-1 text-[hsl(var(--muted-foreground))] opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </nav>
        )}
      </div>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--border))] p-2 space-y-0.5">
        <Link
          href="/settings"
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
        <LogoutButton />
      </div>
    </aside>
    </>
  )
}
