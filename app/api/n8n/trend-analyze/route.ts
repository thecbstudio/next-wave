import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"

// ─── Types ────────────────────────────────────────────────────────────────────

interface RedditPost {
  title: string
  subreddit: string
  upvotes?: number
  comments?: number
  url?: string
  created?: string
}

interface TikTokSignal {
  hashtag?: string
  viewCount?: number
  postCount?: number
  description?: string
}

interface N8NPayload {
  topic?: string                 // e.g. "Buldak noodles", "Stanley Cup", "Prime Hydration"
  redditPosts?: RedditPost[]     // from Reddit node
  tiktokSignals?: TikTokSignal[] // from TikTok / HTTP Request node
  extraContext?: string          // any other raw text data
}

interface TrendAnalysisResult {
  topic: string
  viralScore: number             // 0–100
  trajectory: "rising" | "peaking" | "declining" | "dormant"
  timeToMainstream: string       // e.g. "2–4 weeks", "already mainstream", "6+ months"
  targetDemographic: string
  keySignals: string[]           // top 3–5 bullet points
  redditSentiment: "very_positive" | "positive" | "neutral" | "negative" | "mixed"
  tiktokMomentum: "viral" | "growing" | "stable" | "low"
  prediction: string             // 2–3 sentence forward-looking analysis
  actionableInsight: string      // what a brand/retailer should do right now
  dataQuality: "rich" | "moderate" | "limited"
  analyzedAt: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function checkApiKey(req: Request): boolean {
  const apiKey = process.env.N8N_API_KEY
  if (!apiKey) return false // must set N8N_API_KEY in Vercel env
  const header = req.headers.get("x-api-key")
  return header === apiKey
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // 1. Auth
  if (!checkApiKey(req)) {
    return Response.json({ error: "Unauthorized — missing or invalid X-API-Key" }, { status: 401 })
  }

  // 2. Parse body
  let body: N8NPayload
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { topic, redditPosts = [], tiktokSignals = [], extraContext } = body

  if (!topic && redditPosts.length === 0 && tiktokSignals.length === 0) {
    return Response.json({ error: "Provide at least a topic, redditPosts, or tiktokSignals" }, { status: 400 })
  }

  // 3. Build context for Claude
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  let socialContext = ""

  if (redditPosts.length > 0) {
    socialContext += "\n\n## REDDIT DATA (live)\n"
    redditPosts.slice(0, 20).forEach(p => {
      socialContext += `- [r/${p.subreddit}] "${p.title}" — ${p.upvotes ?? "?"} upvotes, ${p.comments ?? "?"} comments\n`
    })
  }

  if (tiktokSignals.length > 0) {
    socialContext += "\n\n## TIKTOK DATA (live)\n"
    tiktokSignals.slice(0, 15).forEach(t => {
      if (t.hashtag) socialContext += `- Hashtag: #${t.hashtag} — ${t.viewCount?.toLocaleString() ?? "?"} views, ${t.postCount?.toLocaleString() ?? "?"} posts\n`
      if (t.description) socialContext += `  Context: ${t.description}\n`
    })
  }

  if (extraContext) {
    socialContext += `\n\n## EXTRA CONTEXT\n${extraContext}\n`
  }

  const systemPrompt = `Today's date: ${today}.

You are a senior consumer trend analyst specializing in food, beverage, and FMCG markets. You have access to LIVE social media data (Reddit + TikTok) provided below. Your job is to analyze this raw signal data and produce a structured, forward-looking trend report.

Be precise. Use the actual data provided — don't hallucinate signals that aren't there. If data is sparse, say so in dataQuality.

SCORING GUIDE for viralScore (0–100):
- 80–100: Already viral or about to explode (Buldak at peak, Prime launch week)
- 60–79: Strong emerging trend with clear signals
- 40–59: Moderate buzz, niche or regional
- 20–39: Early whispers, no broad momentum yet
- 0–19: Dormant or declining

You MUST return ONLY valid JSON matching this exact schema (no markdown, no explanation):
{
  "topic": string,
  "viralScore": number,
  "trajectory": "rising" | "peaking" | "declining" | "dormant",
  "timeToMainstream": string,
  "targetDemographic": string,
  "keySignals": string[],
  "redditSentiment": "very_positive" | "positive" | "neutral" | "negative" | "mixed",
  "tiktokMomentum": "viral" | "growing" | "stable" | "low",
  "prediction": string,
  "actionableInsight": string,
  "dataQuality": "rich" | "moderate" | "limited",
  "analyzedAt": string
}`

  const userMessage = `Analyze the following trend data and return JSON:\n\nTOPIC: ${topic || "Infer from the data below"}${socialContext}`

  // 4. Call Claude
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) {
    return Response.json({ error: "Server misconfiguration — missing ANTHROPIC_API_KEY" }, { status: 500 })
  }

  const client = new Anthropic({ apiKey: anthropicKey })

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""

    // Strip markdown if Claude wraps in ```json ... ```
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim()

    let result: TrendAnalysisResult
    try {
      result = JSON.parse(cleaned)
    } catch {
      return Response.json({ error: "Claude returned invalid JSON", raw }, { status: 502 })
    }

    // Always stamp analyzedAt server-side
    result.analyzedAt = new Date().toISOString()

    return Response.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: "Analysis failed", detail: msg }, { status: 500 })
  }
}
