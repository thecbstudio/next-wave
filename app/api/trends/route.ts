import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 30

const SYSTEM_PROMPT = `You are a trend data analyst. Generate realistic historical trend data for a product based on your knowledge of its actual market trajectory.

Return ONLY valid JSON (no markdown):
{
  "7d":  [ { "date": "MMM D", "value": <0-100> } ],
  "30d": [ { "date": "MMM D", "value": <0-100> } ],
  "90d": [ { "date": "MMM D", "value": <0-100> } ]
}

Rules:
- 7d: exactly 8 points, 30d: exactly 31 points, 90d: exactly 91 points
- Values should reflect the product's REAL trend history if you know it
- If the product peaked and declined, show that curve realistically
- Values 0-100, where 100 = absolute peak interest
- Add realistic day-to-day noise (+-3-8 points)
- Do NOT make everything flat or linear`

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })

  const { product } = await req.json()
  if (!product?.trim()) return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })

  const client = new Anthropic({ apiKey })

  try {
    const now = new Date()

    const buildLabels = (days: number) => {
      const labels: string[] = []
      for (let i = days; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
      }
      return labels
    }

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Product: "${product}"
Generate trend data for all three ranges.
7d dates (8 points): ${buildLabels(7).join(", ")}
30d dates (31 points): ${buildLabels(30).join(", ")}
90d dates (91 points): ${buildLabels(90).join(", ")}
Base values on this product's real trend trajectory.
Keep JSON compact - no extra whitespace.`,
      }],
    })

    const text = msg.content[0].type === "text" ? msg.content[0].text : ""
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()

    let parsed: Record<string, Array<{ date: string; value: number }>>
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error("Trends: no JSON object found in response")
        return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })
      }
      try {
        parsed = JSON.parse(match[0])
      } catch {
        const extract = (key: string) => {
          const re = new RegExp(`"${key}"\\s*:\\s*(\\[[\\s\\S]*?\\])`, "m")
          const m = cleaned.match(re)
          if (!m) return []
          try { return JSON.parse(m[1]) } catch { return [] }
        }
        parsed = { "7d": extract("7d"), "30d": extract("30d"), "90d": extract("90d") }
      }
    }

    return Response.json({
      source: "ai",
      data: {
        "7d": parsed["7d"] ?? [],
        "30d": parsed["30d"] ?? [],
        "90d": parsed["90d"] ?? [],
      },
    })
  } catch (err) {
    console.error("Trends error:", err)
    return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })
  }
}