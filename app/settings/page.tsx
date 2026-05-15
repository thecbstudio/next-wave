"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Key, Webhook, Info, LogOut } from "lucide-react"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-white shadow-sm">
      <div className="border-b border-[hsl(var(--border))] px-6 py-4">
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h2>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">{children}</div>
    </div>
  )
}

function Row({ label, description, children }: { label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Badge({ children, color = "purple" }: { children: React.ReactNode; color?: "purple" | "green" | "gray" }) {
  const cls = {
    purple: "bg-[hsl(262_72%_50%/0.08)] text-[hsl(var(--primary))]",
    green:  "bg-emerald-50 text-emerald-600",
    gray:   "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
  }[color]
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{children}</span>
  )
}

export default function SettingsPage() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <div className="flex h-full w-full flex-col bg-[hsl(var(--surface))]">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-[hsl(var(--border))] bg-white px-6">
        <Link href="/" className="flex items-center gap-1.5 rounded-lg border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]">
          <ArrowLeft className="h-3.5 w-3.5" />Back
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
            <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Settings</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-8 space-y-5">

        {/* Account */}
        <Section title="Account">
          <Row label="Status" description="You are signed in to TrendPulse">
            <Badge color="green">Active</Badge>
          </Row>
          <Row label="Auth method" description="Password-based session (30 days)">
            <Badge color="gray">Cookie</Badge>
          </Row>
          <div className="px-6 py-4">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />Sign out
            </button>
          </div>
        </Section>

        {/* AI Model */}
        <Section title="AI Model">
          <Row label="Chat model" description="Used for trend analysis conversations">
            <Badge>claude-sonnet-4-6</Badge>
          </Row>
          <Row label="Insights model" description="Used for product scoring and vision">
            <Badge>claude-sonnet-4-6</Badge>
          </Row>
          <Row label="Trends model" description="Used for chart data generation">
            <Badge color="gray">claude-haiku-4-5</Badge>
          </Row>
        </Section>

        {/* Integrations */}
        <Section title="Integrations">
          <Row
            label="n8n Webhook"
            description={process.env.NEXT_PUBLIC_N8N_ENABLED === "true" ? "Connected — real-time data via Apify" : "Not configured — using Claude AI fallback"}
          >
            <Badge color={process.env.NEXT_PUBLIC_N8N_ENABLED === "true" ? "green" : "gray"}>
              {process.env.NEXT_PUBLIC_N8N_ENABLED === "true" ? "Connected" : "Fallback"}
            </Badge>
          </Row>
          <Row label="Data sources" description="When n8n is active: TikTok + Reddit via Apify scrapers">
            <div className="flex gap-1.5">
              <Badge color="gray">TikTok</Badge>
              <Badge color="gray">Reddit</Badge>
            </div>
          </Row>
        </Section>

        {/* API */}
        <Section title="API">
          <Row label="Anthropic API" description="Key configured via environment variable">
            <div className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
              <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">sk-ant-***</span>
            </div>
          </Row>
          <Row label="Webhook URL" description="Set N8N_WEBHOOK_URL in .env.local">
            <Webhook className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-40" />
          </Row>
        </Section>

        {/* About */}
        <Section title="About">
          <Row label="TrendPulse" description="AI-powered viral trend intelligence for food & FMCG">
            <Badge color="gray">v0.1</Badge>
          </Row>
          <Row label="Powered by" description="Anthropic Claude API">
            <Info className="h-4 w-4 text-[hsl(var(--muted-foreground))] opacity-40" />
          </Row>
        </Section>

        </div>
      </main>
    </div>
  )
}
