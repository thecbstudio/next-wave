// ─── Shared API types ─────────────────────────────────────────────────────────

export interface InsightsResult {
  name: string
  category: string
  badge: string
  scores: { growth: number; demand: number; momentum: number }
  metrics: { id: string; label: string; description: string; score: number; color: string }[]
  signals: { id: string; label: string; description: string; score: number; color: string }[]
}

export interface TrendsResult {
  source: "wikipedia" | "ai" | "fallback"
  title?: string
  data: {
    "7d": { date: string; value: number }[]
    "30d": { date: string; value: number }[]
    "90d": { date: string; value: number }[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data?.error === "not_a_product") {
    throw new Error("Please enter a food or FMCG product name")
  }

  if (!res.ok) {
    throw new Error("Analysis failed — please try again")
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data as T
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchInsights(
  product: string,
  image?: string,
  mediaType?: string,
): Promise<InsightsResult> {
  const body: Record<string, unknown> = { product }
  if (image) body.image = image
  if (mediaType) body.mediaType = mediaType
  return post<InsightsResult>("/api/insights", body)
}

export async function fetchTrends(product: string): Promise<TrendsResult> {
  return post<TrendsResult>("/api/trends", { product })
}
