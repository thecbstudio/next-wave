import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `You are a trend data analyst. Generate realistic historical trend data for a product based on your knowledge of its actual market trajectory.

Return ONLY valid JSON (no markdown):
{
  "points": [
    { "date": "MMM D", "value": <0-100> }
  ]
}

Rules:
- Generate exactly the number of daily data points requested
- Values should reflect the product's REAL trend history if you know it
- If the product peaked and declined, show that curve realistically
- If it's growing, show growth with realistic volatility
- Values 0-100, where 100 = absolute peak interest, 0 = no interest
- Add realistic day-to-day noise (±3-8 points)
- Do NOT make everything flat or linear — real trends have shape`

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })

  const { product } = await req.json()
  if (!product?.trim()) return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })

  const client = new Anthropic({ apiKey })

  try {
    const now = new Date()

    const generatePoints = async (days: number) => {
      // Build date labels
      const labels: string[] = []
      for (let i = days; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(now.getDate() - i)
        labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
      }

      const msg = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Product: "${product}"\nGenerate ${days + 1} daily data points for the last ${days} days.\nDates in order: ${labels.join(", ")}\n\nBase the values on this product's real trend trajectory you know about.`,
        }],
      })

      const text = msg.content[0].type === "text" ? msg.content[0].text : ""
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
      const parsed = JSON.parse(cleaned)
      return parsed.points as { date: string; value: number }[]
    }

    // Generate all 3 ranges in parallel using claude-haiku (fast + cheap)
    const [d7, d30, d90] = await Promise.all([
      generatePoints(7),
      generatePoints(30),
      generatePoints(90),
    ])

    return Response.json({
      source: "ai",
      data: { "7d": d7, "30d": d30, "90d": d90 },
    })
  } catch (err) {
    console.error("Trends error:", err)
    return Response.json({ source: "none", data: { "7d": [], "30d": [], "90d": [] } })
  }
}
